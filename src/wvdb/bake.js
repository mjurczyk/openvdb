import {
  GridDescriptor,
  Vector3,
  doubleType,
  floatType,
  halfFloatType,
  int32Type,
  int64Type,
  vec3dType,
  vec3hType,
  vec3iType,
  vec3sType,
  brickDim,
  brickVoxels,
  encodeWVDBMask,
  encodeWVDBPage,
  getBrickCounts,
  getBrickOrigin,
  sampleLevelSet,
  writeWVDBFile,
  wvdbLayouts,
  wvdbVersion,
} from 'openvdb';

export const bakeDefaults = {
  // NOTE Grid names to keep. Null keeps all scalar grids.
  grids: null,
  // NOTE Texels on the longest box side of the finest LOD. Texels are cubes.
  resolution: 128,
  lods: 3,
  bits: 8,
  layout: wvdbLayouts.sparse,
  // NOTE Bricks per page chunk
  pageBricks: 1024,
  // NOTE World box [[minX, minY, minZ], [maxX, maxY, maxZ]] for all grids. Null uses the box of all grids in the file.
  // Frames of a sequence use one box. Then voxels do not move between frames.
  bbox: null,
};

const isVector = (value) =>
  !!value && typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number';

const scalarTypes = [floatType, doubleType, halfFloatType, int32Type, int64Type];
const vectorTypes = [vec3sType, vec3dType, vec3hType, vec3iType];

// NOTE Scalar grids have 1 channel, vector grids 3. Other grids are not supported.
// The value type is in the grid header, so this works without the tree too.
const getChannels = (grid) => {
  if (!(grid instanceof GridDescriptor) || grid.isSkipped) {
    return 0;
  }

  const valueType = grid.getGridValueType();

  if (scalarTypes.includes(valueType)) {
    return 1;
  }

  return vectorTypes.includes(valueType) ? 3 : 0;
};

const getBackground = (grid) => {
  const { background } = grid.root;

  return typeof background === 'number'
    ? [Math.fround(background)]
    : [Math.fround(background.x), Math.fround(background.y), Math.fround(background.z)];
};

// NOTE With a tree, empty grids have no active voxels. Without a tree, empty grids store an inverted box.
const isEmptyGrid = (grid) => {
  if (grid.root) {
    return !grid.evalActiveVoxelBoundingBox();
  }

  const { file_voxel_count: voxelCount, file_bbox_min: min, file_bbox_max: max } =
    grid.metadata || {};

  if (voxelCount && Number(voxelCount.value) === 0) {
    return true;
  }

  return (
    !min ||
    !max ||
    min.value.x > max.value.x ||
    min.value.y > max.value.y ||
    min.value.z > max.value.z
  );
};

const validateOptions = ({ resolution, lods, bits, layout, pageBricks, bbox }) => {
  if (!Number.isInteger(resolution) || resolution < 1) {
    throw new Error(`Invalid resolution: ${resolution}`);
  }

  if (!Number.isInteger(lods) || lods < 1) {
    throw new Error(`Invalid LOD count: ${lods}`);
  }

  if (bits !== 8 && bits !== 16) {
    throw new Error(`Invalid quantization bits: ${bits}. Use 8 or 16.`);
  }

  if (!Object.values(wvdbLayouts).includes(layout)) {
    throw new Error(`Invalid layout: ${layout}`);
  }

  if (!Number.isInteger(pageBricks) || pageBricks < 1) {
    throw new Error(`Invalid page brick count: ${pageBricks}`);
  }

  if (bbox && !(bbox.length === 2 && bbox.every((corner) => corner.length === 3))) {
    throw new Error('Invalid box.');
  }
};

// NOTE Grids of the file that bakeWVDB keeps
const getBakedGrids = (vdb, names) =>
  Object.values(vdb.grids).filter(
    (grid) => (!names || names.includes(grid.gridName)) && getChannels(grid) > 0
  );

// NOTE Box of all non-empty baked grids, or null when all are empty
export const getWVDBBox = (vdb, names = null) => {
  const boxes = getBakedGrids(vdb, names)
    .filter((grid) => !isEmptyGrid(grid))
    .map((grid) => grid.getPreciseWorldBbox());

  if (!boxes.length) {
    return null;
  }

  const min = boxes.reduce((box, [corner]) => box.min(corner), boxes[0][0].clone());
  const max = boxes.reduce((box, [, corner]) => box.max(corner), boxes[0][1].clone());

  return [min.toArray(), max.toArray()];
};

export const mergeWVDBBoxes = (a, b) => {
  if (!a || !b) {
    return a || b;
  }

  return [
    a[0].map((value, axis) => Math.min(value, b[0][axis])),
    a[1].map((value, axis) => Math.max(value, b[1][axis])),
  ];
};

// NOTE Cube-shaped texels, same as FrameVolume in three-openvdb. The longest box side has resolution texels.
const getFinestDimensions = (size, resolution) => {
  const longest = Math.max(size.x, size.y, size.z);

  if (!(longest > 0.0)) {
    return [resolution, resolution, resolution];
  }

  return size.toArray().map((side) => Math.max(1, Math.round((side * resolution) / longest)));
};

// NOTE Point samples at texel centres, same as FrameVolume.convert in three-openvdb.
// Level sets use sampleLevelSet (mean of samples where texels cross the surface).
// Vector grids give 3 planes, one channel after the other.
const sampleGrid = (grid, min, size, dimensions, bits, channels) => {
  const count = dimensions[0] * dimensions[1] * dimensions[2];
  const values = new Float32Array(count * channels);
  const background = getBackground(grid);

  if (isEmptyGrid(grid)) {
    background.forEach((value, channel) => values.fill(value, channel * count, (channel + 1) * count));

    return values;
  }

  if (channels === 3) {
    return sampleVectorGrid(grid, min, size, dimensions, values, background);
  }

  if (grid.isLevelSet()) {
    return sampleLevelSetGrid(grid, min, size, dimensions, bits, values);
  }

  return sampleScalarGrid(grid, min, size, dimensions, values);
};

const forEachTexel = (grid, min, size, [width, height, depth], callback) => {
  const world = new Vector3();
  const index = new Vector3();

  let offset = 0;

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        world
          .set((x + 0.5) / width, (y + 0.5) / height, (z + 0.5) / depth)
          .multiply(size)
          .add(min);
        grid.transform.applyInverseTransformMap(index.copy(world));

        callback(index, offset++);
      }
    }
  }
};

const sampleVectorGrid = (grid, min, size, dimensions, values, background) => {
  const count = dimensions[0] * dimensions[1] * dimensions[2];

  forEachTexel(grid, min, size, dimensions, (index, offset) => {
    const value = grid.getValue(index);
    const vector = isVector(value) ? [value.x, value.y, value.z] : background;

    vector.forEach((component, channel) => {
      values[channel * count + offset] = Number.isFinite(component) ? component : background[channel];
    });
  });

  return values;
};

const sampleScalarGrid = (grid, min, size, dimensions, values) => {
  const background = grid.root.background;

  forEachTexel(grid, min, size, dimensions, (index, offset) => {
    const value = grid.getValue(index);

    values[offset] = Number.isFinite(value) ? value : background;
  });

  return values;
};

const sampleLevelSetGrid = (grid, min, size, dimensions, bits, values) => {
  const background = grid.root.background;

  // NOTE Values in the band stay one quantization step inside it. Then they never decode as outside the band.
  const bandLimit = background - (2.0 * background) / ((1 << bits) - 1);

  const task = sampleLevelSet(grid, { min, size, dimensions }, values);

  while (!task.next().done);

  for (let i = 0; i < values.length; i++) {
    if (Math.abs(values[i]) < background) {
      values[i] = Math.min(Math.max(values[i], -bandLimit), bandLimit);
    }
  }

  return values;
};

// NOTE Box filter, 2 texels to 1 on each axis. Each channel plane alone.
const downsample = (values, [width, height, depth], channels) => {
  const dimensions = [Math.ceil(width / 2), Math.ceil(height / 2), Math.ceil(depth / 2)];
  const [outWidth, outHeight, outDepth] = dimensions;
  const count = width * height * depth;
  const outCount = outWidth * outHeight * outDepth;
  const result = new Float32Array(outCount * channels);

  for (let channel = 0; channel < channels; channel++) {
    downsamplePlane(
      values.subarray(channel * count, (channel + 1) * count),
      [width, height, depth],
      result.subarray(channel * outCount, (channel + 1) * outCount),
      dimensions
    );
  }

  return { values: result, dimensions };
};

const downsamplePlane = (values, [width, height, depth], result, [outWidth, outHeight, outDepth]) => {
  let offset = 0;

  for (let z = 0; z < outDepth; z++) {
    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        let sum = 0.0;
        let count = 0;

        for (let dz = 0; dz < 2; dz++) {
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const sx = 2 * x + dx;
              const sy = 2 * y + dy;
              const sz = 2 * z + dz;

              if (sx < width && sy < height && sz < depth) {
                sum += values[sx + sy * width + sz * width * height];
                count++;
              }
            }
          }
        }

        result[offset++] = sum / count;
      }
    }
  }
};

// NOTE Mean and count of the non-zero texels. Same texels as the reader: level sets 1.0 in the band, else 8-bit clamp(value).
const getDensityStats = (values, background, isLevelSet) => {
  let sum = 0;
  let count = 0;

  for (let i = 0; i < values.length; i++) {
    const texel = isLevelSet
      ? Math.abs(values[i]) < background
        ? 255
        : 0
      : (Math.min(Math.max(values[i], 0.0), 1.0) * 255.0) | 0;

    if (texel > 0) {
      sum += texel;
      count++;
    }
  }

  return { meanDensity: count > 0 ? sum / 255.0 / count : 0.0, nonZeroVoxels: count };
};

// NOTE Voxels outside the LOD copy the nearest edge voxel. Then they do not change the brick range.
const getBrickValues = (values, dimensions, index, channels) => {
  const [width, height, depth] = dimensions;
  const [originX, originY, originZ] = getBrickOrigin(dimensions, index);
  const count = width * height * depth;
  const brick = new Float32Array(brickVoxels * channels);

  let voxel = 0;

  for (let channel = 0; channel < channels; channel++) {
    const plane = channel * count;

    for (let z = 0; z < brickDim; z++) {
      const sz = Math.min(originZ + z, depth - 1);

      for (let y = 0; y < brickDim; y++) {
        const sy = Math.min(originY + y, height - 1);

        for (let x = 0; x < brickDim; x++) {
          const sx = Math.min(originX + x, width - 1);

          brick[voxel++] = values[plane + sx + sy * width + sz * width * height];
        }
      }
    }
  }

  return brick;
};

const encodeLod = (values, dimensions, background, channels, options, compress) => {
  const { layout, bits, pageBricks } = options;
  const isSparse = layout === wvdbLayouts.sparse;
  const [countX, countY, countZ] = getBrickCounts(dimensions);
  const total = countX * countY * countZ;

  const bricks = [];

  for (let index = 0; index < total; index++) {
    let isBackground = true;
    let weight = 0.0;

    getBrickValues(values, dimensions, index, channels).forEach((value, voxel) => {
      const channelBackground = background[Math.floor(voxel / brickVoxels)];

      isBackground = isBackground && value === channelBackground;
      weight += Math.abs(value - channelBackground);
    });

    if (isSparse && isBackground) {
      continue;
    }

    bricks.push({ index, weight });
  }

  // NOTE Important bricks first. Index order makes the result the same on each run.
  if (isSparse) {
    bricks.sort((a, b) => b.weight - a.weight || a.index - b.index);
  }

  const pages = [];

  for (let start = 0; start < bricks.length; start += pageBricks) {
    const page = bricks
      .slice(start, start + pageBricks)
      .map(({ index }) => ({ index, values: getBrickValues(values, dimensions, index, channels) }));

    pages.push({
      bricks: page.length,
      bytes: compress(encodeWVDBPage(page, { layout, bits, channels })),
    });
  }

  return {
    bricks: bricks.length,
    mask: isSparse
      ? compress(
          encodeWVDBMask(
            bricks.map(({ index }) => index),
            total
          )
        )
      : null,
    pages,
  };
};

const getGridNames = (grids) => {
  const counts = {};

  grids.forEach(({ gridName }) => {
    counts[gridName] = (counts[gridName] || 0) + 1;
  });

  return grids.map(({ gridName, uniqueName }) => (counts[gridName] > 1 ? uniqueName : gridName));
};

// NOTE compress(Uint8Array) must return zlib (deflate) bytes. Same input and options give the same bytes.
export const bakeWVDB = (vdb, options, { compress, source }) => {
  const settings = { ...bakeDefaults, ...options };
  validateOptions(settings);

  const { resolution, lods, bits, layout, pageBricks } = settings;

  Object.values(vdb.grids)
    .filter(
      (grid) => (!settings.grids || settings.grids.includes(grid.gridName)) && !getChannels(grid)
    )
    .forEach((grid) =>
      console.warn(`Grid "${grid.gridName}" is not a scalar or vector grid. Skipped.`)
    );

  const grids = getBakedGrids(vdb, settings.grids);

  if (!grids.length) {
    console.warn('No grids to bake. The file has no grids.');
  }

  const names = getGridNames(grids);

  // NOTE All grids use one box. Then emission and colour grids line up with density.
  const bbox = settings.bbox || getWVDBBox(vdb, settings.grids);
  const min = bbox ? new Vector3().fromArray(bbox[0]) : new Vector3();
  const size = bbox ? new Vector3().fromArray(bbox[1]).sub(min) : new Vector3();
  const dimensions = getFinestDimensions(size, resolution);

  const encodedGrids = grids.map((grid, gridIndex) => {
    const channels = getChannels(grid);
    const background = getBackground(grid);
    const gridClass = grid.metadata?.class?.value || 'unknown';

    const levels = [];
    levels[lods - 1] = {
      values: sampleGrid(grid, min, size, dimensions, bits, channels),
      dimensions,
    };

    for (let lod = lods - 2; lod >= 0; lod--) {
      levels[lod] = downsample(levels[lod + 1].values, levels[lod + 1].dimensions, channels);
    }

    return {
      name: names[gridIndex],
      class: gridClass,
      // NOTE Finest LOD only. Coarse LODs spread density into empty texels, so their mean is lower.
      stats:
        channels === 1
          ? getDensityStats(levels[lods - 1].values, background[0], gridClass === 'level set')
          : null,
      channels,
      background: channels === 1 ? background[0] : background,
      bbox,
      lods: levels.map(({ values, dimensions }) => ({
        dimensions,
        ...encodeLod(values, dimensions, background, channels, settings, compress),
      })),
    };
  });

  // NOTE Coarse LODs of all grids come first
  const chunks = [];
  const headerLods = encodedGrids.map(() => []);

  for (let lod = 0; lod < lods; lod++) {
    encodedGrids.forEach((grid, gridIndex) => {
      const { dimensions, bricks, mask, pages } = grid.lods[lod];
      const entry = { dimensions, bricks };

      if (mask) {
        entry.mask = { offset: 0, length: 0 };
        chunks.push({ bytes: mask, entry: entry.mask });
      }

      entry.pages = pages.map((page) => {
        const pageEntry = { offset: 0, length: 0, bricks: page.bricks };
        chunks.push({ bytes: page.bytes, entry: pageEntry });

        return pageEntry;
      });

      headerLods[gridIndex][lod] = entry;
    });
  }

  const header = {
    version: wvdbVersion,
    source,
    bake: { grids: settings.grids, resolution, lods, bits, layout, pageBricks, bbox: settings.bbox },
    brickDim,
    grids: encodedGrids.map((grid, gridIndex) => ({
      name: grid.name,
      class: grid.class,
      channels: grid.channels,
      background: grid.background,
      bbox: grid.bbox,
      ...grid.stats,
      lods: headerLods[gridIndex],
    })),
  };

  return { bytes: writeWVDBFile(header, chunks), header };
};

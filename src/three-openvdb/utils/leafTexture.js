import { GridDescriptor } from 'openvdb';

export const textureBuilds = {
  sample: 'sample',
  leaves: 'leaves',
};

export const textureFilters = {
  nearest: 'nearest',
  trilinear: 'trilinear',
  max: 'max',
};

// NOTE Workers run this function from its source text. It must not use imports or names from outside the function.
export function leafTextureKernel() {
  const halfScratch = new Float32Array(1);
  const halfScratchBits = new Uint32Array(halfScratch.buffer);

  const toHalf = (value) => {
    halfScratch[0] = value;

    const bits = halfScratchBits[0];
    const sign = (bits >>> 16) & 0x8000;
    let exponent = ((bits >>> 23) & 0xff) - 127 + 15;
    let mantissa = bits & 0x7fffff;

    if (exponent >= 31) {
      return sign | 0x7c00;
    }

    if (exponent <= 0) {
      if (exponent < -10) {
        return sign;
      }

      mantissa = (mantissa | 0x800000) >> (1 - exponent);

      return sign | ((mantissa + 0x1000) >> 13);
    }

    mantissa += 0x1000;

    if (mantissa & 0x800000) {
      mantissa = 0;
      exponent++;
    }

    return exponent >= 31 ? sign | 0x7c00 : sign | (exponent << 10) | (mantissa >> 13);
  };

  const create = ({ resolution, start, step, filter, background, leafLog2Dim }) => {
    const resolutionPow2 = resolution * resolution;
    const total = resolutionPow2 * resolution;
    const isTrilinear = filter === 'trilinear';
    const isMax = filter === 'max';

    const leafDim = 1 << leafLog2Dim;
    const leafNumValues = 1 << (3 * leafLog2Dim);
    const leafNumWords = Math.ceil(leafNumValues / 32);

    // NOTE Current leaf in the chunk. Level set leaves use value mask words, fog leaves use values.
    let leafWords = null;
    let leafValues = null;
    let leafOffset = 0;

    // NOTE Read voxels on demand. Nearest and trilinear read few voxels per leaf when texels are larger than voxels.
    const getLeafDensity = (offset) =>
      leafWords
        ? (leafWords[leafOffset * leafNumWords + (offset >> 5)] >>> (offset & 31)) & 1
        : Math.min(Math.max(leafValues[leafOffset * leafNumValues + offset], 0.0), 1.0);

    // NOTE Trilinear mode keeps weighted sums. Texels with partial weight get the background for the rest.
    const values = new Float32Array(total);
    const weights = isTrilinear ? new Float32Array(total) : null;

    if (!isTrilinear && background !== 0.0) {
      values.fill(background);
    }

    // NOTE Per axis: texel index, voxel index relative to the region, weight. Trilinear can add two entries per texel.
    const axes = [0, 1, 2].map(() => ({
      texels: new Int32Array(2 * resolution + 8),
      voxels: new Int32Array(2 * resolution + 8),
      weights: new Float32Array(2 * resolution + 8),
      count: 0,
      scatter: new Int32Array(leafDim),
    }));

    // NOTE Find texels whose center sample uses voxels in [min, min + dim) on one axis
    const collectAxis = (axisIndex, min, dim) => {
      const axis = axes[axisIndex];
      const axisStart = start[axisIndex];
      const axisStep = step[axisIndex];
      const max = min + dim;

      let from = (min - 1.0 - axisStart) / axisStep;
      let to = (max + 1.0 - axisStart) / axisStep;

      if (from > to) {
        [from, to] = [to, from];
      }

      const first = Math.max(0, Math.floor(from));
      const last = Math.min(resolution - 1, Math.ceil(to));

      let count = 0;

      for (let texel = first; texel <= last; texel++) {
        const position = axisStart + texel * axisStep;

        if (isTrilinear) {
          const corner = Math.floor(position);
          const fraction = position - corner;

          if (corner >= min && corner < max) {
            axis.texels[count] = texel;
            axis.voxels[count] = corner - min;
            axis.weights[count] = 1.0 - fraction;
            count++;
          }

          if (corner + 1 >= min && corner + 1 < max) {
            axis.texels[count] = texel;
            axis.voxels[count] = corner + 1 - min;
            axis.weights[count] = fraction;
            count++;
          }
        } else {
          // NOTE Same rounding as GridDescriptor.getValue
          const voxel = Math.round(position);

          if (voxel >= min && voxel < max) {
            axis.texels[count] = texel;
            axis.voxels[count] = voxel - min;
            axis.weights[count] = 1.0;
            count++;
          }
        }
      }

      axis.count = count;
    };

    // NOTE Texel whose cell holds the voxel center, or -1
    const getCellTexel = (axisIndex, voxel) => {
      const texel = Math.round((voxel - start[axisIndex]) / step[axisIndex]);

      return texel >= 0 && texel < resolution ? texel : -1;
    };

    const writeSample = (index, density, weight) => {
      if (isTrilinear) {
        values[index] += density * weight;
        weights[index] += weight;
      } else if (isMax) {
        values[index] = Math.max(values[index], density);
      } else {
        values[index] = density;
      }
    };

    const addTile = (x, y, z, dim, density) => {
      if (density === background) {
        return;
      }

      collectAxis(0, x, dim);
      collectAxis(1, y, dim);
      collectAxis(2, z, dim);

      const [axisX, axisY, axisZ] = axes;

      for (let k = 0; k < axisZ.count; k++) {
        for (let j = 0; j < axisY.count; j++) {
          const offsetYZ = axisY.texels[j] * resolution + axisZ.texels[k] * resolutionPow2;
          const weightYZ = axisY.weights[j] * axisZ.weights[k];

          for (let i = 0; i < axisX.count; i++) {
            writeSample(axisX.texels[i] + offsetYZ, density, axisX.weights[i] * weightYZ);
          }
        }
      }

      if (!isMax) {
        return;
      }

      // NOTE Max also covers every texel cell that holds a voxel center of the tile
      const range = [x, y, z].map((min, axisIndex) => {
        const first = Math.round((min - start[axisIndex]) / step[axisIndex]);
        const last = Math.round((min + dim - 1 - start[axisIndex]) / step[axisIndex]);

        return [
          Math.max(0, Math.min(first, last)),
          Math.min(resolution - 1, Math.max(first, last)),
        ];
      });

      for (let tz = range[2][0]; tz <= range[2][1]; tz++) {
        for (let ty = range[1][0]; ty <= range[1][1]; ty++) {
          for (let tx = range[0][0]; tx <= range[0][1]; tx++) {
            const index = tx + ty * resolution + tz * resolutionPow2;

            values[index] = Math.max(values[index], density);
          }
        }
      }
    };

    const addLeaf = (x, y, z) => {
      collectAxis(0, x, leafDim);
      collectAxis(1, y, leafDim);
      collectAxis(2, z, leafDim);

      const [axisX, axisY, axisZ] = axes;
      const shiftX = 2 * leafLog2Dim;

      for (let k = 0; k < axisZ.count; k++) {
        for (let j = 0; j < axisY.count; j++) {
          const offsetYZ = axisY.texels[j] * resolution + axisZ.texels[k] * resolutionPow2;
          const voxelYZ = (axisY.voxels[j] << leafLog2Dim) | axisZ.voxels[k];
          const weightYZ = axisY.weights[j] * axisZ.weights[k];

          for (let i = 0; i < axisX.count; i++) {
            const density = getLeafDensity((axisX.voxels[i] << shiftX) | voxelYZ);

            if (density !== background) {
              writeSample(axisX.texels[i] + offsetYZ, density, axisX.weights[i] * weightYZ);
            }
          }
        }
      }

      if (!isMax) {
        return;
      }

      // NOTE Max also covers texel cells that hold voxel centers, for resolutions below the voxel count
      [x, y, z].forEach((min, axisIndex) => {
        for (let voxel = 0; voxel < leafDim; voxel++) {
          axes[axisIndex].scatter[voxel] = getCellTexel(axisIndex, min + voxel);
        }
      });

      for (let offset = 0; offset < leafNumValues; offset++) {
        const density = getLeafDensity(offset);
        const tx = axisX.scatter[offset >> shiftX];
        const ty = axisY.scatter[(offset >> leafLog2Dim) & (leafDim - 1)];
        const tz = axisZ.scatter[offset & (leafDim - 1)];

        if (density !== background && tx !== -1 && ty !== -1 && tz !== -1) {
          const index = tx + ty * resolution + tz * resolutionPow2;

          values[index] = Math.max(values[index], density);
        }
      }
    };

    // NOTE Level set chunks send value masks (active voxels are density 1.0). Fog chunks send values.
    const addChunk = (chunk) => {
      const { leafCount, origins, tileCount, tiles } = chunk;

      leafWords = chunk.leafWords;
      leafValues = chunk.leafValues;

      for (leafOffset = 0; leafOffset < leafCount; leafOffset++) {
        addLeaf(origins[leafOffset * 3], origins[leafOffset * 3 + 1], origins[leafOffset * 3 + 2]);
      }

      for (let tile = 0; tile < tileCount; tile++) {
        const index = tile * 5;

        addTile(
          tiles[index],
          tiles[index + 1],
          tiles[index + 2],
          tiles[index + 3],
          tiles[index + 4]
        );
      }

      leafWords = null;
      leafValues = null;
    };

    // NOTE Same weights and bounds as the VolumeToFog sample build. Accumulates in float and clamps to 1.0.
    const bleed = (source, radius) => {
      const target = new Float32Array(total);

      for (let z = 0; z < resolution; z++) {
        for (let y = 0; y < resolution; y++) {
          for (let x = 0; x < resolution; x++) {
            const baseIndex = x + y * resolution + z * resolutionPow2;
            const value = source[baseIndex];

            if (value === 0.0) {
              continue;
            }

            for (let sx = -radius; sx < radius; sx++) {
              for (let sy = -radius; sy < radius; sy++) {
                for (let sz = -radius; sz < radius; sz++) {
                  if (
                    x + sx < 0.0 ||
                    x + sx >= resolution ||
                    y + sy < 0.0 ||
                    y + sy >= resolution ||
                    z + sz < 0.0 ||
                    z + sz >= resolution
                  ) {
                    continue;
                  }

                  const targetIndex = baseIndex + sx + sy * resolution + sz * resolutionPow2;
                  const offset = Math.max(
                    0.0,
                    Math.min(1.0, 1.0 - Math.hypot(sx, sy, sz) / (radius / 2.0))
                  );

                  target[targetIndex] = Math.min(target[targetIndex] + offset * value, 1.0);
                }
              }
            }
          }
        }
      }

      return target;
    };

    const finish = ({ textureType, radius }) => {
      let density = values;

      if (isTrilinear) {
        for (let index = 0; index < total; index++) {
          density[index] += Math.max(0.0, 1.0 - weights[index]) * background;
        }
      }

      if (radius) {
        density = bleed(density, radius);
      }

      if (textureType === 'float') {
        return density;
      }

      if (textureType === 'half') {
        const data = new Uint16Array(total);

        for (let index = 0; index < total; index++) {
          data[index] = toHalf(density[index]);
        }

        return data;
      }

      // NOTE Same conversion as the sample build: scale, then truncate on store
      const data = new Uint8Array(total);

      for (let index = 0; index < total; index++) {
        data[index] = Math.min(density[index] * 255.0, 255.0);
      }

      return data;
    };

    return { addChunk, finish };
  };

  return { create };
}

const workerSource = `
const kernel = (${leafTextureKernel.toString()})();
let build = null;

self.onmessage = ({ data }) => {
  if (data.type === 'create') {
    build = kernel.create(data.config);
  } else if (data.type === 'chunk') {
    build.addChunk(data.chunk);
    self.postMessage({ type: 'chunk' });
  } else if (data.type === 'finish') {
    const result = build.finish(data.options);
    build = null;
    self.postMessage({ type: 'result', result }, [result.buffer]);
  }
};
`;

const chunkLeafCount = 1024;
const chunkTileCount = 1024;
const maxChunksInFlight = 2;

// NOTE Grids with a scalar tree. Primitives and vector grids use the sample build.
export const canBuildFromLeaves = (grid) =>
  grid instanceof GridDescriptor && !!grid.root && typeof grid.root.background === 'number';

const getDensity = (value, active, isLevelSet) =>
  isLevelSet ? (active ? 1.0 : 0.0) : Math.min(Math.max(value, 0.0), 1.0);

function* packChunks(grid, leafLog2Dim, background) {
  const isLevelSet = grid.isLevelSet();
  const leafNumValues = 1 << (3 * leafLog2Dim);
  const leafNumWords = Math.ceil(leafNumValues / 32);
  const backgroundDensity = getDensity(grid.root.background, false, isLevelSet);

  let chunk;

  const createChunk = () => {
    chunk = {
      leafCount: 0,
      origins: new Int32Array(chunkLeafCount * 3),
      leafValues: isLevelSet ? null : new Float32Array(chunkLeafCount * leafNumValues),
      leafWords: isLevelSet ? new Uint32Array(chunkLeafCount * leafNumWords) : null,
      tileCount: 0,
      tiles: new Float64Array(chunkTileCount * 5),
    };
  };

  const isFull = () => chunk.leafCount === chunkLeafCount || chunk.tileCount === chunkTileCount;

  const addLeaf = (leaf, x, y, z) => {
    const index = chunk.leafCount++;

    chunk.origins[index * 3] = x;
    chunk.origins[index * 3 + 1] = y;
    chunk.origins[index * 3 + 2] = z;

    if (isLevelSet) {
      chunk.leafWords.set(leaf.valueMask.words, index * leafNumWords);
    } else if (leaf.values.length === leafNumValues) {
      chunk.leafValues.set(leaf.values, index * leafNumValues);
    } else {
      chunk.leafValues.fill(background, index * leafNumValues, (index + 1) * leafNumValues);
    }
  };

  const addTile = (x, y, z, dim, value, active) => {
    const density = getDensity(value, active, isLevelSet);

    if (density === backgroundDensity) {
      return;
    }

    const index = chunk.tileCount++ * 5;

    chunk.tiles[index] = x;
    chunk.tiles[index + 1] = y;
    chunk.tiles[index + 2] = z;
    chunk.tiles[index + 3] = dim;
    chunk.tiles[index + 4] = density;
  };

  function* walkInternalNode(node, x, y, z) {
    const log2dim = node.log2dim;
    const childTotal = node.total - node.log2dim;
    const childDim = 1 << childTotal;
    const indexMask = (1 << log2dim) - 1;
    const childWords = node.childMask.words;
    const valueWords = node.valueMask.words;

    for (let wordIndex = 0; wordIndex < childWords.length; wordIndex++) {
      const childWord = childWords[wordIndex];

      // NOTE Visit children and tiles only. Level set tiles count only when active.
      let word = childWord | (isLevelSet ? valueWords[wordIndex] & ~childWord : ~childWord);

      while (word !== 0) {
        const bit = 31 - Math.clz32(word & -word);
        const offset = (wordIndex << 5) | bit;

        word &= word - 1;

        if ((childWord >>> bit) & 1) {
          const child = node.table[offset];
          const childX = x + child.origin.x;
          const childY = y + child.origin.y;
          const childZ = z + child.origin.z;

          if (child.isLeaf()) {
            addLeaf(child, childX, childY, childZ);
          } else {
            yield* walkInternalNode(child, childX, childY, childZ);
          }
        } else {
          addTile(
            x + (((offset >> (2 * log2dim)) & indexMask) << childTotal),
            y + (((offset >> log2dim) & indexMask) << childTotal),
            z + ((offset & indexMask) << childTotal),
            childDim,
            node.values[offset] ?? grid.root.background,
            ((valueWords[wordIndex] >>> bit) & 1) === 1
          );
        }

        if (isFull()) {
          yield chunk;
          createChunk();
        }
      }
    }
  }

  createChunk();

  // NOTE Root children use absolute origins. Root tiles are not internal nodes. Trees with one level have leaves in the root.
  for (const node of grid.root.table) {
    const { x, y, z } = node.origin;

    if (node.isInternalNode()) {
      yield* walkInternalNode(node, x, y, z);
      continue;
    }

    if (node.isLeaf()) {
      addLeaf(node, x, y, z);
    } else {
      addTile(x, y, z, node.dim, node.value, node.active);
    }

    if (isFull()) {
      yield chunk;
      createChunk();
    }
  }

  if (chunk.leafCount || chunk.tileCount) {
    yield chunk;
  }
}

const getChunkTransfer = (chunk) =>
  [chunk.origins, chunk.leafValues, chunk.leafWords, chunk.tiles]
    .filter(Boolean)
    .map((array) => array.buffer);

const createWorkerBackend = () => {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
    return null;
  }

  const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
  const worker = new Worker(url);
  const pending = [];

  const request = (message, transfer = []) =>
    new Promise((resolve, reject) => {
      pending.push({ resolve, reject });
      worker.postMessage(message, transfer);
    });

  worker.onmessage = ({ data }) => {
    pending.shift()?.resolve(data.result);
  };

  worker.onerror = (event) => {
    event.preventDefault();
    pending.splice(0).forEach(({ reject }) => reject(event.message || 'Worker error'));
  };

  return {
    create: (config) => worker.postMessage({ type: 'create', config }),
    addChunk: (chunk) => request({ type: 'chunk', chunk }, getChunkTransfer(chunk)),
    finish: (options) => request({ type: 'finish', options }),
    // NOTE Release requests that wait for the stopped worker
    dispose: () => {
      worker.terminate();
      URL.revokeObjectURL(url);
      pending.splice(0).forEach(({ resolve }) => resolve(null));
    },
  };
};

const createLocalBackend = () => {
  const kernel = leafTextureKernel();
  let build = null;

  // NOTE Run chunks in slices of about one frame, then give the main thread back
  let sliceStart = performance.now();

  const nextTask = (callback) => {
    if (performance.now() - sliceStart < 12.0) {
      return Promise.resolve().then(callback);
    }

    return new Promise((resolve) =>
      setTimeout(() => {
        sliceStart = performance.now();
        resolve(callback());
      }, 0)
    );
  };

  return {
    create: (config) => {
      build = kernel.create(config);
    },
    // NOTE Tasks queued before dispose do nothing
    addChunk: (chunk) => nextTask(() => build?.addChunk(chunk)),
    finish: (options) => nextTask(() => build?.finish(options) ?? null),
    dispose: () => {
      build = null;
    },
  };
};

// NOTE Builds a scalar texture from leaves and tiles, O(stored data) instead of resolution³ samples
export const buildLeafTexture = ({
  grid,
  resolution,
  start,
  step,
  filter = textureFilters.nearest,
  textureType,
  radius,
  onProgress,
}) => {
  const { leafLog2Dim } = grid.treeLayout;
  const isLevelSet = grid.isLevelSet();
  const totalVoxels = grid.leavesCount * (1 << (3 * leafLog2Dim));

  let cancelled = false;
  let backend = null;

  const run = async (createBackend) => {
    backend = createBackend();

    backend.create({
      resolution,
      start: [start.x, start.y, start.z],
      step: [step.x, step.y, step.z],
      filter,
      background: getDensity(grid.root.background, false, isLevelSet),
      leafLog2Dim,
    });

    const inFlight = [];
    let convertedVoxels = 0;

    for (const chunk of packChunks(grid, leafLog2Dim, grid.root.background)) {
      if (cancelled) {
        return null;
      }

      convertedVoxels += chunk.leafCount << (3 * leafLog2Dim);
      inFlight.push(backend.addChunk(chunk));

      if (inFlight.length >= maxChunksInFlight) {
        await inFlight.shift();
      }

      if (onProgress) {
        onProgress({ convertedVoxels, totalVoxels });
      }
    }

    await Promise.all(inFlight);

    return cancelled ? null : backend.finish({ textureType, radius });
  };

  const promise = run(() => createWorkerBackend() || createLocalBackend())
    .catch((error) => {
      if (cancelled) {
        return null;
      }

      console.warn('buildLeafTexture', 'Worker failed, building on the main thread.', { error });
      backend?.dispose();

      return run(createLocalBackend);
    })
    .finally(() => {
      backend?.dispose();
    });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      backend?.dispose();
    },
  };
};

// NOTE Workers run this function from its source text. It must not use imports or names from outside the function.
// decodePage and decodeMask are decodeWVDBPage and decodeWVDBMask from openvdb.
// One kernel serves many readers. State is kept for each reader id.
export function wvdbKernel(decodePage, decodeMask) {
  const brickDim = 8;
  const brickVoxels = brickDim * brickDim * brickDim;

  const configs = {};
  // NOTE The LOD textures that are being decoded, keyed by reader, grid and LOD
  const levels = {};
  // NOTE The last complete LOD of each grid, kept only when the next LOD has more than one page
  const previousLevels = {};

  const inflate = async (bytes) => {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));

    return new Uint8Array(await new Response(stream).arrayBuffer());
  };

  const toByte = (value) => (Math.min(Math.max(value, 0.0), 1.0) * 255.0) | 0;

  // NOTE Same rules as three-openvdb. Scalar grids give density: level sets 1.0 in the active band,
  // other grids value / scale (scale is emissiveScale for emission grids). Vector grids give RGBA colour.
  const toTexels = (values, count, { class: gridClass, background, channels, scale }) => {
    if (channels === 3) {
      const texels = new Uint8Array(count * brickVoxels * 4);

      for (let brick = 0; brick < count; brick++) {
        const source = brick * brickVoxels * 3;
        const target = brick * brickVoxels * 4;

        for (let voxel = 0; voxel < brickVoxels; voxel++) {
          for (let channel = 0; channel < 3; channel++) {
            texels[target + voxel * 4 + channel] = toByte(
              values[source + channel * brickVoxels + voxel]
            );
          }

          texels[target + voxel * 4 + 3] = 255;
        }
      }

      return texels;
    }

    const texels = new Uint8Array(values.length);
    const isLevelSet = gridClass === 'level set';

    for (let i = 0; i < values.length; i++) {
      texels[i] = isLevelSet
        ? Math.abs(values[i]) < background
          ? 255
          : 0
        : toByte(values[i] / scale);
    }

    return texels;
  };

  const fillTexels = (target, texel) => {
    if (texel.length === 1) {
      return target.fill(texel[0]);
    }

    for (let i = 0; i < target.length; i += texel.length) {
      target.set(texel, i);
    }

    return target;
  };

  // NOTE texelSize is 1 for density, 4 for RGBA
  const writeBricks = (target, [width, height, depth], indices, texels, texelSize = 1) => {
    const countX = Math.ceil(width / brickDim);
    const countY = Math.ceil(height / brickDim);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      const originX = (index % countX) * brickDim;
      const originY = (Math.floor(index / countX) % countY) * brickDim;
      const originZ = Math.floor(index / (countX * countY)) * brickDim;

      let voxel = i * brickVoxels;

      for (let z = 0; z < brickDim; z++) {
        for (let y = 0; y < brickDim; y++) {
          const row = (originY + y) * width + (originZ + z) * width * height;
          const inside = originY + y < height && originZ + z < depth;

          for (let x = 0; x < brickDim; x++, voxel++) {
            if (inside && originX + x < width) {
              const targetOffset = (originX + x + row) * texelSize;
              const sourceOffset = voxel * texelSize;

              for (let component = 0; component < texelSize; component++) {
                target[targetOffset + component] = texels[sourceOffset + component];
              }
            }
          }
        }
      }
    }
  };

  // NOTE Trilinear, texel centres to texel centres. Each component alone.
  const upsample = (
    source,
    [sourceWidth, sourceHeight, sourceDepth],
    target,
    [width, height, depth],
    texelSize
  ) => {
    const sourceSlice = sourceWidth * sourceHeight;

    const axis = (size, sourceSize) => {
      const lower = new Int32Array(size);
      const upper = new Int32Array(size);
      const weight = new Float32Array(size);

      for (let i = 0; i < size; i++) {
        const position = Math.min(
          Math.max(((i + 0.5) / size) * sourceSize - 0.5, 0.0),
          sourceSize - 1
        );

        lower[i] = Math.floor(position);
        upper[i] = Math.min(lower[i] + 1, sourceSize - 1);
        weight[i] = position - lower[i];
      }

      return { lower, upper, weight };
    };

    const ax = axis(width, sourceWidth);
    const ay = axis(height, sourceHeight);
    const az = axis(depth, sourceDepth);

    let offset = 0;

    for (let z = 0; z < depth; z++) {
      const z0 = az.lower[z] * sourceSlice;
      const z1 = az.upper[z] * sourceSlice;
      const wz = az.weight[z];

      for (let y = 0; y < height; y++) {
        const y0 = ay.lower[y] * sourceWidth;
        const y1 = ay.upper[y] * sourceWidth;
        const wy = ay.weight[y];

        for (let x = 0; x < width; x++) {
          const x0 = ax.lower[x];
          const x1 = ax.upper[x];
          const wx = ax.weight[x];

          for (let component = 0; component < texelSize; component++) {
            const at = (index) => source[index * texelSize + component];

            const c00 = at(x0 + y0 + z0) + (at(x1 + y0 + z0) - at(x0 + y0 + z0)) * wx;
            const c10 = at(x0 + y1 + z0) + (at(x1 + y1 + z0) - at(x0 + y1 + z0)) * wx;
            const c01 = at(x0 + y0 + z1) + (at(x1 + y0 + z1) - at(x0 + y0 + z1)) * wx;
            const c11 = at(x0 + y1 + z1) + (at(x1 + y1 + z1) - at(x0 + y1 + z1)) * wx;
            const c0 = c00 + (c10 - c00) * wy;
            const c1 = c01 + (c11 - c01) * wy;

            target[offset++] = c0 + (c1 - c0) * wz + 0.5;
          }
        }
      }
    }

    return target;
  };

  const getTexelSize = (grid) => grid.backgroundTexel.length;

  // NOTE Bricks that the sparse file does not store are background
  const clearMissingBricks = (level, grid, dimensions) => {
    const texelSize = getTexelSize(grid);
    const background = fillTexels(new Uint8Array(brickVoxels * texelSize), grid.backgroundTexel);
    const total =
      Math.ceil(dimensions[0] / brickDim) *
      Math.ceil(dimensions[1] / brickDim) *
      Math.ceil(dimensions[2] / brickDim);

    for (let index = 0; index < total; index++) {
      if (!(level.mask[index >>> 5] & (1 << (index & 31)))) {
        writeBricks(level.data, dimensions, [index], background, texelSize);
      }
    }
  };

  return {
    fillTexels,
    create: ({ readerId, config }) => {
      configs[readerId] = config;
    },
    release: ({ readerId }) => {
      delete configs[readerId];

      [levels, previousLevels].forEach((map) =>
        Object.keys(map)
          .filter((key) => key.startsWith(`${readerId}:`))
          .forEach((key) => delete map[key])
      );
    },
    // NOTE Each LOD has its own texture size. A LOD with one page gives its texture after that page.
    // A LOD with more pages starts from the previous LOD (upsampled) and gives a texture after each page,
    // so it gets sharper page by page.
    chunk: async ({ readerId, gridIndex, lod: lodIndex, kind, firstIndex, bytes }) => {
      const config = configs[readerId];

      if (!config) {
        return null;
      }

      const grid = config.grids[gridIndex];
      const lod = grid.lods[lodIndex];
      const gridKey = `${readerId}:${gridIndex}`;
      const key = `${gridKey}:${lodIndex}`;
      const texelSize = getTexelSize(grid);
      const [width, height, depth] = lod.dimensions;
      const data = await inflate(bytes);

      if (!levels[key]) {
        levels[key] = {
          data: fillTexels(new Uint8Array(width * height * depth * texelSize), grid.backgroundTexel),
          pagesLeft: lod.pages,
          mask: null,
        };
      }

      const level = levels[key];

      if (kind === 'mask') {
        level.mask = decodeMask(data);
      } else {
        const previous = previousLevels[gridKey];

        if (previous && level.pagesLeft === lod.pages) {
          upsample(previous.data, previous.dimensions, level.data, lod.dimensions, texelSize);
          delete previousLevels[gridKey];

          if (level.mask) {
            clearMissingBricks(level, grid, lod.dimensions);
          }
        }

        const { indices, values } = decodePage(data, {
          layout: lod.layout,
          bits: config.bits,
          firstIndex,
          channels: grid.channels,
        });

        writeBricks(
          level.data,
          lod.dimensions,
          indices,
          toTexels(values, indices.length, grid),
          texelSize
        );
        level.pagesLeft--;
      }

      const complete = level.pagesLeft === 0;

      // NOTE Single-page LODs wait for their page. A mask alone gives nothing, unless the LOD has no pages.
      if (!complete && (kind === 'mask' || lod.pages === 1)) {
        return null;
      }

      if (complete) {
        delete levels[key];

        const nextLod = grid.lods[lodIndex + 1];

        if (nextLod && nextLod.pages > 1) {
          previousLevels[gridKey] = { data: level.data.slice(), dimensions: lod.dimensions };
        }
      }

      return {
        type: 'texture',
        gridIndex,
        lod: lodIndex,
        complete,
        // NOTE The worker keeps decoding into level.data, so open pages send a copy
        data: complete ? level.data : level.data.slice(),
      };
    },
  };
}

// NOTE Workers run this function from its source text. It must not use imports or names from outside the function.
// decodePage and decodeMask are decodeWVDBPage and decodeWVDBMask from openvdb.
export function wvdbKernel(decodePage, decodeMask) {
  const brickDim = 8;
  const brickVoxels = brickDim * brickDim * brickDim;

  let config = null;
  // NOTE Coarse LODs collect their pages here, keyed by grid and LOD
  const levels = {};

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
    [width, height, depth],
    texelSize
  ) => {
    const result = new Uint8Array(width * height * depth * texelSize);
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

            result[offset++] = c0 + (c1 - c0) * wz + 0.5;
          }
        }
      }
    }

    return result;
  };

  return {
    create: (nextConfig) => {
      config = nextConfig;
    },
    // NOTE Coarse LODs give one full texture when their last page is decoded.
    // Pages of the final LOD give their bricks. The reader writes them in place.
    chunk: async ({ gridIndex, lod: lodIndex, kind, firstIndex, bytes }) => {
      const grid = config.grids[gridIndex];
      const lod = grid.lods[lodIndex];
      const key = `${gridIndex}:${lodIndex}`;
      const isFinal = lodIndex === config.finalLod;
      const texelSize = grid.backgroundTexel.length;
      const data = await inflate(bytes);

      if (kind === 'mask') {
        return isFinal ? { type: 'mask', gridIndex, lod: lodIndex, words: decodeMask(data) } : null;
      }

      const { indices, values } = decodePage(data, {
        layout: lod.layout,
        bits: config.bits,
        firstIndex,
        channels: grid.channels,
      });
      const texels = toTexels(values, indices.length, grid);

      if (isFinal) {
        return { type: 'bricks', gridIndex, lod: lodIndex, indices, texels };
      }

      if (!levels[key]) {
        const [width, height, depth] = lod.dimensions;

        levels[key] = {
          data: fillTexels(new Uint8Array(width * height * depth * texelSize), grid.backgroundTexel),
          pagesLeft: lod.pages,
        };
      }

      const level = levels[key];

      writeBricks(level.data, lod.dimensions, indices, texels, texelSize);
      level.pagesLeft--;

      if (level.pagesLeft > 0) {
        return null;
      }

      delete levels[key];

      return {
        type: 'texture',
        gridIndex,
        lod: lodIndex,
        data: upsample(
          level.data,
          lod.dimensions,
          grid.lods[config.finalLod].dimensions,
          texelSize
        ),
      };
    },
    writeBricks,
    fillTexels,
  };
}

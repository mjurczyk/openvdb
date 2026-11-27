import * as Three from 'three';
import { requestGaussianLevels, getTextureChannels } from '../core/frameMipFilter.js';

// NOTE CPU mipmaps of FrameVolume grids. three.js WebGPU does not generate mipmaps for 3D textures.
// NOTE Levels 1 and up are side by side on x in one atlas texture for each grid.
// NOTE Level l starts at x = atlasWidth - atlasWidth / 2^(l - 1). The shader uses the same layout.

export const mipTextureKeys = ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'];

// NOTE Atlas data for each grid data array and filter. Copies of a volume (same raw data) build it one time.
const atlasCache = new WeakMap();
const gaussianAtlasCache = new WeakMap();

const getLevelSize = (size, level) => Math.max(1, Math.ceil(size / 2 ** level));

export const getMipLevelCount = (width, height, depth) =>
  Math.ceil(Math.log2(Math.max(width, height, depth, 1)));

// NOTE Box filter. Each texel is the mean of 2 x 2 x 2 texels of the level before it.
const downsample = (source, width, height, depth, channels) => {
  const targetWidth = getLevelSize(width, 1);
  const targetHeight = getLevelSize(height, 1);
  const targetDepth = getLevelSize(depth, 1);
  const target = new Uint8Array(targetWidth * targetHeight * targetDepth * channels);

  for (let z = 0; z < targetDepth; z++) {
    const z0 = Math.min(z * 2, depth - 1);
    const z1 = Math.min(z * 2 + 1, depth - 1);

    for (let y = 0; y < targetHeight; y++) {
      const y0 = Math.min(y * 2, height - 1);
      const y1 = Math.min(y * 2 + 1, height - 1);

      const row00 = (y0 + z0 * height) * width;
      const row10 = (y1 + z0 * height) * width;
      const row01 = (y0 + z1 * height) * width;
      const row11 = (y1 + z1 * height) * width;

      for (let x = 0; x < targetWidth; x++) {
        const x0 = Math.min(x * 2, width - 1);
        const x1 = Math.min(x * 2 + 1, width - 1);
        const targetIndex = (x + (y + z * targetHeight) * targetWidth) * channels;

        for (let channel = 0; channel < channels; channel++) {
          const sum =
            source[(x0 + row00) * channels + channel] +
            source[(x1 + row00) * channels + channel] +
            source[(x0 + row10) * channels + channel] +
            source[(x1 + row10) * channels + channel] +
            source[(x0 + row01) * channels + channel] +
            source[(x1 + row01) * channels + channel] +
            source[(x0 + row11) * channels + channel] +
            source[(x1 + row11) * channels + channel];

          target[targetIndex + channel] = Math.round(sum / 8);
        }
      }
    }
  }

  return { data: target, width: targetWidth, height: targetHeight, depth: targetDepth };
};

// NOTE Levels 1 and up, side by side on x
const packAtlas = (levels, width, height, depth, channels) => {
  const atlasWidth = 2 ** Math.max(Math.ceil(Math.log2(width)), levels.length);
  const atlasHeight = getLevelSize(height, 1);
  const atlasDepth = getLevelSize(depth, 1);
  const atlas = new Uint8Array(atlasWidth * atlasHeight * atlasDepth * channels);

  levels.forEach((level, levelIndex) => {
    const offset = atlasWidth - atlasWidth / 2 ** levelIndex;

    for (let z = 0; z < level.depth; z++) {
      for (let y = 0; y < level.height; y++) {
        const sourceStart = (y + z * level.height) * level.width * channels;
        const targetStart = (offset + (y + z * atlasHeight) * atlasWidth) * channels;

        atlas.set(
          level.data.subarray(sourceStart, sourceStart + level.width * channels),
          targetStart,
        );
      }
    }
  });

  return { data: atlas, width: atlasWidth, height: atlasHeight, depth: atlasDepth, levels: levels.length };
};

const buildAtlas = (data, width, height, depth, channels) => {
  const count = getMipLevelCount(width, height, depth);

  if (count < 1) {
    return null;
  }

  const levels = [];
  let level = { data, width, height, depth };

  for (let index = 1; index <= count; index++) {
    level = downsample(level.data, level.width, level.height, level.depth, channels);
    levels.push(level);
  }

  return packAtlas(levels, width, height, depth, channels);
};

const getAtlas = (texture) => {
  const { data, width, height, depth } = texture.image;
  const cached = atlasCache.get(data);

  if (cached && cached.width === width && cached.height === height && cached.depth === depth) {
    return cached.atlas;
  }

  const atlas = buildAtlas(data, width, height, depth, getTextureChannels(texture));

  atlasCache.set(data, { width, height, depth, atlas });

  return atlas;
};

// NOTE Gaussian atlas (core/frameMipFilter.js). null while the sliced build runs.
const getGaussianAtlas = (texture) => {
  const { data, width, height, depth } = texture.image;
  const cached = gaussianAtlasCache.get(data);

  if (cached && cached.width === width && cached.height === height && cached.depth === depth) {
    return cached.atlas;
  }

  const count = getMipLevelCount(width, height, depth);

  if (count < 1) {
    return null;
  }

  const levels = requestGaussianLevels(data, width, height, depth, getTextureChannels(texture), count, 'ceil');

  if (!levels) {
    return null;
  }

  const atlas = packAtlas(levels, width, height, depth, getTextureChannels(texture));

  gaussianAtlasCache.set(data, { width, height, depth, atlas });

  return atlas;
};

// NOTE Builds or updates the mip atlases of a volume. New grid data (a new LOD) builds them again.
// NOTE filter 'gaussian': box atlases show until the Gaussian atlas is built.
export const updateVolumeMipmaps = (volume, filter = 'box') => {
  mipTextureKeys.forEach((key) => {
    const source = volume[key];
    const current = volume.mipMaps[key];

    if (!source || (current && current.data === source.image.data && current.filter === filter && current.final)) {
      return;
    }

    const gaussianAtlas = filter === 'gaussian' ? getGaussianAtlas(source) : null;
    const atlas = gaussianAtlas ?? getAtlas(source);

    if (current && current.atlas === atlas && current.data === source.image.data) {
      current.filter = filter;
      current.final = filter !== 'gaussian' || !!gaussianAtlas;

      return;
    }

    if (current) {
      current.texture.dispose();
      delete volume.mipMaps[key];
    }

    if (!atlas) {
      return;
    }

    const texture = new Three.Data3DTexture(atlas.data, atlas.width, atlas.height, atlas.depth);
    texture.format = source.format;
    texture.minFilter = Three.LinearFilter;
    texture.magFilter = Three.LinearFilter;
    texture.generateMipmaps = false;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    volume.mipMaps[key] = {
      texture,
      data: source.image.data,
      levels: atlas.levels,
      atlas,
      filter,
      final: filter !== 'gaussian' || !!gaussianAtlas,
    };
  });
};

export const disposeVolumeMipmaps = (volume) => {
  Object.values(volume.mipMaps).forEach(({ texture }) => texture.dispose());
  volume.mipMaps = {};
};

import * as Three from 'three';
import { requestGaussianLevels } from '../core/frameMipFilter.js';

// NOTE Gaussian mipmaps on WebGL (FrameVolume mipmapFilter 'gaussian').
// NOTE three.js uploads level 0 of a 3D texture, then the GPU makes box levels. texture.onUpdate writes Gaussian levels over them.
// NOTE GPU box levels show until the Gaussian build is done. Then the texture uploads one more time.

let context = null;

// NOTE The frame renderer sets the WebGL 2 context before it draws
export const setMipmapContext = (gl) => {
  context = gl;
};

// NOTE Levels of a 3D texture with generateMipmaps in three.js (texStorage3D): width and height only
const getLevelCount = ({ width, height }) => Math.floor(Math.log2(Math.max(width, height))) + 1;

const getChannels = (texture) => (texture.format === Three.RGBAFormat ? 4 : 1);

// NOTE texture.onUpdate: three.js calls it after the upload and the GPU mipmaps, with the texture bound
const uploadGaussianLevels = (texture) => {
  const state = texture.userData.frameGaussianMips;
  const { image } = texture;

  state.pending = false;
  state.uploaded = null;

  if (!context || !state.gaussian || !texture.generateMipmaps || !state.levels || state.data !== image.data) {
    return;
  }

  const format = getChannels(texture) === 4 ? context.RGBA : context.RED;

  state.levels.forEach(({ data, width, height, depth }, index) => {
    context.texSubImage3D(context.TEXTURE_3D, index + 1, 0, 0, 0, width, height, depth, format, context.UNSIGNED_BYTE, data);
  });

  state.uploaded = image.data;
};

// NOTE Call for each texture of a drawn volume, after its generateMipmaps is set.
// NOTE gaussian false after a Gaussian upload: the texture uploads again with GPU box levels.
export const updateGaussianMipmaps = (texture, gaussian) => {
  let state = texture.userData.frameGaussianMips;
  const useGaussian = gaussian && texture.generateMipmaps;

  if (!state) {
    if (!useGaussian) {
      return;
    }

    state = { gaussian: false, data: null, levels: null, uploaded: null, pending: false };
    texture.userData.frameGaussianMips = state;
    texture.onUpdate = uploadGaussianLevels;
  }

  state.gaussian = useGaussian;

  if (!useGaussian) {
    if (state.uploaded && !state.pending) {
      state.pending = true;
      texture.needsUpdate = true;
    }

    return;
  }

  const { image } = texture;

  if (state.data !== image.data) {
    state.data = image.data;
    state.levels = null;
  }

  if (!state.levels) {
    const count = getLevelCount(image) - 1;

    if (count < 1) {
      return;
    }

    state.levels = requestGaussianLevels(image.data, image.width, image.height, image.depth, getChannels(texture), count, 'floor');
  }

  if (state.levels && state.uploaded !== image.data && !state.pending) {
    state.pending = true;
    texture.needsUpdate = true;
  }
};

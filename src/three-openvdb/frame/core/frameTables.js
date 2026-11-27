import * as Three from 'three';
import { getFrameMieTexels } from './framePhase.js';
import { frameMieTableSize } from './frameMieTable.js';
import { getFrameBlackbodyTable, frameBlackbodyTableSize, frameBlackbodyTableRows } from './frameBlackbody.js';

// NOTE Data textures of both backends. Shaders read the float texels without filtering and blend them.

// NOTE Lorenz-Mie phase tables, see getFrameMieTexels. Shaders blend the texels linearly.
export const frameMieTexture = new Three.DataTexture(
  getFrameMieTexels(),
  frameMieTableSize,
  1,
  Three.RGBAFormat,
  Three.FloatType,
);

frameMieTexture.minFilter = Three.NearestFilter;
frameMieTexture.magFilter = Three.NearestFilter;
frameMieTexture.needsUpdate = true;

// NOTE Emission color table, see core/frameBlackbody.js. Shaders blend the texels bilinearly.
export const frameBlackbodyTexture = new Three.DataTexture(
  getFrameBlackbodyTable(),
  frameBlackbodyTableSize,
  frameBlackbodyTableRows,
  Three.RGBAFormat,
  Three.FloatType,
);

frameBlackbodyTexture.minFilter = Three.NearestFilter;
frameBlackbodyTexture.magFilter = Three.NearestFilter;
frameBlackbodyTexture.needsUpdate = true;

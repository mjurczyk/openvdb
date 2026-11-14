import { VDBLoader } from './VDBLoader.js';
import {
  ParametricVolume,
  CubeVolume,
  SphereVolume,
  CloudVolume,
  perlin3Noise,
  simplex3Noise,
  worley3Noise,
} from 'openvdb';
import { MeshVolume } from './primitives/MeshVolume.js';
import { FrameVolume } from './frame/core/FrameVolume.js';
import { frameLights } from './frame/core/frameLights.js';
import { frameAngstromExponents } from './frame/core/frameSpectrum.js';
import { frameMediumPresets, getFrameMediumProps } from './frame/core/frameMedium.js';
import { setFrameBackend } from './frame/core/frameBackend.js';
import { FrameVolumeAnimation, FrameVolumeAnimationInstance } from './frame/core/FrameVolumeAnimation.js';
import { VDBAnimationLoader } from './frame/core/VDBAnimationLoader.js';
import { frameRenderer } from './frame/webgl/FrameRenderer.js';
import { FrameEmissionLight } from './frame/webgl/FrameEmissionLight.js';
import { LevelSetMesh } from './levelset/LevelSetMesh.js';
import { LevelSetSurface } from './levelset/webgl/LevelSetSurface.js';
import { setLevelSetSurfaceClass } from './levelset/levelSetBackend.js';
import { VDBPoints } from './points/webgl/VDBPoints.js';
import { setVDBPointsClass } from './points/pointsBackend.js';
import { WVDBLoader } from './wvdb/WVDBLoader.js';
import { WVDBAnimationLoader } from './wvdb/WVDBAnimationLoader.js';
import { WVDBReader } from './wvdb/WVDBReader.js';

// NOTE WebGLRenderer entry point (three-openvdb/webgl), for backwards compatibility.
// NOTE The same API as index.js. Delete this file and frame/webgl/ to drop WebGLRenderer.
setFrameBackend(frameRenderer);
setLevelSetSurfaceClass(LevelSetSurface);
setVDBPointsClass(VDBPoints);

export {
  // NOTE Loaders
  VDBLoader,

  // NOTE Volume masks
  ParametricVolume,
  CubeVolume,
  SphereVolume,
  CloudVolume,
  MeshVolume,

  // NOTE Noise helpers
  perlin3Noise,
  simplex3Noise,
  worley3Noise,

  // NOTE Rendering frame (froxel renderer)
  FrameVolume,
  frameRenderer,
  frameLights,
  frameAngstromExponents,
  frameMediumPresets,
  getFrameMediumProps,
  FrameEmissionLight,
  FrameVolumeAnimation,
  FrameVolumeAnimationInstance,
  VDBAnimationLoader,

  // NOTE Level set surfaces
  LevelSetMesh,
  LevelSetSurface,

  // NOTE Point data grids
  VDBPoints,

  // NOTE Streamed .wvdb files (made with the wvdb CLI)
  WVDBLoader,
  WVDBAnimationLoader,
  WVDBReader,
};

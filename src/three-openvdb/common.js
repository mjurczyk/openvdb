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
import { FrameVolumeAnimation, FrameVolumeAnimationInstance } from './frame/core/FrameVolumeAnimation.js';
import { VDBAnimationLoader } from './frame/core/VDBAnimationLoader.js';
import { LevelSetMesh } from './levelset/LevelSetMesh.js';
import { WVDBLoader } from './wvdb/WVDBLoader.js';
import { WVDBAnimationLoader } from './wvdb/WVDBAnimationLoader.js';
import { WVDBReader } from './wvdb/WVDBReader.js';

// NOTE Exports of both entry points that do not depend on the renderer.
// NOTE index.js (WebGPURenderer) and webgl.js (WebGLRenderer) add frameRenderer, FrameEmissionLight,
// LevelSetSurface and VDBPoints.
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
  frameLights,
  frameAngstromExponents,
  frameMediumPresets,
  getFrameMediumProps,
  FrameVolumeAnimation,
  FrameVolumeAnimationInstance,
  VDBAnimationLoader,

  // NOTE Level set surfaces
  LevelSetMesh,

  // NOTE Streamed .wvdb files (made with the wvdb CLI)
  WVDBLoader,
  WVDBAnimationLoader,
  WVDBReader,
};

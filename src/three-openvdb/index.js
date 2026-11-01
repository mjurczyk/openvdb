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
import { setFrameBackend } from './frame/core/frameBackend.js';
import { FrameVolumeAnimation, FrameVolumeAnimationInstance } from './frame/core/FrameVolumeAnimation.js';
import { VDBAnimationLoader } from './frame/core/VDBAnimationLoader.js';
import { frameRenderer } from './frame/webgpu/FrameRenderer.js';
import { FrameEmissionLight } from './frame/webgpu/FrameEmissionLight.js';
import { WVDBLoader } from './wvdb/WVDBLoader.js';
import { WVDBAnimationLoader } from './wvdb/WVDBAnimationLoader.js';
import { WVDBReader } from './wvdb/WVDBReader.js';

// NOTE This entry point renders FrameVolume with WebGPURenderer. three-openvdb/webgl is the WebGLRenderer entry point.
setFrameBackend(frameRenderer);

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
  FrameEmissionLight,
  FrameVolumeAnimation,
  FrameVolumeAnimationInstance,
  VDBAnimationLoader,

  // NOTE Streamed .wvdb files (made with the wvdb CLI)
  WVDBLoader,
  WVDBAnimationLoader,
  WVDBReader,
};

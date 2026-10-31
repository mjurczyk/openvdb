import { VDBLoader } from './VDBLoader';
import {
  ParametricVolume,
  CubeVolume,
  SphereVolume,
  CloudVolume,
  perlin3Noise,
  simplex3Noise,
  worley3Noise,
} from 'openvdb';
import { MeshVolume } from './primitives/MeshVolume';
import { FrameVolume } from './frame/core/FrameVolume';
import { frameLights } from './frame/core/frameLights';
import { setFrameBackend } from './frame/core/frameBackend';
import { FrameVolumeAnimation, FrameVolumeAnimationInstance } from './frame/core/FrameVolumeAnimation';
import { VDBAnimationLoader } from './frame/core/VDBAnimationLoader';
import { frameRenderer } from './frame/webgpu/FrameRenderer';
import { FrameEmissionLight } from './frame/webgpu/FrameEmissionLight';
import { WVDBLoader } from './wvdb/WVDBLoader';
import { WVDBAnimationLoader } from './wvdb/WVDBAnimationLoader';
import { WVDBReader } from './wvdb/WVDBReader';

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
  // NOTE WebGPURenderer only
  FrameEmissionLight,
  FrameVolumeAnimation,
  FrameVolumeAnimationInstance,
  VDBAnimationLoader,

  // NOTE Streamed .wvdb files (made with the wvdb CLI)
  WVDBLoader,
  WVDBAnimationLoader,
  WVDBReader,
};

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
import { frameRenderer } from './frame/webgl/FrameRenderer';
import { FrameEmissionLight } from './frame/webgl/FrameEmissionLight';
import { WVDBLoader } from './wvdb/WVDBLoader';
import { WVDBAnimationLoader } from './wvdb/WVDBAnimationLoader';
import { WVDBReader } from './wvdb/WVDBReader';

// NOTE WebGLRenderer entry point (three-openvdb/webgl), for backwards compatibility.
// NOTE The same API as index.js. Delete this file and frame/webgl/ to drop WebGLRenderer.
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

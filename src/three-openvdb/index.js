import { setFrameBackend } from './frame/core/frameBackend.js';
import { setLevelSetSurfaceClass } from './levelset/levelSetBackend.js';
import { setVDBPointsClass } from './points/pointsBackend.js';
import { frameRenderer } from './frame/webgpu/FrameRenderer.js';
import { FrameEmissionLight } from './frame/webgpu/FrameEmissionLight.js';
import { LevelSetSurface } from './levelset/webgpu/LevelSetSurface.js';
import { VDBPoints } from './points/webgpu/VDBPoints.js';

// NOTE This entry point renders FrameVolume with WebGPURenderer. three-openvdb/webgl is the WebGLRenderer entry point.
setFrameBackend(frameRenderer);
setLevelSetSurfaceClass(LevelSetSurface);
setVDBPointsClass(VDBPoints);

export * from './common.js';

// NOTE Classes of the renderer backend
export { frameRenderer, FrameEmissionLight, LevelSetSurface, VDBPoints };

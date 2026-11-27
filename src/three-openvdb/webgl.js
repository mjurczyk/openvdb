import { setFrameBackend } from './frame/core/frameBackend.js';
import { setLevelSetSurfaceClass } from './levelset/levelSetBackend.js';
import { setVDBPointsClass } from './points/pointsBackend.js';
import { frameRenderer } from './frame/webgl/FrameRenderer.js';
import { FrameEmissionLight } from './frame/webgl/FrameEmissionLight.js';
import { LevelSetSurface } from './levelset/webgl/LevelSetSurface.js';
import { VDBPoints } from './points/webgl/VDBPoints.js';

// NOTE WebGLRenderer entry point (three-openvdb/webgl), for backwards compatibility.
// NOTE The same API as index.js. Delete this file and frame/webgl/ to drop WebGLRenderer.
setFrameBackend(frameRenderer);
setLevelSetSurfaceClass(LevelSetSurface);
setVDBPointsClass(VDBPoints);

export * from './common.js';

// NOTE Classes of the renderer backend
export { frameRenderer, FrameEmissionLight, LevelSetSurface, VDBPoints };

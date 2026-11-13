// NOTE LevelSetSurface class of the entry point: webgpu/ (index.js) or webgl/ (webgl.js).
// FrameVolume makes surfaces with it (levelSets prop). Core code imports no backend.
let LevelSetSurfaceClass = null;

export const setLevelSetSurfaceClass = (surfaceClass) => {
  LevelSetSurfaceClass = surfaceClass;
};

export const createLevelSetSurface = (source, props) => {
  if (!LevelSetSurfaceClass) {
    throw new Error(
      'LevelSetSurface: no renderer backend. Import from "three-openvdb" or "three-openvdb/webgl".',
    );
  }

  return new LevelSetSurfaceClass(source, props);
};

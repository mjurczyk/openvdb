// NOTE VDBPoints class of the entry point: webgpu/ (index.js) or webgl/ (webgl.js).
// FrameVolume makes points with it (points prop). Core code imports no backend.
let VDBPointsClass = null;

export const setVDBPointsClass = (pointsClass) => {
  VDBPointsClass = pointsClass;
};

export const createVDBPoints = (source, props) => {
  if (!VDBPointsClass) {
    throw new Error('VDBPoints: no renderer backend. Import from "three-openvdb" or "three-openvdb/webgl".');
  }

  return new VDBPointsClass(source, props);
};

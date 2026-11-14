import * as Three from 'three';
import { createPointData } from 'openvdb';
import { runInSlices } from '../levelset/levelSetDistance.js';

// NOTE Points above this count use every n-th point. Point size grows, so the cover stays the same.
export const defaultMaxPoints = 4000000;

let discTexture = null;

// NOTE Alpha map of a round point. Both backends use it with alphaTest.
export const getPointDiscTexture = () => {
  if (!discTexture) {
    const size = 64;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x + 0.5) / size - 0.5;
        const dy = (y + 0.5) / size - 0.5;
        const value = Math.sqrt(dx * dx + dy * dy) <= 0.5 ? 255 : 0;

        data.set([value, value, value, 255], (y * size + x) * 4);
      }
    }

    discTexture = new Three.DataTexture(data, size, size);
    discTexture.needsUpdate = true;
  }

  return discTexture;
};

// NOTE Decodes the points in slices. onDone gets the createPointData result. Returns a cancel function.
export const buildPointData = (source, { maxPoints = defaultMaxPoints } = {}, onDone) => {
  if (!source?.isPointData?.()) {
    throw new Error('VDBPoints: source must be a point data grid.');
  }

  const pointData = createPointData(source, { maxPoints });

  return runInSlices(pointData.task, () => onDone(pointData));
};

// NOTE Default diameter: half the mean point distance, so there is a gap between points
export const getPointDiameter = (points) => points.size ?? points.spacing * 0.5;

const worldPosition = new Three.Vector3();
const worldQuaternion = new Three.Quaternion();
const worldScale = new Three.Vector3();

// NOTE Material size for a world diameter. Both backends: pixels = size * (buffer height / 2) / view depth.
export const getAttenuatedPointSize = (object, camera, diameter) => {
  const fov = camera.isPerspectiveCamera ? camera.fov : 50.0;
  const zoom = camera.zoom ?? 1.0;

  object.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  return (diameter * Math.max(worldScale.x, worldScale.y, worldScale.z) * zoom) /
    Math.tan(Three.MathUtils.degToRad(fov) * 0.5);
};

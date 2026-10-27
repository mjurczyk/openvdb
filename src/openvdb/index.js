import './debug';
import './dependencies';
import { OpenVDBReader } from './core/OpenVDBReader';

export { OpenVDBReader };
export { GridDescriptor } from './core/GridDescriptor';
export { GridTransform } from './core/GridTransform';
export {
  floatType,
  doubleType,
  halfFloatType,
  int32Type,
  int64Type,
  vec3sType,
  vec3dType,
  vec3hType,
  vec3iType,
} from './math/memory';
export { Vector3 } from './math/vector';
export { Matrix3, Matrix4 } from './math/matrix';
export { perlin3Noise, simplex3Noise, worley3Noise } from './math/noise';
export { CloudVolume, CubeVolume, SphereVolume, ParametricVolume } from './utils/primitives';
export { getUuid } from './utils/uuid';
export * from './wvdb/format';

export const loadVDB = (url) =>
  new Promise((resolve, reject) => {
    fetch(url).then(async (vdb) => {
      const source = new Uint8Array(await vdb.arrayBuffer());
      const vdbReader = new OpenVDBReader();

      try {
        await vdbReader.read(source);
        resolve(vdbReader);
      } catch (error) {
        console.error({ error });
        reject('VDB could not be parsed.');
      }
    });
  });

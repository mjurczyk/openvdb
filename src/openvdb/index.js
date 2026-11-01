import './debug.js';
import './dependencies.js';
import { OpenVDBReader } from './core/OpenVDBReader.js';

export { OpenVDBReader };
export { GridDescriptor } from './core/GridDescriptor.js';
export { GridTransform } from './core/GridTransform.js';
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
} from './math/memory.js';
export { Vector3 } from './math/vector.js';
export { Matrix3, Matrix4 } from './math/matrix.js';
export { perlin3Noise, simplex3Noise, worley3Noise } from './math/noise.js';
export { CloudVolume, CubeVolume, SphereVolume, ParametricVolume } from './utils/primitives/index.js';
export { getUuid } from './utils/uuid.js';
export * from './wvdb/format.js';

export const loadVDB = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load ${url} (${response.status}).`);
  }

  const source = new Uint8Array(await response.arrayBuffer());
  const vdbReader = new OpenVDBReader();

  try {
    await vdbReader.read(source);
  } catch (error) {
    console.error({ error });
    throw 'VDB could not be parsed.';
  }

  return vdbReader;
};

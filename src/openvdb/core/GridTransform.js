import { Vector3 } from '../math/vector.js';
import { Matrix3, Matrix4 } from '../math/matrix.js';
import { doubleSize, doubleType, int32Type, uint32Size } from '../math/memory.js';
import { Version } from './Version.js';
import { unsupported } from '../debug.js';
import { GridSharedContext } from './GridSharedContext.js';

const transformMapType = {
  uniformScaleTranslateMap: 'UniformScaleTranslateMap',
  scaleTranslateMap: 'ScaleTranslateMap',
  uniformScaleMap: 'UniformScaleMap',
  scaleMap: 'ScaleMap',
  translationMap: 'TranslationMap',
  unitaryMap: 'UnitaryMap',
  affineMap: 'AffineMap',
  nonlinearFrustumMap: 'NonlinearFrustumMap',
};

// NOTE Transform types of files before version 219
const legacyTransformType = {
  linearTransform: 'LinearTransform',
  frustumTransform: 'FrustumTransform',
};

const matrix4Size = 16 * doubleSize;

// NOTE Legacy frustum has 2 Vec3i extents, 11 Mat4d, 6 window values and 1 padding value
const legacyFrustumSize = 6 * uint32Size + 11 * matrix4Size + 7 * doubleSize;

const createTransformMap = (mapType = null) => ({
  mapType,
  translation: new Vector3(),
  scale: new Vector3(1.0, 1.0, 1.0),
  voxelSize: new Vector3(1.0, 1.0, 1.0),
  scaleInverse: new Vector3(1.0, 1.0, 1.0),
  scaleInverseSq: new Vector3(1.0, 1.0, 1.0),
  scaleInverseDouble: new Vector3(0.5, 0.5, 0.5),
  matrix: new Matrix4(),
  matrixInverse: new Matrix4(),
  jacobianInverse: new Matrix3(),
});

const createAffineTransformMap = (matrix) => {
  const transformMap = createTransformMap(transformMapType.affineMap);

  transformMap.matrix = matrix;
  transformMap.matrixInverse = matrix.clone().invert();
  transformMap.jacobianInverse = new Matrix3().setFromMatrix4(transformMap.matrixInverse);

  return transformMap;
};

export class GridTransform {
  constructor() {
    this.transformMap = createTransformMap();
    this.updateTransformMap();
  }

  readTransform() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    const mapType = bufferIterator.readString();

    if (Version.less(version, 219)) {
      this.transformMap = this.readLegacyTransformMap(mapType);
    } else {
      this.transformMap = this.readTransformMap(mapType);
    }

    this.updateTransformMap();
  }

  // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h
  readTransformMap(mapType) {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    if (
      [transformMapType.uniformScaleTranslateMap, transformMapType.scaleTranslateMap].includes(
        mapType
      )
    ) {
      return {
        ...createTransformMap(mapType),
        translation: bufferIterator.readVector3(),
        ...this.readScaleValues(),
      };
    } else if ([transformMapType.uniformScaleMap, transformMapType.scaleMap].includes(mapType)) {
      return {
        ...createTransformMap(mapType),
        ...this.readScaleValues(),
      };
    } else if ([transformMapType.translationMap].includes(mapType)) {
      return {
        ...createTransformMap(mapType),
        translation: bufferIterator.readVector3(),
      };
    } else if ([transformMapType.unitaryMap, transformMapType.affineMap].includes(mapType)) {
      // NOTE UnitaryMap is stored as an AffineMap
      return {
        ...createAffineTransformMap(this.readMatrix4()),
        mapType,
      };
    } else if ([transformMapType.nonlinearFrustumMap].includes(mapType)) {
      unsupported('GridTransform::NonlinearFrustumMap');

      // NOTE Files before version 221 store the frustum bbox as integers
      const bboxPrecision = Version.less(version, 221) ? int32Type : doubleType;

      return {
        ...createTransformMap(mapType),
        bbox: [
          bufferIterator.readVector3(bboxPrecision),
          bufferIterator.readVector3(bboxPrecision),
        ],
        taper: bufferIterator.readFloat(doubleType),
        depth: bufferIterator.readFloat(doubleType),
        secondMap: this.readTransformMap(bufferIterator.readString()),
      };
    }

    throw new Error(`GridTransform: unknown map type "${mapType}".`);
  }

  // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/v7.0.0/openvdb/math/Transform.cc#L73
  readLegacyTransformMap(mapType) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    if (mapType === legacyTransformType.linearTransform) {
      // NOTE Skip index extents
      bufferIterator.skip(6 * uint32Size);

      const localToWorld = this.readMatrix4();
      bufferIterator.skip(matrix4Size);
      const voxelToLocal = this.readMatrix4();
      bufferIterator.skip(matrix4Size);

      return createAffineTransformMap(new Matrix4().multiplyMatrices(localToWorld, voxelToLocal));
    } else if (mapType === legacyTransformType.frustumTransform) {
      unsupported('GridTransform::FrustumTransform');
      bufferIterator.skip(legacyFrustumSize);

      return createTransformMap(mapType);
    }

    throw new Error(`GridTransform: unknown legacy transform type "${mapType}".`);
  }

  readScaleValues() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    return {
      scale: bufferIterator.readVector3(),
      voxelSize: bufferIterator.readVector3(),
      scaleInverse: bufferIterator.readVector3(),
      scaleInverseSq: bufferIterator.readVector3(),
      scaleInverseDouble: bufferIterator.readVector3(),
    };
  }

  readMatrix4() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    // NOTE OpenVDB stores rows and multiplies row vectors. Three.js reads columns and multiplies column vectors. The result is the same.
    return new Matrix4().fromArray(
      Array.from({ length: 16 }, () => bufferIterator.readFloat(doubleType))
    );
  }

  // NOTE Set implementations as arrow functions on the instance. Callers can then pass them without binding.
  updateTransformMap() {
    const { mapType, translation, scale, scaleInverse, matrix, matrixInverse, jacobianInverse } =
      this.transformMap;

    if (
      [transformMapType.uniformScaleTranslateMap, transformMapType.scaleTranslateMap].includes(
        mapType
      )
    ) {
      this.applyTransformMap = (vector) => vector.multiply(scale).add(translation);
      this.applyInverseTransformMap = (vector) => vector.sub(translation).multiply(scaleInverse);
      this.applyInverseJacobian = (vector) => vector.multiply(scaleInverse);
    } else if ([transformMapType.uniformScaleMap, transformMapType.scaleMap].includes(mapType)) {
      this.applyTransformMap = (vector) => vector.multiply(scale);
      this.applyInverseTransformMap = (vector) => vector.multiply(scaleInverse);
      this.applyInverseJacobian = (vector) => vector.multiply(scaleInverse);
    } else if ([transformMapType.translationMap].includes(mapType)) {
      this.applyTransformMap = (vector) => vector.add(translation);
      this.applyInverseTransformMap = (vector) => vector.sub(translation);
      this.applyInverseJacobian = (vector) => vector;
    } else if ([transformMapType.unitaryMap, transformMapType.affineMap].includes(mapType)) {
      this.applyTransformMap = (vector) => vector.applyMatrix4(matrix);
      this.applyInverseTransformMap = (vector) => vector.applyMatrix4(matrixInverse);
      this.applyInverseJacobian = (vector) => vector.applyMatrix3(jacobianInverse);
    } else {
      // NOTE Identity for primitives and unsupported frustum maps
      this.applyTransformMap = (vector) => vector;
      this.applyInverseTransformMap = (vector) => vector;
      this.applyInverseJacobian = (vector) => vector;
    }
  }

  applyTransformMapToBbox([min, max]) {
    const worldMin = new Vector3(Infinity, Infinity, Infinity);
    const worldMax = new Vector3(-Infinity, -Infinity, -Infinity);
    const corner = new Vector3();

    // NOTE Rotation and negative scale can move any corner to the world min or max
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z);
      this.applyTransformMap(corner);

      worldMin.min(corner);
      worldMax.max(corner);
    }

    return [worldMin, worldMax];
  }
}

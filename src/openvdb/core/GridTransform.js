import { BufferIterator } from "./BufferIterator";
import {
  boolSize,
  boolType,
  charSize,
  doubleType,
  floatType,
  int32Type,
  int64Type,
  stringType,
  uint32Size,
  uint64Size,
  vec3dType,
  vec3iType,
  vec3sType,
  floatingPointPrecisionLUT,
} from '../math/memory';
import {
  Vector3
} from '../math/vector';
import { Version } from "./Version";
import { unsupported } from "../debug";

const transformMapType = {
  uniformScaleTranslateMap: 'UniformScaleTranslateMap',
  scaleTranslateMap: 'ScaleTranslateMap',
  uniformScaleMap: 'UniformScaleMap',
  scaleMap: 'ScaleMap',
  translationMap: 'TranslationMap',
  unitaryMap: 'UnitaryMap',
  nonlinearFrustumMap: 'NonlinearFrustumMap',
};

export class GridTransform {
  readTransform() {
    BufferIterator.assert(this);

    this.transformMap = {
      mapType: this.bufferIterator.readNameString(),
      translation: new Vector3(),
      scale: new Vector3(),
      voxelSize: new Vector3(),
      scaleInverse: new Vector3(),
      scaleInverseSq: new Vector3(),
      scaleInverseDouble: new Vector3(),
    };

    if (Version.less(this, 219)) {
      unsupported('GridDescriptor::getGridTransform old-style transforms currently not supported. Fallback to identity transform.');
      return;
    }

    if ([transformMapType.uniformScaleTranslateMap, transformMapType.scaleTranslateMap].includes(this.transformMap.mapType)) {
      this.transformMap = {
        ...this.transformMap,
        translation: this.bufferIterator.readVector3(),
        scale: this.bufferIterator.readVector3(),
        voxelSize: this.bufferIterator.readVector3(),
        scaleInverse: this.bufferIterator.readVector3(),
        scaleInverseSq: this.bufferIterator.readVector3(),
        scaleInverseDouble: this.bufferIterator.readVector3(),
      };
    } else if ([transformMapType.uniformScaleMap, transformMapType.scaleMap].includes(this.transformMap.mapType)) {
      this.transformMap = {
        ...this.transformMap,
        scale: this.bufferIterator.readVector3(),
        voxelSize: this.bufferIterator.readVector3(),
        scaleInverse: this.bufferIterator.readVector3(),
        scaleInverseSq: this.bufferIterator.readVector3(),
        scaleInverseDouble: this.bufferIterator.readVector3(),
      };
    } else if ([transformMapType.translationMap].includes(this.transformMap.mapType)) {
      this.transformMap = {
        ...this.transformMap,
        translation: this.bufferIterator.readVector3()
      };
    } else if ([transformMapType.unitaryMap].includes(this.transformMap.mapType)) {
      // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L1809
      unsupported('GridDescriptor::UnitaryMap');
    } else if ([transformMapType.nonlinearFrustumMap].includes(this.transformMap.mapType)) {
      // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L2418
      unsupported('GridDescriptor::NonlinearFrustumMap');
    } else {
      // NOTE Support for any magical map types from https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L538 to be added
      unsupported('GridDescriptor::Matrix4x4');
      // 4x4 transformation matrix
    }

    // NOTE Trigger cache
    this.applyTransformMap(new Vector3());
  }

  applyTransformMap(vector) {
    let implementation;

    if ([transformMapType.uniformScaleTranslateMap, transformMapType.scaleTranslateMap].includes(this.transformMap.mapType)) {
      implementation = (vector) => vector.multiply(this.transformMap.scale).add(this.transformMap.translation);
    } else if ([transformMapType.uniformScaleMap, transformMapType.scaleMap].includes(this.transformMap.mapType)) {
      implementation = (vector) => vector.multiply(this.transformMap.scale);
    } else if ([transformMapType.translationMap].includes(this.transformMap.mapType)) {
      implementation = (vector) => vector.add(this.transformMap.translation);
    } else if ([transformMapType.unitaryMap].includes(this.transformMap.mapType)) {
      unsupported('GridDescriptor::UnitaryMap');
      implementation = (vector) => vector;
    } else if ([transformMapType.nonlinearFrustumMap].includes(this.transformMap.mapType)) {
      unsupported('GridDescriptor::NonlinearFrustumMap');
      implementation = (vector) => vector;
    } else {
      unsupported('GridDescriptor::Matrix4x4');
      implementation = (vector) => vector;
    }

    // NOTE Cache implementation since transform type is static
    this.applyTransformMap = implementation;

    return implementation(vector);
  }
}

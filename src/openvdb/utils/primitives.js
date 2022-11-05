// NOTE Primitive volume grids
// TODO Replace with flood-filled VDB grids

import { floatType } from '../math/memory';
import { GridDescriptor } from '../core/GridDescriptor';
import { Vector3 } from '../math/vector';
import { GridTransform } from '../core/GridTransform';

export class CubeVolume {
  static halfFloatGridPrefix = GridDescriptor.halfFloatGridPrefix;

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;

  constructor() {
    // NOTE Primitives don't need to use OpenVDBReader - just "read grid" right away
    this.readGrid();
  }

  readGrid() {
    this.readGridHeader();
    this.readGridTransform();
  }

  readGridHeader() {
    this.uniqueName = `CubeVolume#${Math.random()}`;
    this.gridName = this.uniqueName.split('#')[0];
    this.gridType = 'fog volume';
  }

  readCompression() {
    /* NOTE Unnecessary */
  }

  readMetadata() {
    /* NOTE Unnecessary */
  }

  getGridValueType() {
    return floatType;
  }

  getGridClass() {
    return 'fog volume';
  }

  readGridTransform() {
    this.transform = new GridTransform();
  }

  readTopology() {
    /* NOTE Unnecessary */
  }

  getWorldBbox() {
    return this.getLocalBbox();
  }

  getLocalBbox() {
    return [new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)];
  }

  getPreciseWorldBbox() {
    return this.getWorldBbox();
  }

  getValue(position) {
    // NOTE Cube by default has all leaves enabled
    return 1.0;
  }

  getLeafAt(position) {
    return null;
  }
}

export class SphereVolume {
  static halfFloatGridPrefix = GridDescriptor.halfFloatGridPrefix;

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;

  constructor() {
    // NOTE Primitives don't need to use OpenVDBReader - just "read grid" right away
    this.readGrid();
  }

  readGrid() {
    this.readGridHeader();
    this.readGridTransform();
  }

  readGridHeader() {
    this.uniqueName = `SphereVolume#${Math.random()}`;
    this.gridName = this.uniqueName.split('#')[0];
    this.gridType = 'fog volume';
  }

  readCompression() {
    /* NOTE Unnecessary */
  }

  readMetadata() {
    /* NOTE Unnecessary */
  }

  getGridValueType() {
    return floatType;
  }

  getGridClass() {
    return 'fog volume';
  }

  readGridTransform() {
    this.transform = new GridTransform();
  }

  readTopology() {
    /* NOTE Unnecessary */
  }

  getWorldBbox() {
    return this.getLocalBbox();
  }

  getLocalBbox() {
    return [new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)];
  }

  getPreciseWorldBbox() {
    return this.getWorldBbox();
  }

  getValue(position) {
    // NOTE Cube by default has all leaves enabled
    return position.length() <= 0.5 ? 1.0 : 0.0;
  }

  getLeafAt(position) {
    return null;
  }
}

export class ParametricVolume {
  static halfFloatGridPrefix = GridDescriptor.halfFloatGridPrefix;

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;

  valueFunction;

  constructor(valueFunction) {
    // NOTE Primitives don't need to use OpenVDBReader - just "read grid" right away
    this.readGrid();
    this.valueFunction = valueFunction;
  }

  readGrid() {
    this.readGridHeader();
    this.readGridTransform();
  }

  readGridHeader() {
    this.uniqueName = `CubeVolume#${Math.random()}`;
    this.gridName = this.uniqueName.split('#')[0];
    this.gridType = 'fog volume';
  }

  readCompression() {
    /* NOTE Unnecessary */
  }

  readMetadata() {
    /* NOTE Unnecessary */
  }

  getGridValueType() {
    return floatType;
  }

  getGridClass() {
    return 'fog volume';
  }

  readGridTransform() {
    this.transform = new GridTransform();
  }

  readTopology() {
    /* NOTE Unnecessary */
  }

  getWorldBbox() {
    return this.getLocalBbox();
  }

  getLocalBbox() {
    return [new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)];
  }

  getPreciseWorldBbox() {
    return this.getWorldBbox();
  }

  getValue(position) {
    // NOTE Cube by default has all leaves enabled
    return this.valueFunction(position);
  }

  getLeafAt(position) {
    return null;
  }
}

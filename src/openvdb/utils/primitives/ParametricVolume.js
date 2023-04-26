import { floatType } from '../../math/memory';
import { GridDescriptor } from '../../core/GridDescriptor';
import { Vector3 } from '../../math/vector';
import { GridTransform } from '../../core/GridTransform';
import { getUuid } from '../uuid';

export class ParametricVolume extends GridDescriptor {
  static halfFloatGridPrefix = GridDescriptor.halfFloatGridPrefix;

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;

  valueFunction;

  constructor(valueFunction) {
    super();

    // NOTE Primitives don't need to use OpenVDBReader - just "read grid" right away
    this.readGrid();
    this.valueFunction = valueFunction;
  }

  readGrid() {
    this.readGridHeader();
    this.readGridTransform();
  }

  readGridHeader() {
    this.uniqueName = `ParametricVolume#${getUuid()}`;
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
    return this.valueFunction(position);
  }

  getLeafAt(position) {
    return null;
  }
}

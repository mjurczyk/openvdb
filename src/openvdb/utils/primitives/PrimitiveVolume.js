import { floatType } from '../../math/memory.js';
import { GridDescriptor } from '../../core/GridDescriptor.js';
import { Vector3 } from '../../math/vector.js';
import { GridTransform } from '../../core/GridTransform.js';
import { getUuid } from '../uuid.js';

// NOTE Base class for procedural grids. Subclasses implement getValue. Minifiers change constructor.name, thus the name is an argument.
export class PrimitiveVolume extends GridDescriptor {
  primitiveName;

  constructor(primitiveName) {
    super();

    this.primitiveName = primitiveName;

    // NOTE Primitives don't need to use OpenVDBReader - just "read grid" right away
    this.readGrid();
  }

  readGrid() {
    this.readGridHeader();
    this.readGridTransform();
  }

  readGridHeader() {
    this.uniqueName = `${this.primitiveName}#${getUuid()}`;
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

  getLeafAt(position) {
    return null;
  }
}

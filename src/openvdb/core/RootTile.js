import { Vector3 } from '../math/vector';
import { log2dimMap } from './ChildNode';

// NOTE Root tile has one value for the full extent of a top-level internal node
const tileDim = 1 << log2dimMap.reduce((total, next) => total + next);

export class RootTile {
  leavesCount = 0;

  constructor({ origin, value, active }) {
    this.origin = origin;
    this.value = value;
    this.active = active;
    this.dim = tileDim;
  }

  readBuffers() {
    // NOTE Tiles have no buffers
  }

  getLocalBbox() {
    if (this.localBboxCache) {
      return this.localBboxCache;
    }

    this.localBboxCache = [
      this.origin.clone(),
      new Vector3(this.origin.x + this.dim, this.origin.y + this.dim, this.origin.z + this.dim),
    ];

    return this.localBboxCache;
  }

  contains(position) {
    const [min, max] = this.getLocalBbox();

    return (
      position.x >= min.x &&
      position.x < max.x &&
      position.y >= min.y &&
      position.y < max.y &&
      position.z >= min.z &&
      position.z < max.z
    );
  }

  isLeaf() {
    return false;
  }

  isInternalNode() {
    return false;
  }

  getValue(position, accessor = null) {
    if (!this.contains(position)) {
      return 0.0;
    }

    if (accessor) {
      accessor.cache(this);
    }

    return this.value;
  }

  isActive(position, accessor = null) {
    if (!this.contains(position)) {
      return false;
    }

    if (accessor) {
      accessor.cache(this);
    }

    return this.active;
  }

  getLeafAt() {
    return null;
  }
}

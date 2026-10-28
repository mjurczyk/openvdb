import { Vector3 } from '../math/vector';

// NOTE Root tile has one value for the full extent of a top-level internal node
export class RootTile {
  leavesCount = 0;

  constructor({ origin, value, active, background, dim }) {
    this.origin = origin;
    this.value = value;
    this.active = active;
    this.background = background;
    this.dim = dim;
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

  // NOTE Extends min and max with the tile extent when the tile is active
  evalActiveBbox(origin, min, max) {
    if (!this.active) {
      return;
    }

    min.min(origin);
    max.max(origin.clone().addScalar(this.dim - 1));
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
      return this.background;
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

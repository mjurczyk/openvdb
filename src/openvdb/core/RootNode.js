import { uint32Size } from '../math/memory';
import { Vector3 } from '../math/vector';
import { ChildNode } from './ChildNode';
import { GridSharedContext } from './GridSharedContext';
import { RootTile } from './RootTile';

// NOTE Root keys have (32 - log2dim) bits for each int32 axis. X and Y share one key, Z has a nested map.
const defaultRootChildLog2Dim = 12;

// NOTE Smallest root child log2 dim with X and Y keys in one safe integer
const minSafeKeyLog2Dim = 5;

// NOTE Same as NanoVDB CoordToKey. Constant shifts keep lookups in 5_4_3 trees fast.
const getDefaultKeyXY = (x, y) => (x >> 12) * 0x100000 + ((y >> 12) & 0xfffff);

const getDefaultKeyZ = (z) => z >> 12;

const createKeyFunctions = (log2dim) => {
  if (log2dim === defaultRootChildLog2Dim) {
    return { getKeyXY: getDefaultKeyXY, getKeyZ: getDefaultKeyZ };
  }

  const keyScale = 2 ** (32 - log2dim);
  const keyMask = keyScale - 1;

  return {
    getKeyXY:
      log2dim >= minSafeKeyLog2Dim
        ? (x, y) => (x >> log2dim) * keyScale + ((y >> log2dim) & keyMask)
        : (x, y) => `${x >> log2dim},${y >> log2dim}`,
    getKeyZ: (z) => z >> log2dim,
  };
};

export class RootNode {
  readNode() {
    const { bufferIterator, valueType, treeLayout } = GridSharedContext.getContext(this);

    this.childDim = treeLayout.rootChildDim;
    Object.assign(this, createKeyFunctions(treeLayout.rootChildLog2Dim));

    this.background = bufferIterator.readFloat(valueType);
    this.numTiles = bufferIterator.readBytes(uint32Size);
    this.numChildren = bufferIterator.readBytes(uint32Size);
    this.table = [];
    this.tableByKey = new Map();
    this.origin = new Vector3();

    this.readChildren();
  }

  readChildren() {
    // NOTE Empty grids have no tiles and no children
    this.leavesCount = 0;

    Array(this.numTiles)
      .fill(0)
      .forEach(() => {
        this.readTile();
      });

    Array(this.numChildren)
      .fill(0)
      .forEach(() => {
        this.readInternalNode();
      });
  }

  readTile() {
    const { bufferIterator, valueType } = GridSharedContext.getContext(this);

    const vec = new Vector3(
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32')
    );
    const value = bufferIterator.readFloat(valueType);
    const active = bufferIterator.readBool();

    this.addToTable(
      new RootTile({ origin: vec, value, active, background: this.background, dim: this.childDim })
    );
  }

  readInternalNode() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const vec = new Vector3(
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32')
    );

    const child = new ChildNode();
    GridSharedContext.passContext(this, child);

    child.readNode(0, {
      id: this.table.length,
      origin: vec,
      background: this.background,
    });

    this.addToTable(child);
    this.leavesCount += child.leavesCount;

    GridSharedContext.cleanContext(child);
  }

  addToTable(node) {
    const { x, y, z } = node.origin;
    const keyXY = this.getKeyXY(x, y);

    if (!this.tableByKey.has(keyXY)) {
      this.tableByKey.set(keyXY, new Map());
    }

    this.table.push(node);
    this.tableByKey.get(keyXY).set(this.getKeyZ(z), node);
  }

  readBuffers() {
    this.table.forEach((child) => {
      GridSharedContext.passContext(this, child);
      child.readBuffers();
      GridSharedContext.cleanContext(child);
    });
  }

  // NOTE Root children and root tiles save their index origin in the file
  evalActiveBbox(min, max) {
    this.table.forEach((node) => node.evalActiveBbox(node.origin, min, max));
  }

  getLocalBbox() {
    // NOTE Ignore bbox for root nodes
    return [new Vector3(0.0, 0.0, 0.0), new Vector3(0.0, 0.0, 0.0)];
  }

  isLeaf() {
    return false;
  }

  isRoot() {
    return true;
  }

  getChildAt(position) {
    const tableZ = this.tableByKey.get(this.getKeyXY(position.x, position.y));

    return tableZ?.get(this.getKeyZ(position.z)) || null;
  }

  getValue(position, accessor = null) {
    const child = this.getChildAt(position);

    return child ? child.getValue(position, accessor) : this.background;
  }

  isActive(position, accessor = null) {
    const child = this.getChildAt(position);

    return child ? child.isActive(position, accessor) : false;
  }

  getLeafAt(position, accessor = null) {
    const child = this.getChildAt(position);

    return child ? child.getLeafAt(position, accessor) : null;
  }
}

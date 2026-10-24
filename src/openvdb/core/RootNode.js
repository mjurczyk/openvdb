import { unsupported } from '../debug';
import { uint32Size } from '../math/memory';
import { Vector3 } from '../math/vector';
import { ChildNode, rootChildLog2Dim } from './ChildNode';
import { GridSharedContext } from './GridSharedContext';
import { RootTile } from './RootTile';

// NOTE Root keys have 20 bits for each int32 axis, same as NanoVDB CoordToKey. X and Y share one safe integer.
const getRootKeyXY = (x, y) =>
  (x >> rootChildLog2Dim) * 0x100000 + ((y >> rootChildLog2Dim) & 0xfffff);

const getRootKeyZ = (z) => z >> rootChildLog2Dim;

export class RootNode {
  readNode() {
    const { bufferIterator, valueType } = GridSharedContext.getContext(this);

    this.background = bufferIterator.readFloat(valueType);
    this.numTiles = bufferIterator.readBytes(uint32Size);
    this.numChildren = bufferIterator.readBytes(uint32Size);
    this.table = [];
    this.tableByKey = new Map();
    this.origin = new Vector3();

    this.readChildren();
  }

  readChildren() {
    if (this.numTiles === 0 && this.numChildren === 0) {
      unsupported('Empty root node');
      return;
    }

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

    this.addToTable(new RootTile({ origin: vec, value, active, background: this.background }));
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
    const keyXY = getRootKeyXY(x, y);

    if (!this.tableByKey.has(keyXY)) {
      this.tableByKey.set(keyXY, new Map());
    }

    this.table.push(node);
    this.tableByKey.get(keyXY).set(getRootKeyZ(z), node);
  }

  readBuffers() {
    this.table.forEach((child) => {
      GridSharedContext.passContext(this, child);
      child.readBuffers();
      GridSharedContext.cleanContext(child);
    });
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
    const tableZ = this.tableByKey.get(getRootKeyXY(position.x, position.y));

    return tableZ?.get(getRootKeyZ(position.z)) || null;
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

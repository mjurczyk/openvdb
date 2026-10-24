import { unsupported } from '../debug';
import { uint32Size } from '../math/memory';
import { Vector3 } from '../math/vector';
import { ChildNode } from './ChildNode';
import { GridSharedContext } from './GridSharedContext';
import { RootTile } from './RootTile';

export class RootNode {
  readNode() {
    const { bufferIterator, valueType } = GridSharedContext.getContext(this);

    this.background = bufferIterator.readFloat(valueType);
    this.numTiles = bufferIterator.readBytes(uint32Size);
    this.numChildren = bufferIterator.readBytes(uint32Size);
    this.table = [];
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

    this.table.push(new RootTile({ origin: vec, value, active }));
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

    this.table.push(child);
    this.leavesCount += child.leavesCount;

    GridSharedContext.cleanContext(child);
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
    return this.table.find((child) => child.contains(position)) || null;
  }

  getValue(position, accessor = null) {
    const child = this.getChildAt(position);

    return child ? child.getValue(position, accessor) : 0.0;
  }

  isActive(position, accessor = null) {
    const child = this.getChildAt(position);

    return child ? child.isActive(position, accessor) : false;
  }

  getLeafAt(position, accessor = null) {
    let leaf = null;

    for (let i = 0; i < this.table.length; i++) {
      leaf = this.table[i].getLeafAt(position, accessor);

      if (leaf !== null) {
        i = this.table.length;
      }
    }

    return leaf;
  }
}

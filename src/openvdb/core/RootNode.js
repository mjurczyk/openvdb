import { unsupported } from '../debug';
import { uint32Size } from '../math/memory';
import { Vector3 } from '../math/vector';
import { ChildNode } from './ChildNode';
import { GridSharedContext } from './GridSharedContext';

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
    unsupported('Tile nodes');

    const { bufferIterator, valueType } = GridSharedContext.getContext(this);

    const vec = new Vector3(
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32')
    );
    const value = bufferIterator.readFloat(valueType);
    const active = readBool();

    this.push({
      child: null,
      tile: {
        value,
        active: !value ? false : active,
      },
      origin: vec,
      isChild: () => !!child,
      isTile: () => !!tile,
      isTileOff: () => tile && !tile.active,
      isTileOn: () => tile && tile.active,
    });
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

  getValue(position, accessor = null) {
    let max = 0.0;

    for (let i = 0; i < this.table.length; i++) {
      max = Math.max(max, this.table[i].getValue(position, accessor));

      if (max !== 0.0) {
        i = this.table.length;
      }
    }

    return max;
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

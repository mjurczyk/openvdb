import { uint32Size } from "../math/memory";
import { Vector3 } from "../math/vector";
import { BufferIterator } from "./BufferIterator";
import { ChildNode } from "./ChildNode";
import { Compression } from "./Compression";
import { GridUtils } from "./GridUtils";
import { Version } from "./Version";

export class RootNode {
  readNode() {
    const { valueType } = GridUtils.getValueType(this);

    this.background = this.bufferIterator.readFloat(valueType);
    this.numTiles = this.bufferIterator.readBytes(uint32Size);
    this.numChildren = this.bufferIterator.readBytes(uint32Size);
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

    Array(this.numTiles).fill(0).forEach(() => {
      this.readTile();
    });

    Array(this.numChildren).fill(0).forEach(() => {
      this.readInternalNode();
    });
  }

  readTile() {
    unsupported('Tile nodes');

    const { valueType } = GridUtils.getValueType(this);

    const vec = new Vector3(
      this.bufferIterator.readFloat('int32'),
      this.bufferIterator.readFloat('int32'),
      this.bufferIterator.readFloat('int32'),
    );
    const value = this.bufferIterator.readFloat(valueType);
    const active = readBool();

    this.push({
      child: null,
      tile: {
        value,
        active: !value ? false : active
      },
      origin: vec,
      isChild: () => !!child,
      isTile: () => !!tile,
      isTileOff: () => tile && !tile.active,
      isTileOn: () => tile && tile.active,
    });
  }

  readInternalNode() {
    const vec = new Vector3(
      this.bufferIterator.readFloat('int32'),
      this.bufferIterator.readFloat('int32'),
      this.bufferIterator.readFloat('int32'),
    );

    const child = new ChildNode();
    BufferIterator.withBufferIterator(child, this.bufferIterator);
    GridUtils.tagValueType(child, ...Object.values(GridUtils.getValueType(this)));
    Compression.tagCompression(child, Compression.getCompression(this));
    Version.tagVersion(child, Version.getVersion(this));

    child.readNode(0, {
      id: this.table.length,
      origin: vec,
      background: this.background
    });

    this.table.push(child);
    this.leavesCount += child.leavesCount;
  }
}

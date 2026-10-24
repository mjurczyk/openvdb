import { unsupported } from '../debug';
import {
  createValueBuffer,
  halfValueTypeMap,
  uint32Size,
  uint64Size,
  valueTypeSizeMap,
} from '../math/memory';
import { Vector3 } from '../math/vector';
import { BufferIterator } from './BufferIterator';
import { Compression, compressionMetadata } from './Compression';
import { GridSharedContext } from './GridSharedContext';
import { Mask } from './Mask';
import { Version } from './Version';

// NOTE Assuming 5_4_3 tree
export const log2dimMap = [5, 4, 3];

export const totalMap = [4, 3, 0];

const nodeTypeMap = ['internal', 'internal', 'leaf'];

const cloneValue = (value) => (value instanceof Vector3 ? value.clone() : value);

const negateValue = (value) => (value instanceof Vector3 ? value.clone().negate() : -value);

export class ChildNode {
  readNode(depth = 0, props) {
    const { version } = GridSharedContext.getContext(this);

    Object.assign(this, props);

    this.depth = depth;
    (this.log2dim = log2dimMap[depth] || 1), (this.nodeType = nodeTypeMap[depth] || 'invalid');
    this.total =
      this.log2dim +
      ((depth) => {
        let sum = 0;

        totalMap.forEach((value, index) => {
          if (index >= depth) {
            sum += value;
          }
        });

        return sum;
      })(depth);
    this.dim = 1 << this.total;
    this.numValues = 1 << (3 * this.log2dim);
    this.level = 2 - depth;
    this.numVoxels = 1 << (3 * this.total);
    this.background = props.background || 0.0;
    this.offsetMask = this.dim - 1;

    if (depth < 2) {
      this.childMask = new Mask();
      GridSharedContext.passContext(this, this.childMask);
      this.childMask.readMask(this);
      GridSharedContext.cleanContext(this.childMask);
    }
    this.valueMask = new Mask();
    GridSharedContext.passContext(this, this.valueMask);
    this.valueMask.readMask(this);
    GridSharedContext.cleanContext(this.valueMask);

    if (this.isLeaf()) {
      this.leavesCount = 1;
    } else {
      this.leavesCount = 0;
    }

    this.table = [];
    this.firstChild = null;

    this.values = [];

    if (Version.less(version, 214)) {
      unsupported('Internal-node compression');
      return;
    }

    this.readValues();
  }

  isLeaf() {
    return this.depth >= 2;
  }

  isInternalNode() {
    return !this.isLeaf();
  }

  getValueCoords(offset) {
    const vec = new Vector3();

    let x = offset >> (2 * this.log2dim);
    offset &= (1 << (2 * this.log2dim)) - 1;
    let y = offset >> this.log2dim;
    let z = offset & ((1 << this.log2dim) - 1);

    vec.set(x, y, z);

    const childTotal = this.total - this.log2dim;

    vec.x = vec.x << childTotal;
    vec.y = vec.y << childTotal;
    vec.z = vec.z << childTotal;

    return vec;
  }

  forEachValue(callback = () => {}) {
    this.valueMask.forEachOn((indices) => {
      callback({
        wordIndex: indices.wordIndex,
        bitIndex: indices.bitIndex,
        offset: indices.offset,
        coords: this.getValueCoords(indices.offset),
      });
    });
  }

  readValues() {
    const { version, valueType } = GridSharedContext.getContext(this);

    if (this.isLeaf()) {
      // NOTE Leaf values are saved after the topology, see readBuffers
      return;
    }

    if (Version.less(version, 222)) {
      // NOTE Old files save values only for slots without a child
      const savedValues = this.readCompressedValues(this.childMask.countOff());
      let savedIndex = 0;

      this.values = createValueBuffer(valueType, this.numValues);
      this.childMask.forEachOff(({ offset }) => {
        this.values[offset] = savedValues[savedIndex++];
      });
    } else {
      this.values = this.readCompressedValues(this.numValues);
    }

    this.childMask.forEachOn((indices) => {
      let n = indices.offset;
      const vec = new Vector3();

      let x = n >> (2 * this.log2dim);
      n &= (1 << (2 * this.log2dim)) - 1;
      let y = n >> this.log2dim;
      let z = n & ((1 << this.log2dim) - 1);

      vec.set(x, y, z);

      const child = new ChildNode();
      GridSharedContext.passContext(this, child);

      child.parent = this;
      child.readNode(this.depth + 1, {
        id: indices.offset,
        origin: vec,
        indices: indices,
        background: this.background,
      });

      vec.x = vec.x << child.total;
      vec.y = vec.y << child.total;
      vec.z = vec.z << child.total;

      this.table[indices.offset] = child;
      this.leavesCount += child.leavesCount;

      if (!this.firstChild) {
        this.firstChild = child;
      }

      GridSharedContext.cleanContext(child);
    });
  }

  readBuffers() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    if (this.isInternalNode()) {
      this.childMask.forEachOn(({ offset }) => {
        const child = this.table[offset];

        GridSharedContext.passContext(this, child);
        child.readBuffers();
        GridSharedContext.cleanContext(child);
      });

      return;
    }

    // NOTE Value mask is a copy of the mask read in readTopology
    bufferIterator.skip(this.valueMask.size >> 3);

    let numBuffers = 1;

    if (Version.less(version, 222)) {
      // NOTE Skip leaf origin, it is known from the topology
      bufferIterator.skip(3 * uint32Size);
      numBuffers = bufferIterator.readBytes(1);
    }

    this.values = this.readCompressedValues(this.numValues);

    // NOTE Old files can have auxiliary buffers. They are not mask-compressed and not used.
    for (let index = 1; index < numBuffers; index++) {
      this.readData(this.numValues);
    }
  }

  // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/io/Compression.h#L496
  readCompressedValues(count) {
    const { bufferIterator, compression, version, valueType } = GridSharedContext.getContext(this);
    const maskCompressed = Version.greaterEq(version, 222) && compression.activeMask;

    let metadata = compressionMetadata.noMaskAndAllVals;

    if (Version.greaterEq(version, 222)) {
      metadata = bufferIterator.readBytes(1);
    }

    const background = this.background;
    let inactiveVal1 = background;
    let inactiveVal0 =
      metadata === compressionMetadata.noMaskOrInactiveVals ? background : negateValue(background);

    if (
      [
        compressionMetadata.noMaskAndOneInactiveVal,
        compressionMetadata.maskAndOneInactiveVal,
        compressionMetadata.maskAndTwoInactiveVals,
      ].includes(metadata)
    ) {
      // NOTE Inactive values use full precision, also in half float grids
      inactiveVal0 = bufferIterator.readFloat(valueType);

      if (metadata === compressionMetadata.maskAndTwoInactiveVals) {
        inactiveVal1 = bufferIterator.readFloat(valueType);
      }
    }

    let selectionMask = null;

    if (
      [
        compressionMetadata.maskAndNoInactiveVals,
        compressionMetadata.maskAndOneInactiveVal,
        compressionMetadata.maskAndTwoInactiveVals,
      ].includes(metadata)
    ) {
      selectionMask = new Mask();
      GridSharedContext.passContext(this, selectionMask);
      selectionMask.readMask(this);
      GridSharedContext.cleanContext(selectionMask);
    }

    const savedCount =
      maskCompressed && metadata !== compressionMetadata.noMaskAndAllVals
        ? this.valueMask.countOn()
        : count;
    const savedValues = this.readData(savedCount);

    if (savedCount === count) {
      return savedValues;
    }

    // NOTE Only active values are saved. Restore inactive values from the selection mask.
    const values = createValueBuffer(valueType, count);

    for (let offset = 0, savedIndex = 0; offset < count; offset++) {
      if (this.valueMask.isOn(offset)) {
        values[offset] = savedValues[savedIndex++];
      } else {
        values[offset] = cloneValue(
          selectionMask && selectionMask.isOn(offset) ? inactiveVal1 : inactiveVal0
        );
      }
    }

    return values;
  }

  readCompressedData(codec, byteCount) {
    const { bufferIterator } = GridSharedContext.getContext(this);
    const compressedBytesCount = bufferIterator.readBytes(uint64Size);

    if (compressedBytesCount <= 0) {
      // NOTE Data is not compressed, size is the negative byte count
      return bufferIterator.readRawBytes(-compressedBytesCount);
    }

    const compressedBytes = bufferIterator.readRawBytes(compressedBytesCount);

    try {
      return codec.decode(compressedBytes);
    } catch (error) {
      console.warn('readCompressedData', 'uncompress', 'error', {
        error,
        compressedBytes,
      });

      return new Uint8Array(byteCount);
    }
  }

  readData(count) {
    const { bufferIterator, valueType, useHalf, compression } = GridSharedContext.getContext(this);
    const dataType = (useHalf && halfValueTypeMap[valueType]) || valueType;
    const byteCount = count * valueTypeSizeMap[dataType];

    let bytes;

    if (compression.blosc) {
      bytes = this.readCompressedData(Compression.blosc, byteCount);
    } else if (compression.zip) {
      bytes = this.readCompressedData(Compression.zlib, byteCount);
    } else {
      bytes = bufferIterator.readRawBytes(byteCount);
    }

    const dataIterator = new BufferIterator(bytes);
    const values = createValueBuffer(valueType, count);

    for (let index = 0; index < count; index++) {
      values[index] = dataIterator.readFloat(dataType);
    }

    return values;
  }

  getLocalBbox() {
    if (this.localBboxCache) {
      return this.localBboxCache;
    }

    let sumParentOffset = new Vector3();

    const traverseOffset = (node) => {
      if (node && node.origin) {
        sumParentOffset.add(node.origin);
      }

      if (node.parent) {
        traverseOffset(node.parent);
      }
    };
    traverseOffset(this);

    const localBbox = [
      sumParentOffset,
      new Vector3(
        sumParentOffset.x + this.dim,
        sumParentOffset.y + this.dim,
        sumParentOffset.z + this.dim
      ),
    ];

    this.localBboxCache = localBbox;

    return localBbox;
  }

  getFirstChild() {
    return this.firstChild;
  }

  valueCache = {};

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

  coordToOffset(position) {
    if (this.isLeaf()) {
      return (
        ((position.x & this.offsetMask) << (2 * this.log2dim)) |
        ((position.y & this.offsetMask) << this.log2dim) |
        (position.z & this.offsetMask)
      );
    } else {
      // NOTE Nodes with only tiles have no first child
      const childTotal = this.total - this.log2dim;

      return (
        (((position.x & this.offsetMask) >> childTotal) << (2 * this.log2dim)) |
        (((position.y & this.offsetMask) >> childTotal) << this.log2dim) |
        ((position.z & this.offsetMask) >> childTotal)
      );
    }
  }

  reads = 0.0;
  readsMiss = 0.0;
  readsOk = 0.0;

  getValue(position, accessor = null) {
    if (!this.contains(position)) {
      return 0.0;
    }

    if (accessor) {
      accessor.cache(this);
    }

    const offset = this.coordToOffset(position);

    if (this.isLeaf()) {
      return this.values[offset];
    }

    const targetChild = this.table[offset];

    if (targetChild) {
      return targetChild.getValue(position, accessor);
    }

    // NOTE Tile value, active or inactive
    return this.values[offset];
  }

  isActive(position, accessor = null) {
    if (!this.contains(position)) {
      return false;
    }

    if (accessor) {
      accessor.cache(this);
    }

    const offset = this.coordToOffset(position);

    if (this.isLeaf()) {
      return this.valueMask.isOn(offset);
    }

    const targetChild = this.table[offset];

    if (targetChild) {
      return targetChild.isActive(position, accessor);
    }

    // NOTE Active tile
    return this.valueMask.isOn(offset);
  }

  getLeafAt(position, accessor = null) {
    this.reads++;

    if (!this.contains(position)) {
      this.readsMiss++;
      return null;
    }

    if (this.isLeaf()) {
      this.readsOk++;
      return this;
    }

    if (accessor) {
      accessor.cache(this);
    }

    const targetChild = this.table[this.coordToOffset(position)];

    if (targetChild) {
      this.readsMiss++;
      return targetChild.getLeafAt(position, accessor);
    }

    this.readsOk++;
    return null;
  }
}

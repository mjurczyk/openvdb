import { unsupported } from '../debug.js';
import {
  boolType,
  createValueBuffer,
  halfFloatType,
  halfValueTypeMap,
  maskType,
  pointIndex32,
  uint32Size,
  uint64Size,
  valueTypeSizeMap,
} from '../math/memory.js';
import { Vector3 } from '../math/vector.js';
import { BufferIterator } from './BufferIterator.js';
import { Compression, compressionMetadata } from './Compression.js';
import { GridSharedContext } from './GridSharedContext.js';
import { Mask } from './Mask.js';
import { Version } from './Version.js';

const cloneValue = (value) => (value instanceof Vector3 ? value.clone() : value);

// NOTE Negative of a bool is its inverse, same as math::negative
const negateValue = (value, valueType) => {
  if (value instanceof Vector3) {
    return value.clone().negate();
  }

  return valueType === boolType || valueType === maskType ? 1 - value : -value;
};

const isLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

const typedValueBuffers = {
  float: Float32Array,
  double: Float64Array,
  int32: Int32Array,
};

// NOTE Null when the data needs a conversion (half floats, vectors, int64, big-endian platforms)
const createTypedValues = (dataType, valueType, bytes, count) => {
  const TypedArray = isLittleEndian && dataType === valueType ? typedValueBuffers[valueType] : null;

  if (!TypedArray) {
    return null;
  }

  const byteLength = count * TypedArray.BYTES_PER_ELEMENT;

  // NOTE A view needs an aligned offset. The copy also frees the memory of a larger source buffer.
  return bytes.byteOffset % TypedArray.BYTES_PER_ELEMENT === 0 && bytes.buffer.byteLength === byteLength
    ? new TypedArray(bytes.buffer, bytes.byteOffset, count)
    : new TypedArray(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + byteLength));
};

// NOTE Float value of each IEEE 754 binary16 bit pattern. Made on the first half float grid.
let halfFloatTable = null;

const getHalfFloatTable = () => {
  if (!halfFloatTable) {
    const bits = new Uint8Array(2);
    const iterator = new BufferIterator(bits);

    halfFloatTable = new Float32Array(1 << 16);

    for (let half = 0; half < halfFloatTable.length; half++) {
      bits[0] = half & 0xff;
      bits[1] = half >> 8;
      iterator.offset = 0;
      halfFloatTable[half] = iterator.readFloat16();
    }
  }

  return halfFloatTable;
};

const readHalfValues = (bytes, values) => {
  const table = getHalfFloatTable();
  const halves = new Uint16Array(bytes.buffer, bytes.byteOffset, values.length);

  for (let index = 0; index < values.length; index++) {
    values[index] = table[halves[index]];
  }

  return values;
};

export class ChildNode {
  readNode(depth = 0, props) {
    const { version, treeLayout } = GridSharedContext.getContext(this);

    Object.assign(this, props);

    this.depth = depth;
    this.leaf = depth >= treeLayout.leafDepth;
    this.log2dim = treeLayout.log2dims[depth];
    this.nodeType = this.isLeaf() ? 'leaf' : 'internal';
    this.total = treeLayout.totals[depth];
    this.dim = 1 << this.total;
    this.numValues = 1 << (3 * this.log2dim);
    this.level = treeLayout.leafDepth - depth;
    this.background = props.background || 0.0;
    this.offsetMask = this.dim - 1;

    if (this.isInternalNode()) {
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
    return this.leaf;
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
    const { bufferIterator, version, valueType } = GridSharedContext.getContext(this);

    if (this.isInternalNode()) {
      this.childMask.forEachOn(({ offset }) => {
        const child = this.table[offset];

        GridSharedContext.passContext(this, child);
        child.readBuffers();
        GridSharedContext.cleanContext(child);
      });

      return;
    }

    if (valueType === boolType) {
      this.readBoolBuffers();
      return;
    }

    if (valueType === maskType) {
      // NOTE Mask leaves save the value mask again and the origin. Values are the value mask.
      bufferIterator.skip((this.valueMask.size >> 3) + 3 * uint32Size);
      this.values = this.valueMask.toValues();
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

    if (valueType === pointIndex32) {
      // NOTE Point index leaves save the point indices after the values. They are not used.
      bufferIterator.skip(bufferIterator.readBytes(uint64Size) * uint32Size);
    }
  }

  // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/tree/LeafNodeBool.h
  readBoolBuffers() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    // NOTE Skip the value mask copy and the leaf origin
    bufferIterator.skip((this.valueMask.size >> 3) + 3 * uint32Size);

    if (Version.greaterEq(version, 217)) {
      const dataMask = new Mask();
      GridSharedContext.passContext(this, dataMask);
      dataMask.readMask(this);
      GridSharedContext.cleanContext(dataMask);

      this.values = dataMask.toValues();
      return;
    }

    // NOTE Old files save zip-compressed bool arrays. Only the first buffer is used.
    const numBuffers = bufferIterator.readBytes(1);

    for (let index = 0; index < numBuffers; index++) {
      const bytes = this.readCompressedData(Compression.zlib, this.numValues);

      if (index === 0) {
        this.values = bytes.map((value) => (value ? 1 : 0));
      }
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
      metadata === compressionMetadata.noMaskOrInactiveVals
        ? background
        : negateValue(background, valueType);

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

    const valueWords = this.valueMask.words;
    const selectionWords = selectionMask ? selectionMask.words : null;

    for (let offset = 0, savedIndex = 0; offset < count; offset++) {
      const bit = 1 << (offset & 31);

      if (valueWords[offset >> 5] & bit) {
        values[offset] = savedValues[savedIndex++];
      } else {
        values[offset] = cloneValue(
          selectionWords && selectionWords[offset >> 5] & bit ? inactiveVal1 : inactiveVal0
        );
      }
    }

    return values;
  }

  readCompressedData(codec, byteCount) {
    const { bufferIterator } = GridSharedContext.getContext(this);
    const compressedBytesCount = bufferIterator.readBytes(uint64Size);

    let bytes;

    if (compressedBytesCount <= 0) {
      // NOTE Data is not compressed, size is the negative byte count
      bytes = bufferIterator.readRawBytes(-compressedBytesCount);
    } else {
      const compressedBytes = bufferIterator.readRawBytes(compressedBytesCount);

      try {
        bytes = codec.decode(compressedBytes, undefined, byteCount);
      } catch (error) {
        console.warn('readCompressedData', 'uncompress', 'error', {
          error,
          compressedBytes,
        });

        return new Uint8Array(byteCount);
      }
    }

    if (bytes.length !== byteCount) {
      console.warn('readCompressedData', 'size', 'error', {
        expected: byteCount,
        found: bytes.length,
      });

      return new Uint8Array(byteCount);
    }

    return bytes;
  }

  readData(count) {
    const { bufferIterator, valueType, useHalf, compression } = GridSharedContext.getContext(this);
    const dataType = (useHalf && halfValueTypeMap[valueType]) || valueType;
    const byteCount = count * valueTypeSizeMap[dataType];

    if (count < 1 && dataType !== valueType) {
      // NOTE Half data with no values has no chunk header, same as HalfReader in Compression.h
      return createValueBuffer(valueType, 0);
    }

    let bytes;

    if (compression.blosc) {
      bytes = this.readCompressedData(Compression.blosc, byteCount);
    } else if (compression.zip) {
      bytes = this.readCompressedData(Compression.zlib, byteCount);
    } else {
      bytes = bufferIterator.readRawBytes(byteCount);
    }

    // NOTE Float, double and int32 data has the layout of the value buffer (little-endian). No value-by-value read.
    const typedValues = createTypedValues(dataType, valueType, bytes, count);

    if (typedValues) {
      return typedValues;
    }

    if (isLittleEndian && dataType === halfFloatType && bytes.byteOffset % 2 === 0) {
      return readHalfValues(bytes, createValueBuffer(valueType, count));
    }

    const dataIterator = new BufferIterator(bytes);
    const values = createValueBuffer(valueType, count);

    for (let index = 0; index < count; index++) {
      values[index] = dataIterator.readFloat(dataType);
    }

    return values;
  }

  // NOTE Extends min and max with the active voxels and tiles. Origin is the index position of this node.
  // Child origins are relative to the parent.
  evalActiveBbox(origin, min, max) {
    const log2dim = this.log2dim;
    const childTotal = this.total - log2dim;
    const tileSize = (1 << childTotal) - 1;
    const position = new Vector3();

    this.valueMask.forEachOn(({ offset }) => {
      if (this.isInternalNode() && this.childMask.isOn(offset)) {
        return;
      }

      position.set(
        origin.x + ((offset >> (2 * log2dim)) << childTotal),
        origin.y + (((offset >> log2dim) & ((1 << log2dim) - 1)) << childTotal),
        origin.z + ((offset & ((1 << log2dim) - 1)) << childTotal)
      );

      min.min(position);
      max.max(position.addScalar(tileSize));
    });

    if (this.isInternalNode()) {
      this.childMask.forEachOn(({ offset }) => {
        const child = this.table[offset];

        child.evalActiveBbox(origin.clone().add(child.origin), min, max);
      });
    }
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
      return this.background;
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

    // NOTE Tile value, active or inactive, same as NanoVDB. Files before 214 have no internal values.
    return this.values[offset] ?? this.background;
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

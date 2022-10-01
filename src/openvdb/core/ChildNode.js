import { unsupported } from "../debug";
import { Vector3 } from "../math/vector";
import { GridSharedContext } from "./GridSharedContext";
import { Mask } from "./Mask";
import { Version } from "./Version";

// NOTE Assuming 5_4_3 tree
const log2dimMap = [
  5,
  4,
  3
];

const totalMap = [
  4,
  3,
  0
];

const nodeTypeMap = [
  'internal',
  'internal',
  'leaf',
];

export class ChildNode {
  readNode(depth = 0, props) {
    const { version } = GridSharedContext.getContext(this);

    Object.assign(this, props);

    this.depth = depth;
    this.log2dim = log2dimMap[depth] || 1,
    this.nodeType = nodeTypeMap[depth] || 'invalid';
    this.total = this.log2dim + ((depth) => {
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
    this.numVoxels = Number(1n << (3n * BigInt(this.total)));
    this.background = props.background || 0.0;

    if (depth < 2) {
      this.childMask = new Mask();
      GridSharedContext.passContext(this, this.childMask);
      this.childMask.readMask(this);
      GridSharedContext.cleanContext(this.childMask);
    }

    this.values = [];
    this.valueMask = new Mask();
    GridSharedContext.passContext(this, this.valueMask);
    this.valueMask.readMask(this);
    GridSharedContext.cleanContext(this.valueMask);

    if (depth >= 2) {
      this.leavesCount = 1;
      return;
    } else {
      this.leavesCount = 0;
    }

    this.table = [];

    if (Version.less(version, 214)) {
      unsupported('Internal-node compression');
      return;
    }

    this.readValues();
  }

  isLeaf() {
    return this.level <= 0;
  }

  isInternalNode() {
    return this.level > 0;
  }

  getValueCoords(offset) {
    const vec = new Vector3();

    let x = offset >> 2 * this.log2dim;
    offset &= ((1 << 2 * this.log2dim) - 1);
    let y = offset >> this.log2dim;
    let z = offset & ((1 << this.log2dim) - 1);

    vec.set(x, y, z);

    vec.x = vec.x << this.numVoxels;
    vec.y = vec.y << this.numVoxels;
    vec.z = vec.z << this.numVoxels;

    return vec;
  }

  forEachValue(callback = () => {}) {
    this.valueMask.forEachOn((indices) => {
      callback({
        wordIndex: indices.wordIndex,
        bitIndex: indices.bitIndex,
        offset: indices.offset,
        coords: this.getValueCoords(indices.offset)
      });
    });
  }

  readValues() {
    const { bufferIterator, compression, version } = GridSharedContext.getContext(this);
    const oldVersion = Version.less(version, 222);
    const numValues = oldVersion ? this.childMask.countOff() : this.numValues;
    const useCompression = compression.activeMask;

    let metadata = 0x110;

    if (Version.greaterEq(version, 222)) {
      metadata = bufferIterator.readBytes(1);
    }

    const background = this.background;
    const inactiveVal1 = background;
    const inactiveVal0 = metadata === 6 ? background : !background;

    if ([ 2, 4, 5 ].includes(metadata)) {
      unsupported('Compression::readCompressedValues first conditional');
      // Read one of at most two distinct inactive values.
      //     if (seek) {
      //         is.seekg(/*bytes=*/sizeof(ValueT), std::ios_base::cur);
      //     } else {
      //         is.read(reinterpret_cast<char*>(&inactiveVal0), /*bytes=*/sizeof(ValueT));
      //     }
      //     if (metadata == MASK_AND_TWO_INACTIVE_VALS) {
      //         // Read the second of two distinct inactive values.
      //         if (seek) {
      //             is.seekg(/*bytes=*/sizeof(ValueT), std::ios_base::cur);
      //         } else {
      //             is.read(reinterpret_cast<char*>(&inactiveVal1), /*bytes=*/sizeof(ValueT));
      //         }
      //     }
    }
    
    if ([ 3, 4, 5 ].includes(metadata)) {
      this.selectionMask = new Mask(this);
      GridSharedContext.passContext(this, this.selectionMask);
      this.selectionMask.readMask(this);
      GridSharedContext.cleanContext(this.selectionMask);
    }

    let tempCount = numValues;

    if (useCompression && metadata !== 6 && Version.greaterEq(version, 222)) {
      tempCount = this.valueMask.countOn();
    }

    this.readData(tempCount);

    if (useCompression && tempCount !== numValues) {
      unsupported('Inactive values');
      // Restore inactive values, using the background value and, if available,
      //     // the inside/outside mask.  (For fog volumes, the destination buffer is assumed
      //     // to be initialized to background value zero, so inactive values can be ignored.)
      //     for (Index destIdx = 0, tempIdx = 0; destIdx < MaskT::SIZE; ++destIdx) {
      //         if (valueMask.isOn(destIdx)) {
      //             // Copy a saved active value into this node's buffer.
      //             destBuf[destIdx] = tempBuf[tempIdx];
      //             ++tempIdx;
      //         } else {
      //             // Reconstruct an unsaved inactive value and copy it into this node's buffer.
      //             destBuf[destIdx] = (selectionMask.isOn(destIdx) ? inactiveVal1 : inactiveVal0);
      //         }
      //     }
    }

    this.childMask.forEachOn((indices) => {
      let n = indices.offset;
      const vec = new Vector3();

      let x = n >> 2 * this.log2dim;
      n &= ((1 << 2 * this.log2dim) - 1);
      let y = n >> this.log2dim;
      let z = n & ((1 << this.log2dim) - 1);

      vec.set(x, y, z);

      const child = new ChildNode();
      GridSharedContext.passContext(this, child);

      child.readNode(this.depth + 1, {
        id: indices.offset,
        origin: vec,
        indices: indices,
        background: this.background
      });
      child.parent = this;

      vec.x = vec.x << child.total;
      vec.y = vec.y << child.total;
      vec.z = vec.z << child.total;
      
      this.table.push(child);
      this.leavesCount += child.leavesCount;

      GridSharedContext.cleanContext(child);
    });
  }

  readZipData() {
    const { bufferIterator, valueType, useHalf } = GridSharedContext.getContext(this);
    const zippedBytesCount = bufferIterator.readBytes(8);

    if (zippedBytesCount <= 0) {
      Array(-zippedBytesCount).fill(0).forEach(() => {
        this.values.push(bufferIterator.readFloat(useHalf ? 'half' : valueType));
      });
      
      return;
    } else {
      const zippedBytes = bufferIterator.readRawBytes(zippedBytesCount);
      
      try {
        this.values.push(window.pako.inflate(zippedBytes));
      } catch (error) {
        console.warn('readZipData', 'uncompress', 'error', {error, zippedBytes});
      }
    }
  }

  readData(count) {
    const { bufferIterator, valueType, useHalf, compression } = GridSharedContext.getContext(this);

    if (compression.blosc) {
      unsupported('Compression::BLOSC');
    } else if (compression.zip) {
      this.readZipData();
    } else {
      Array(count).fill(0).forEach(() => {
        this.values.push(bufferIterator.readFloat(useHalf ? 'half' : valueType));
      });
    } 
  }
}
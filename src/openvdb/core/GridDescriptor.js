import { assert, unsupported } from "../debug";
import { BufferIterator } from "./BufferIterator";
import { Compression } from "./Compression";
import { Version } from "./Version";
import {
  boolSize,
  boolType,
  charSize,
  doubleType,
  floatType,
  int32Type,
  int64Type,
  stringType,
  uint32Size,
  uint64Size,
  vec3dType,
  vec3iType,
  vec3sType,
  floatingPointPrecisionLUT,
} from '../math/memory';
import {
  Vector3
} from '../math/vector';

export class GridDescriptor {
  static halfFloatGridPrefix = '_HalfFloat';

  saveAsHalfFloat = false;
  leavesCount = 0;
  voxelsCount = 0;

  uniqueName;
  gridName;
  gridType;
  
  readGrid() {
    BufferIterator.assert(this);

    this.readGridHeader();
    assert('Grid buffer position', this.gridBufferPosition, this.bufferIterator.offset);

    this.readCompression();
    this.readMetadata();
    this.readGridTransform();
    this.readTopology();
  }

  readGridHeader() {
    this.uniqueName = this.bufferIterator.readNameString();
    this.gridName = this.uniqueName.split('\x1e')[0];
    this.gridType = this.bufferIterator.readNameString();

    if (this.gridType.indexOf(GridDescriptor.halfFloatGridPrefix) !== -1) {
      this.saveAsHalfFloat = true;
      this.gridType = this.gridType.split(GridDescriptor.halfFloatGridPrefix).join('');
    }

    if (Version.greaterEq(this, 216)) {
      this.instanceParentName = this.bufferIterator.readNameString();
    }

    // NOTE Buffer offset at which grid description ends
    this.gridBufferPosition = this.bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which grid blocks end
    this.blockBufferPosition = this.bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which the file ends
    this.endBufferPosition = this.bufferIterator.readFloat(int64Type);
  }

  readCompression() {
    if (Version.greaterEq(this, 222)) {
      let compression = this.bufferIterator.readBytes(uint32Size);
      compression = {
        none: compression & 0x0,
        zip: compression & 0x1,
        activeMask: compression & 0x2,
        blosc: compression & 0x4,
      };

      Compression.tagCompression(this, compression);
    } else {
      // NOTE Use inherited compression instead
    }
  }

  readMetadata() {
    this.metadata = {
      count: this.bufferIterator.readBytes(uint32Size)
    };
  
    Array(this.metadata.count).fill(0).forEach(() => {
      const name = this.bufferIterator.readNameString();
      const type = this.bufferIterator.readNameString();
      const value = this.bufferIterator.readNameString(type);
  
      this.metadata[name] = { type, value };
    });

    if (Version.less(this, 219)) {
      this.metadata.name = this.gridName;
    }
  }

  getGridValueType() {
    const value = Object.entries(this.metadata).find(([ id ]) => id === 'value_type');

    return (value ? value[1].value : undefined) || floatType;
  }

  readGridTransform() {
    // NOTE Separate

    if (Version.less(this, 216)) {
      // NOTE Implement this conditional
      unsupported('GridDescriptor::getGridTransform pre-216 transform skipped.');
      return;
    }

    this.transform = {
      mapType: this.bufferIterator.readNameString(),
      translation: new Vector3(),
      scale: new Vector3(),
      voxelSize: new Vector3(),
      scaleInverse: new Vector3(),
      scaleInverseSq: new Vector3(),
      scaleInverseDouble: new Vector3(),
    };

    if (Version.less(this, 219)) {
      unsupported('GridDescriptor::getGridTransform old-style transforms currently not supported. Fallback to identity transform.');
      return;
    }

    if (['UniformScaleTranslateMap', 'ScaleTranslateMap'].includes(this.transform.mapType)) {
      this.transform = {
        ...this.transform,
        translation: this.bufferIterator.readVector3(),
        scale: this.bufferIterator.readVector3(),
        voxelSize: this.bufferIterator.readVector3(),
        scaleInverse: this.bufferIterator.readVector3(),
        scaleInverseSq: this.bufferIterator.readVector3(),
        scaleInverseDouble: this.bufferIterator.readVector3(),
      };

      this.applyTransform = (vector) => {
        return vector.multiply(this.transform.scale).add(this.transform.translation);
      };
    } else if (['UniformScaleMap', 'ScaleMap'].includes(this.transform.mapType)) {
      this.transform = {
        ...this.transform,
        scale: this.bufferIterator.readVector3(),
        voxelSize: this.bufferIterator.readVector3(),
        scaleInverse: this.bufferIterator.readVector3(),
        scaleInverseSq: this.bufferIterator.readVector3(),
        scaleInverseDouble: this.bufferIterator.readVector3(),
      };

      this.applyTransform = (vector) => {
        return vector.multiply(this.transform.scale);
      };
    } else if (['TranslationMap'].includes(this.transform.mapType)) {
      this.transform = {
        ...this.transform,
        translation: this.bufferIterator.readVector3()
      };

      this.applyTransform = (vector) => {
        return vector.add(this.transform.translation);
      };
    } else if (['UnitaryMap'].includes(this.transform.mapType)) {
      // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L1809
      unsupported('GridDescriptor::UnitaryMap');
    } else if (['NonlinearFrustumMap'].includes(this.transform.mapType)) {
      // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L2418
      unsupported('GridDescriptor::NonlinearFrustumMap');
    } else {
      // NOTE Support for any magical map types from https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L538 to be added
      unsupported('GridDescriptor::Matrix4x4');
      // 4x4 transformation matrix
    }
  }

  readTopology() {
    const topologyBufferCount = this.bufferIterator.readBytes(uint32Size);

    if (topologyBufferCount !== 1) {
      // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/tree/Tree.h#L1120
      unsupported('Multi-buffer trees');
      return;
    }

    const valueType = this.getGridValueType();
    this.root = {};
  
    if (this.saveAsHalfFloat) {
      this.root.background = this.bufferIterator.readFloat(valueType);
    } else {
      this.root.background = this.bufferIterator.readFloat(valueType);
    }
  
    this.root.numTiles = this.bufferIterator.readBytes(uint32Size);
    this.root.numChildren = this.bufferIterator.readBytes(uint32Size);
    this.root.table = [];
    this.root.origin = new Vector3();
    const makeTile = (value, active) => ({
      value,
      active: !value ? false : active
    });

    const makeNode = (child, tile) => ({
      child,
      tile,
      isChild: () => !!child,
      isTile: () => !!tile,
      isTileOff: () => tile && !tile.active,
      isTileOn: () => tile && tile.active,
    });

    const makeChild = (level = 0, props) => ({
      ...props,
      log2dim: ([
        5,
        4,
        3
      ])[level] || 1,
      nodeType: ([
        'internal',
        'internal',
        'leaf',
      ])[level] || 'invalid',
      readTopology: (child) => {
        const readMask = () => {
          const mask = {};

          mask.dim = 1 << child.log2dim;
          mask.size = 1 << 3 * child.log2dim;
          mask.wordCount = mask.size >> 6;
          mask.words = [];
          mask.countOn = () => {
            let count = 0;

            mask.words.forEach((word, index) => {
              count += word.split('').filter(bit => bit === '1').length;
            });

            return count;
          };
          mask.countOff = () => mask.size - mask.countOn();
          mask.forEachOn = (callback) => {
            mask.words.forEach((word, wordIndex) => {
              word.split('').forEach((value, bitIndex) => {
                if (value === '1') {
                  const offset = wordIndex * 64 + bitIndex;

                  callback({ wordIndex, bitIndex, offset });
                }
              });
            });
          };
          mask.forEachOff = (callback) => {
            mask.words.forEach((word, wordIndex) => {
              word.split('').forEach((value, bitIndex) => {
                if (value === '0') {
                  const offset = wordIndex * 64 + bitIndex;

                  callback({ wordIndex, bitIndex, offset });
                }
              });
            });
          };

          // let stringified = '';

          Array(mask.wordCount).fill(0).forEach(() => {
            // stringified += '|';

            const fillShift = Array(8).fill('0').join('');
            let byte = Array(8).fill(0)
              .map(() =>
                `${fillShift}${this.bufferIterator.readBytes(1).toString(2).split('-').join('')}`.substr(-8).split('').reverse().join('')
              );

            // let byte = Array(8).fill(0).map(() => this.bufferIterator.readBytes(1).toString(2).split('').join(''));

            // byte.forEach(value => {
            //   stringified += `|${`${Array(8).fill('0').join('')}${value}`.substr(-8)}`;
            // });

            byte = byte.join('');
            mask.words.push(`${Array(64).fill('0').join('')}${byte}`.substr(-64));
          });

          // console.info(stringified);

          mask.onCache = mask.countOn();
          mask.offCache = mask.countOff();

          return mask;
        };

        child.total = child.log2dim + ((level) => {
          const totalMap = [
            4,
            3,
            0
          ];
          let sum = 0;

          totalMap.forEach((value, index) => {
            if (index >= level) {
              sum += value;
            }
          });

          return sum;
        })(level);
        child.dim = 1 << child.total;
        child.numValues = 1 << (3 * child.log2dim);
        child.level = 2 - level;
        child.numVoxels = Number(1n << (3n * BigInt(child.total)));

        if (child.level === 0) {
          this.leavesCount++;
        }

        if (level < 2) {
          child.childMask = readMask();
        }

        child.valueMask = readMask();
        this.voxelsCount += child.valueMask.onCache;

        child.forEachValue = (callback) => {
          const vec = new Vector3();

          const getValueCoords = (n) => {
            let x = n >> 2 * child.log2dim;
            n &= ((1 << 2 * child.log2dim) - 1);
            let y = n >> child.log2dim;
            let z = n & ((1 << child.log2dim) - 1);

            vec.set(x, y, z);

            vec.x = vec.x << child.numVoxels;
            vec.y = vec.y << child.numVoxels;
            vec.z = vec.z << child.numVoxels;

            return vec;
          };

          child.valueMask.forEachOn((indices) => {
            callback({
              ...indices,
              coords: getValueCoords(indices.offset)
            });
          });
        };

        if (level >= 2) {
          child.leaf = true;
          return;
        }

        child.table = [];
        child.values = [];

        if (Version.less(this, 214)) {
          unsupported('Internal-node compression');
        } else {
          const oldVersion = Version.less(this, 222);
          const numValues = oldVersion ? child.childMask.countOff() : child.numValues;

          const useHalf = this.saveAsHalfFloat;
          const useCompression = Compression.getCompression(this).activeMask;

          let metadata = 6;

          if (Version.greaterEq(this, 222)) {
            metadata = this.bufferIterator.readBytes(1);
          }

          const background = this.root.background || 0;
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
            child.selectionMask = readMask();
          }

          let tempCount = numValues;

          if (useCompression && metadata !== 6 && Version.greaterEq(this, 222)) {
            tempCount = child.valueMask.countOn();
          }

          const readZipData = async () => {
            const zippedBytesCount = this.bufferIterator.readBytes(8);

            if (zippedBytesCount <= 0) {
              Array(-zippedBytesCount).fill(0).forEach(() => {
                child.values.push(this.bufferIterator.readFloat(useHalf ? 'half' : valueType));
              });
              
              return;
            } else {
              const zippedBytes = this.bufferIterator.readRawBytes(zippedBytesCount);
              
              try {
                child.values.push(window.pako.inflate(zippedBytes));
              } catch (error) {
                console.warn('readZipData', 'uncompress', 'error', {error, zippedBytes});
              }
            }
          };

          const readData = () => {
            if (Compression.getCompression(this).blosc) {
              unsupported('Compression::BLOSC');
            } else if (Compression.getCompression(this).zip) {
              readZipData(tempCount);
            } else {
              Array(tempCount).fill(0).forEach(() => {
                child.values.push(this.bufferIterator.readFloat(useHalf ? 'half' : valueType));
              });
            }
          };

          readData();

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

          if (level >= 2) {
            return;
          }

          child.childMask.forEachOn((indices) => {
            let n = indices.offset;
            const vec = new Vector3();

            let x = n >> 2 * child.log2dim;
            n &= ((1 << 2 * child.log2dim) - 1);
            let y = n >> child.log2dim;
            let z = n & ((1 << child.log2dim) - 1);

            vec.set(x, y, z);

            const subChild = makeChild(level + 1, {
              origin: vec,
              indices,
              background: this.root.background
            });
            subChild.id = indices.offset;
            subChild.readTopology(subChild);
            subChild.parent = child;

            vec.x = vec.x << subChild.total;
            vec.y = vec.y << subChild.total;
            vec.z = vec.z << subChild.total;
            
            child.table.push(subChild);
          });
        }
      }
    });

    if (this.numTiles === 0 && this.numChildren === 0) {
      unsupported('Empty root node');
    } else {
      Array(this.root.numTiles).fill(0).forEach(() => {
        const vec = new Vector3(
          this.bufferIterator.readFloat('int32'),
          this.bufferIterator.readFloat('int32'),
          this.bufferIterator.readFloat('int32'),
        );
        const value = this.bufferIterator.readFloat(valueType);
        const active = readBool();

        // NOTE toString() as keys optimal 11/10
        this.root.push(makeNode(null, makeTile(value, active)));

        unsupported('Tile nodes');
      });

      Array(this.root.numChildren).fill(0).forEach((_, index) => {
        const vec = new Vector3(
          this.bufferIterator.readFloat('int32'),
          this.bufferIterator.readFloat('int32'),
          this.bufferIterator.readFloat('int32'),
        );

        const child = makeChild(0, {
          origin: vec,
          background: this.root.background
        });
        child.id = index;
        child.readTopology(child);
        child.parent = this.root;

        this.root.table.push(child);
      });
    }

    assert('block buffer', this.blockBufferPosition, this.bufferIterator.offset);
  }
}

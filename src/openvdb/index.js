import './debug';
import './dependencies';

import { DEBUG, print, assert, unsupported } from './debug';
import {
  charSize,
  uint32Size,
  uint64Size,
  doubleSize,
} from './math/memory';

import {
  Vector3
} from './math/vector';

const parseVDB = (url) => new Promise((resolve) => {

  fetch(url).then(async (vdb) => {
    const source = new Uint8Array(await vdb.arrayBuffer());

    let buffer = 0;
    let offset = 0;

    const readBytes = (count) => {
      buffer = 0;

      source.slice(offset, offset + count).forEach((byte, index) => {
        buffer = buffer | (byte << (8 * index));
      });

      offset += count;

      return buffer;
    };

    const readRawBytes = (count) => {
      const raw = [];

      if (DEBUG) console.groupCollapsed();

      source.slice(offset, offset + count).forEach((byte, index) => {
        raw.push(byte);
      });

      if (DEBUG) console.groupEnd();

      offset += count;

      return Uint8Array.from(raw);
    };

    const readBool = () => {
      return Boolean(readBytes(1));
    };

    const readNameString = (castTo = 'string') => {
      const nameSize = readBytes(uint32Size);
      let name = '';

      if (castTo === 'int64') {
        name = readFloat('int64');
      } else if (castTo === 'bool') {
        name = Boolean(readBytes(nameSize));
      } else if (castTo === 'vec3i') {
        name = new Vector3(
          readFloat('int32'),
          readFloat('int32'),
          readFloat('int32'),
        );
      } else if (castTo === 'vec3s') {
        name = new Vector3(
          readFloat('float'),
          readFloat('float'),
          readFloat('float'),
        );
      } else if (castTo === 'vec3d') {
        name = new Vector3(
          readFloat('double'),
          readFloat('double'),
          readFloat('double'),
        );
      } else {
        Array(nameSize).fill(0).map((_) => name += String.fromCharCode(readBytes(1)));
      }

      return name;
    };

    const readFloat = (precision = 'double') => {
      buffer = 0;

      const precisionLUT = { // REF https://www.appinf.com/download/FPIssues.pdf
        'double': {
          exp: 11,
          bias: (1 << (11 - 1)) - 1,
          size: doubleSize
        },
        'float': {
          exp: 8,
          bias: (1 << (8 - 1)) - 1,
          size: uint32Size
        },
        'int32': {
          size: uint32Size
        },
        'int64': {
          size: uint64Size
        },
        'half': {
          size: uint32Size / 2,
          exp: 5,
          bias: (1 << (5 - 1)) - 1
        }
      }[precision];

      if (DEBUG) console.groupCollapsed(`readFloat<${precision}>`);

      let binary = [];
      Array(precisionLUT.size).fill(0).forEach(() => {
        binary.unshift(readBytes(1));
      });
      binary = binary.map(i => `00000000${i.toString(2)}`.substr(-8)).join('');

      if (precision.includes('int')) {
        if (DEBUG) console.groupEnd();
        // REF https://stackoverflow.com/questions/37022434/how-do-i-parse-a-twos-complement-string-to-a-number
        return ~~parseInt(binary, 2);
      }

      const sign = binary.slice(0, 1) === '1' ? -1 : 1;
      const exponent = parseInt(binary.slice(1, precisionLUT.exp + 1), 2) - precisionLUT.bias;
      const mantissa = '1' + binary.slice(precisionLUT.exp + 1, precision.size);

      let v1 = exponent < 0 ? 0.0 : mantissa.substr(0, exponent + 1);
      let v2 = '0.' + (Array(exponent < 0 ? -exponent - 1 : 0).fill('0').join('')) + mantissa.substr(exponent < 0 ? 0.0 : exponent + 1);

      v1 = parseInt(v1, 2);
      v2 = parseInt(v2.replace('.', ''), 2) / Math.pow(2, (v2.split('.')[1] || '').length); // REF https://stackoverflow.com/questions/37109968/how-to-convert-binary-fraction-to-decimal

      if (v1 === 0 && v2 === 0) {
        return 0;
      }

      if (DEBUG) console.groupEnd();

      return sign * (v1 + v2);
    };

    const readVector3 = (precision = 'double') => {
      const vector = new Vector3();

      vector.x = readFloat(precision);
      vector.y = readFloat(precision);
      vector.z = readFloat(precision);

      return vector;
    };

    const magic = readBytes(uint64Size);

    if (magic !== 0x56444220) {
      print('VDB File Invalid', magic.toString(16));
    } else {
      print('VDB File valid', magic.toString(16));
    }

    const versionMajor = readBytes(uint32Size);
    let libraryVersionMajor = 0;
    let libraryVersionMinor = 0;

    if (versionMajor > 211) {
      libraryVersionMajor = readBytes(uint32Size);
      libraryVersionMinor = readBytes(uint32Size);
    }

    print({
      versionMajor,
      libraryVersionMajor,
      libraryVersionMinor
    });

    const hasGridOffsets = readBytes(charSize);

    let compression;

    if (versionMajor >= 220 && versionMajor < 222) {
      compression = readBytes(charSize);
      compression = {
        none: compression & 0x0,
        zip: compression & 0x1,
        activeMask: compression & 0x2,
        blosc: compression & 0x4,
      };
    } else {
      compression = {
        none: false, // compressionFlags & 0x0,
        zip: false, // compressionFlags & 0x1,
        activeMask: true, // compressionFlags & 0x2,
        blosc: false // compressionFlags & 0x4
      };
    }

    const getGridCompression = (word) => {
      return {
        none: word & 0x0,
        zip: word & 0x1,
        activeMask: word & 0x2,
        blosc: word & 0x4,
      };
    };

    print({hasGridOffsets, compression});

    let uuid = '';
    Array(36).fill(0).map((_) => uuid += String.fromCharCode(readBytes(1)));
    print({uuid});

    const metadata = {};
    const metadataCount = readBytes(uint32Size);
    Array(metadataCount).fill(0).forEach(() => {
      const name = readNameString();
      const type = readNameString();
      const value = readNameString(type);

      metadata[name] = { type, value };
    });

    print({metadata});

    let grids = {};

    if (!hasGridOffsets) {
      // TODO Handle case without grid offsets
      // File.cc:364
      unsupported('VDB without grid offsets');
    } else {
      const gridCount = readBytes(uint32Size);

      Array(gridCount).fill(0).forEach(() => {
        const gridDescriptor = {
          saveAsHalfFloat: false,
          leavesCount: 0,
          voxelsCount: 0
        };

        // read
        gridDescriptor.uniqueName = readNameString();
        gridDescriptor.gridName = (gridDescriptor.uniqueName).split('\x1e')[0];

        grids[gridDescriptor.uniqueName] = gridDescriptor;

        gridDescriptor.gridType = readNameString();

        if (gridDescriptor.gridType.indexOf('_HalfFloat') !== -1) {
          gridDescriptor.saveAsHalfFloat = true;
          gridDescriptor.gridType = gridDescriptor.gridType.split('_HalfFloat')[0];
        }

        if (versionMajor >= 216) {
          gridDescriptor.instanceParentName = readNameString();
        }

        gridDescriptor.gridBufferPosition = readFloat('int64'); // NOTE Buffer offset at which grid description ends
        gridDescriptor.blockBufferPosition = readFloat('int64'); // NOTE Buffer offset at which grid blocks end
        gridDescriptor.endBufferPosition = readFloat('int64'); // NOTE Buffer offset at which the file ends
        
        assert('grid buffer', gridDescriptor.gridBufferPosition, offset);

        if (versionMajor >= 222) {
          gridDescriptor.gridCompression = getGridCompression(readBytes(uint32Size));
        } else {
          gridDescriptor.gridCompression = compression;
        }

        gridDescriptor.metadata = {
          count: readBytes(uint32Size)
        };

        Array(gridDescriptor.metadata.count).fill(0).forEach(() => {
          const name = readNameString();
          const type = readNameString();
          const value = readNameString(type);

          gridDescriptor.metadata[name] = { type, value };
        });
        
        const getGridValueType = () => {
          const value = Object.entries(gridDescriptor.metadata).find(([ id, value ]) => id === 'value_type');

          return (value ? value[1].value : undefined) || 'float';
        };

        const getGridTransform = () => {
          gridDescriptor.transform = {
            mapType: readNameString(),
            translation: new Vector3(),
            scale: new Vector3(),
            voxelSize: new Vector3(),
            scaleInverse: new Vector3(),
            scaleInverseSq: new Vector3(),
            scaleInverseDouble: new Vector3(),
          };

          if (versionMajor < 219) {
            console.warn('GridDescriptor', 'getGridTransform', 'old-style transforms currently not supported.');
            return;
          }

          if (['UniformScaleTranslateMap', 'ScaleTranslateMap'].includes(gridDescriptor.transform.mapType)) {
            gridDescriptor.transform = {
              ...gridDescriptor.transform,
              translation: readVector3(),
              scale: readVector3(),
              voxelSize: readVector3(),
              scaleInverse: readVector3(),
              scaleInverseSq: readVector3(),
              scaleInverseDouble: readVector3(),
            };

            gridDescriptor.applyTransform = (vector) => {
              return vector.multiply(gridDescriptor.transform.scale).add(gridDescriptor.transform.translation);
            };
          } else if (['UniformScaleMap', 'ScaleMap'].includes(gridDescriptor.transform.mapType)) {
            gridDescriptor.transform = {
              ...gridDescriptor.transform,
              scale: readVector3(),
              voxelSize: readVector3(),
              scaleInverse: readVector3(),
              scaleInverseSq: readVector3(),
              scaleInverseDouble: readVector3(),
            };

            gridDescriptor.applyTransform = (vector) => {
              return vector.multiply(gridDescriptor.transform.scale);
            };
          } else if (['TranslationMap'].includes(gridDescriptor.transform.mapType)) {
            gridDescriptor.transform = {
              ...gridDescriptor.transform,
              translation: readVector3()
            };

            gridDescriptor.applyTransform = (vector) => {
              return vector.add(gridDescriptor.transform.translation);
            };
          } else if (['UnitaryMap'].includes(gridDescriptor.transform.mapType)) {
            // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L1809
            unsupported('GridDescriptor::UnitaryMap');
          } else if (['NonlinearFrustumMap'].includes(gridDescriptor.transform.mapType)) {
            // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L2418
            unsupported('GridDescriptor::NonlinearFrustumMap');
          } else {
            // NOTE Support for any magical map types from https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L538 to be added
            unsupported('GridDescriptor::Matrix4x4');
            // 4x4 transformation matrix
          }
        };

        if (versionMajor >= 216) {
          getGridTransform();
        } else {
          getGridTransform();
        }

        if (versionMajor < 219) {
          gridDescriptor.metadata.name = gridDescriptor.gridName;
        }

        gridDescriptor.topology = {
          bufferCount: readBytes(uint32Size)
        };

        if (gridDescriptor.topology.bufferCount !== 1) {
          // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/tree/Tree.h#L1120
          unsupported('Multi-buffer trees');
        }

        const valueType = getGridValueType();
        const { saveAsHalfFloat } = gridDescriptor;

        gridDescriptor.root = {};

        if (saveAsHalfFloat) {
          gridDescriptor.root.background = readFloat(valueType);
        } else {
          gridDescriptor.root.background = readFloat(valueType);
        }

        gridDescriptor.root.numTiles = readBytes(uint32Size);
        gridDescriptor.root.numChildren = readBytes(uint32Size);
        gridDescriptor.root.table = [];
        gridDescriptor.root.origin = new Vector3();

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
                    `${fillShift}${readBytes(1).toString(2).split('-').join('')}`.substr(-8).split('').reverse().join('')
                  );

                // let byte = Array(8).fill(0).map(() => readBytes(1).toString(2).split('').join(''));

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
              gridDescriptor.leavesCount++;
            }

            if (level < 2) {
              child.childMask = readMask();
            }

            child.valueMask = readMask();
            gridDescriptor.voxelsCount += child.valueMask.onCache;

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

            if (versionMajor < 214) {
              unsupported('Internal-node compression');
            } else {
              const oldVersion = versionMajor < 222;
              const numValues = oldVersion ? child.childMask.countOff() : child.numValues;

              const useHalf = gridDescriptor.saveAsHalfFloat;
              const useCompression = gridDescriptor.gridCompression.activeMask;

              let metadata = 6;

              if (versionMajor >= 222) {
                metadata = readBytes(1);
              }

              const background = gridDescriptor.root.background || 0;
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

              if (useCompression && metadata !== 6 && versionMajor >= 222) {
                tempCount = child.valueMask.countOn();
              }

              const readZipData = async () => {
                const zippedBytesCount = readBytes(8);

                if (zippedBytesCount <= 0) {
                  Array(-zippedBytesCount).fill(0).forEach(() => {
                    child.values.push(readFloat(useHalf ? 'half' : valueType));
                  });
                  
                  return;
                } else {
                  const zippedBytes = readRawBytes(zippedBytesCount);
                  
                  try {
                    child.values.push(window.pako.inflate(zippedBytes));
                  } catch (error) {
                    console.warn('readZipData', 'uncompress', 'error', {error, zippedBytes});
                  }
                }
              };

              const readData = () => {
                if (gridDescriptor.gridCompression.blosc) {
                  unsupported('Compression::BLOSC');
                } else if (gridDescriptor.gridCompression.zip) {
                  readZipData(tempCount);
                } else {
                  Array(tempCount).fill(0).forEach(() => {
                    child.values.push(readFloat(useHalf ? 'half' : valueType));
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
                  background: gridDescriptor.root.background
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

        if (gridDescriptor.numTiles === 0 && gridDescriptor.numChildren === 0) {
          unsupported('Empty root node');
        } else {
          Array(gridDescriptor.root.numTiles).fill(0).forEach(() => {
            const vec = new Vector3(
              readFloat('int32'),
              readFloat('int32'),
              readFloat('int32'),
            );
            const value = readFloat(valueType);
            const active = readBool();

            // NOTE toString() as keys optimal 11/10
            gridDescriptor.root.push(makeNode(null, makeTile(value, active)));

            unsupported('Tile nodes');
          });

          Array(gridDescriptor.root.numChildren).fill(0).forEach((_, index) => {
            const vec = new Vector3(
              readFloat('int32'),
              readFloat('int32'),
              readFloat('int32'),
            );

            const child = makeChild(0, {
              origin: vec,
              background: gridDescriptor.root.background
            });
            child.id = index;
            child.readTopology(child);
            child.parent = gridDescriptor.root;

            gridDescriptor.root.table.push(child);
          });
        }

        assert('block buffer', gridDescriptor.blockBufferPosition, offset);
      });
    }

    print({grids});

    resolve(grids);

    print('');
    print('-------------------------------------------------');
  });
});

window.parseVDB = parseVDB;

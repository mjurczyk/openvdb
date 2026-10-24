import { unsupported } from '../debug';
import {
  boolSize,
  boolType,
  charSize,
  doubleSize,
  doubleType,
  floatSize,
  floatType,
  halfFloatType,
  int32Type,
  int64Type,
  pointDataIndex32,
  pointDataIndex64,
  stringType,
  uint32Size,
  uint64Size,
  vec3dType,
  vec3hType,
  vec3iType,
  vec3sType,
} from '../math/memory';
import { Vector3 } from '../math/vector';

// NOTE VDB files are little-endian
const littleEndian = true;

const vectorComponentTypeMap = {
  [vec3hType]: halfFloatType,
  [vec3sType]: floatType,
  [vec3iType]: int32Type,
  [vec3dType]: doubleType,
};

export class BufferIterator {
  source = null;
  view = null;
  offset = 0;

  constructor(source) {
    if (!(source instanceof Uint8Array)) {
      console.error('BufferIterator', 'constructor', 'source must be an Uint8Array buffer.');
      throw 0;
    }

    this.source = source;
    this.view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  }

  reset() {
    this.offset = 0;
  }

  readUint8() {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;

    return value;
  }

  readUint16() {
    const value = this.view.getUint16(this.offset, littleEndian);
    this.offset += 2;

    return value;
  }

  readUint32() {
    const value = this.view.getUint32(this.offset, littleEndian);
    this.offset += uint32Size;

    return value;
  }

  readInt32() {
    const value = this.view.getInt32(this.offset, littleEndian);
    this.offset += uint32Size;

    return value;
  }

  // NOTE 64-bit integers convert to Number. Values above 2^53 lose precision.
  readInt64() {
    const value = Number(this.view.getBigInt64(this.offset, littleEndian));
    this.offset += uint64Size;

    return value;
  }

  readUint64() {
    const value = Number(this.view.getBigUint64(this.offset, littleEndian));
    this.offset += uint64Size;

    return value;
  }

  // NOTE IEEE 754 binary16. DataView.getFloat16 is not available in all runtimes.
  readFloat16() {
    const bits = this.readUint16();
    const sign = bits & 0x8000 ? -1 : 1;
    const exponent = (bits >> 10) & 0x1f;
    const fraction = bits & 0x3ff;

    if (exponent === 0) {
      return sign * 2 ** -14 * (fraction / 1024);
    }

    if (exponent === 0x1f) {
      return fraction ? NaN : sign * Infinity;
    }

    return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
  }

  readFloat32() {
    const value = this.view.getFloat32(this.offset, littleEndian);
    this.offset += floatSize;

    return value;
  }

  readFloat64() {
    const value = this.view.getFloat64(this.offset, littleEndian);
    this.offset += doubleSize;

    return value;
  }

  // NOTE Reads 1, 2 and 4 bytes as unsigned, 8 bytes as signed int64
  readBytes(count) {
    switch (count) {
      case 1:
        return this.readUint8();
      case 2:
        return this.readUint16();
      case uint32Size:
        return this.readUint32();
      case uint64Size:
        return this.readInt64();
      default: {
        let value = 0;

        for (let index = 0; index < count; index++) {
          value += this.view.getUint8(this.offset + index) * 2 ** (8 * index);
        }

        this.offset += count;

        return value;
      }
    }
  }

  readRawBytes(count) {
    const raw = this.source.slice(this.offset, this.offset + count);

    this.offset += count;

    return raw;
  }

  readBool() {
    return Boolean(this.readBytes(boolSize));
  }

  // NOTE VDB String format
  //      0123 0............M
  //      ^    ^
  //      | string length
  //           | string value
  // TODO Rename to readString
  readString(castTo = stringType) {
    const nameSize = this.readBytes(uint32Size);
    let name = '';

    if (castTo === int64Type) {
      name = this.readFloat(int64Type);
    } else if (castTo === boolType) {
      name = Boolean(this.readBytes(nameSize));
    } else if (castTo === vec3iType) {
      name = new Vector3(
        this.readFloat(int32Type),
        this.readFloat(int32Type),
        this.readFloat(int32Type)
      );
    } else if (castTo === vec3sType) {
      name = new Vector3(
        this.readFloat(floatType),
        this.readFloat(floatType),
        this.readFloat(floatType)
      );
    } else if (castTo === vec3dType) {
      name = new Vector3(
        this.readFloat(doubleType),
        this.readFloat(doubleType),
        this.readFloat(doubleType)
      );
    } else {
      Array(nameSize)
        .fill(0)
        .map((_) => (name += String.fromCharCode(this.readBytes(charSize))));
    }

    return name;
  }

  readFloat(precision = doubleType) {
    switch (precision) {
      case halfFloatType:
        return this.readFloat16();
      case floatType:
        return this.readFloat32();
      case doubleType:
        return this.readFloat64();
      case int32Type:
        return this.readInt32();
      case int64Type:
        return this.readInt64();
      case pointDataIndex32:
        return this.readUint32();
      case pointDataIndex64:
        return this.readUint64();
      case vec3hType:
      case vec3sType:
      case vec3iType:
      case vec3dType:
        return this.readVector3(vectorComponentTypeMap[precision]);
      default:
        unsupported(`Unknown value type: ${precision}`);
        throw new Error(`BufferIterator: unknown value type "${precision}".`);
    }
  }

  readVector3(precision = doubleType) {
    const vector = new Vector3();

    vector.x = this.readFloat(precision);
    vector.y = this.readFloat(precision);
    vector.z = this.readFloat(precision);

    return vector;
  }

  skip(count) {
    this.offset += count;
  }
}

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
  vec3dType,
  vec3iType,
  vec3sType,
  floatingPointPrecisionLUT
} from '../math/memory';
import {
  Vector3
} from '../math/vector';

export class BufferIterator {
  source = null;
  offset = 0;

  constructor(source) {
    if (!(source instanceof Uint8Array)) {
      console.error('BufferIterator', 'constructor', 'source must be an Uint8Array buffer.');
      throw 0;
    }

    this.source = source;
  }

  static withBufferIterator(target, bufferIterator) {
    target.bufferIterator = bufferIterator;

    return target;
  }

  static assert(target) {
    if (!target.bufferIterator) {
      console.error('BufferIterator', 'assertInjection', 'buffer iterator does not exist on target', { target });
      throw 0;
    }
  }

  reset() {
    this.offset = 0;
  }

  readBytes(count) {
    let buffer = 0;

    this.source.slice(this.offset, this.offset + count).forEach((byte, index) => {
      buffer = buffer | (byte << (8 * index));
    });

    this.offset += count;

    return buffer;
  }

  readRawBytes(count) {
    const raw = [];

    this.source.slice(this.offset, this.offset + count).forEach((byte, index) => {
      raw.push(byte);
    });

    this.offset += count;

    return Uint8Array.from(raw);
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
  readNameString(castTo = stringType) {
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
        this.readFloat(int32Type),
      );
    } else if (castTo === vec3sType) {
      name = new Vector3(
        this.readFloat(floatType),
        this.readFloat(floatType),
        this.readFloat(floatType),
      );
    } else if (castTo === vec3dType) {
      name = new Vector3(
        this.readFloat(doubleType),
        this.readFloat(doubleType),
        this.readFloat(doubleType),
      );
    } else {
      Array(nameSize).fill(0).map((_) => name += String.fromCharCode(this.readBytes(charSize)));
    }

    return name;
  }

  readFloat(precision = doubleType) {
    const precisionLUT = floatingPointPrecisionLUT[precision];

    let binary = [];
    Array(precisionLUT.size).fill(0).forEach(() => {
      binary.unshift(this.readBytes(charSize));
    });
    binary = binary.map(i => `00000000${i.toString(2)}`.substr(-8)).join('');

    if ([ int32Type, int64Type ].includes(precision)) {
      // NOTE https://stackoverflow.com/questions/37022434/how-do-i-parse-a-twos-complement-string-to-a-number
      return ~~parseInt(binary, 2);
    }

    const sign = binary.slice(0, 1) === '1' ? -1 : 1;
    const exponent = parseInt(binary.slice(1, precisionLUT.exp + 1), 2) - precisionLUT.bias;
    const mantissa = '1' + binary.slice(precisionLUT.exp + 1, precision.size);

    // NOTE https://stackoverflow.com/questions/37109968/how-to-convert-binary-fraction-to-decimal
    let v1 = exponent < 0 ? 0.0 : mantissa.substr(0, exponent + 1);
    let v2 = '0.' + (Array(exponent < 0 ? -exponent - 1 : 0).fill('0').join('')) + mantissa.substr(exponent < 0 ? 0.0 : exponent + 1);
    
    v1 = parseInt(v1, 2);
    v2 = parseInt(v2.replace('.', ''), 2) / Math.pow(2, (v2.split('.')[1] || '').length);

    if (v1 === 0 && v2 === 0) {
      return 0;
    }

    return sign * (v1 + v2);
  }

  readVector3(precision = doubleType) {
    const vector = new Vector3();

    vector.x = this.readFloat(precision);
    vector.y = this.readFloat(precision);
    vector.z = this.readFloat(precision);

    return vector;
  }
}

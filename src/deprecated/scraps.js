// NOTE Code-scraps from the original implementation

const parseTest = () => {
  fetch('https://cdn.wtlstudio.com/sample.wtlstudio.com/76fce0b9-3723-47cb-a948-4197e7302f9d.bin-test').then(async (test) => {
    const source = new Uint8Array(await test.arrayBuffer());

    let buffer = 0;
    let offset = 0;

    const readBytes = (count) => {
      buffer = 0;

      if (DEBUG) console.groupCollapsed();

      source.slice(offset, offset + count).forEach((byte, index) => {
        buffer = buffer | (byte << (8 * index));
        debugLog(byte, byte.toString(16));
      });

      if (DEBUG) console.groupEnd();

      offset += count;

      return buffer;
    };

    const readFloat = (precision = 'double') => {
      buffer = 0;

      const precisionLUT = { // REF https://www.appinf.com/download/FPIssues.pdf
        'double': {
          exp: 11,
          bias: 1023,
          size: doubleSize
        },
        'float': {
          exp: 8,
          bias: 127,
          size: uint32Size
        },
        'int': {
          size: uint32Size
        }
      }[precision];
      
      if (DEBUG) console.groupCollapsed(`readFloat<${precision}>`);

      let binary = [];
      Array(precisionLUT.size).fill(0).forEach(() => {
        binary.unshift(readBytes(1));
      });
      binary = binary.map(i => `00000000${i.toString(2)}`.substr(-8)).join('');

      if (precision === 'int') {
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

      if (DEBUG) console.groupEnd();

      // console.info(sign * (v1 + v2));

      return sign * (v1 + v2);
    };

    const readVector3 = () => {
      const vector = new Three.Vector3();

      vector.x = readFloat();
      vector.y = readFloat();
      vector.z = readFloat();

      return vector;
    };

    readFloat();
    readFloat();
    readFloat();
    readFloat();
    readFloat();
    readFloat();
    readFloat();
    readFloat();
    readFloat();
    readFloat('float');
    readFloat('float');
    readFloat('float');
    readFloat('int');
    readFloat('int');
    readFloat('int');
  });
};
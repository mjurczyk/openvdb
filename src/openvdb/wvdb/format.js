// NOTE .wvdb file layout (see src/docs/wvdb/README.md):
//   "WVDB" | uint32 version | uint32 header length | header JSON (UTF-8) | chunks
// Chunk offsets in the header start at the first byte after the header JSON.
// Chunks are ordered coarse to fine: LOD 0 of all grids, then LOD 1 of all grids, and so on.
// Each chunk is one zlib (deflate) stream. All numbers are little-endian.
//
// Page chunk, after inflate (channels: 1 for scalar grids, 3 for vector grids):
//   uint32 brick count
//   uint32 brick index[count]          (sparse layout only)
//   float32 min[count * channels]      (brick 0 channel 0, brick 0 channel 1, ...)
//   float32 max[count * channels]
//   codes                              (brickVoxels uint8 or uint16 values per brick channel with min !== max)
// Mask chunk (sparse layout only), after inflate:
//   uint32 words[ceil(brick total / 32)]   (bit set = brick is stored)
// Points chunk (points grids, version 2), after inflate:
//   uint32 point count
//   float32 min[3], float32 max[3]     (box of the points of the chunk)
//   uint8 codes[6 * count]             (x high bytes, x low bytes, y high, y low, z high, z low)
//   uint8 colors[3 * count]            (red, green, blue; only if the grid has colors)

export const wvdbMagic = 'WVDB';
// NOTE Newest version that this code reads. Writers use version 1 for files without points grids.
export const wvdbVersion = 2;
export const wvdbPointsVersion = 2;

// NOTE Magic, version and header length
export const wvdbPreambleSize = 12;

export const brickLog2Dim = 3;
export const brickDim = 1 << brickLog2Dim;
export const brickVoxels = 1 << (3 * brickLog2Dim);

export const wvdbLayouts = {
  dense: 'dense',
  sparse: 'sparse',
};

export const wvdbGridTypes = {
  volume: 'volume',
  points: 'points',
};

// NOTE Point positions are 16-bit codes in the box of their chunk
const pointCodeMax = 0xffff;

export const getBrickCounts = ([x, y, z]) => [
  Math.ceil(x / brickDim),
  Math.ceil(y / brickDim),
  Math.ceil(z / brickDim),
];

export const getBrickTotal = (dimensions) =>
  getBrickCounts(dimensions).reduce((total, count) => total * count, 1);

// NOTE Brick origin in voxels. Bricks are numbered x first, then y, then z.
export const getBrickOrigin = (dimensions, index) => {
  const [countX, countY] = getBrickCounts(dimensions);

  return [
    (index % countX) * brickDim,
    (Math.floor(index / countX) % countY) * brickDim,
    Math.floor(index / (countX * countY)) * brickDim,
  ];
};

// NOTE bricks: [{ index, values: Float32Array(brickVoxels * channels) }], one channel after the other.
// Each channel of each brick is quantized with its own min and max.
export const encodeWVDBPage = (bricks, { layout, bits, channels = 1 }) => {
  const isSparse = layout === wvdbLayouts.sparse;
  const count = bricks.length;
  const codeSize = bits / 8;
  const maxCode = (1 << bits) - 1;

  const ranges = bricks.flatMap(({ values }) =>
    Array.from({ length: channels }, (_, channel) => {
      let min = Infinity;
      let max = -Infinity;

      values.subarray(channel * brickVoxels, (channel + 1) * brickVoxels).forEach((value) => {
        min = Math.min(min, value);
        max = Math.max(max, value);
      });

      return { min: Math.fround(min), max: Math.fround(max) };
    })
  );

  const varying = ranges.filter(({ min, max }) => min !== max).length;
  const size =
    4 + (isSparse ? 4 * count : 0) + 8 * count * channels + varying * brickVoxels * codeSize;
  const view = new DataView(new ArrayBuffer(size));

  let offset = 0;

  view.setUint32(offset, count, true);
  offset += 4;

  if (isSparse) {
    bricks.forEach(({ index }) => {
      view.setUint32(offset, index, true);
      offset += 4;
    });
  }

  ranges.forEach(({ min }) => {
    view.setFloat32(offset, min, true);
    offset += 4;
  });

  ranges.forEach(({ max }) => {
    view.setFloat32(offset, max, true);
    offset += 4;
  });

  bricks.forEach(({ values }, brick) => {
    for (let channel = 0; channel < channels; channel++) {
      const { min, max } = ranges[brick * channels + channel];

      if (min === max) {
        continue;
      }

      const scale = maxCode / (max - min);

      values.subarray(channel * brickVoxels, (channel + 1) * brickVoxels).forEach((value) => {
        const code = Math.min(Math.max(Math.round((value - min) * scale), 0), maxCode);

        if (codeSize === 2) {
          view.setUint16(offset, code, true);
        } else {
          view.setUint8(offset, code);
        }

        offset += codeSize;
      });
    }
  });

  return new Uint8Array(view.buffer);
};

// NOTE Workers run this function from its source text. It must not use names from outside the function.
// firstIndex is the index of the first brick of a dense page.
// values has brickVoxels * channels values per brick, one channel after the other.
export function decodeWVDBPage(bytes, { layout, bits, firstIndex = 0, channels = 1 }) {
  const voxels = 512;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(0, true);
  const maxCode = (1 << bits) - 1;

  let offset = 4;

  const indices = new Uint32Array(count);

  for (let i = 0; i < count; i++) {
    if (layout === 'sparse') {
      indices[i] = view.getUint32(offset, true);
      offset += 4;
    } else {
      indices[i] = firstIndex + i;
    }
  }

  const ranges = count * channels;
  const mins = new Float32Array(ranges);
  const maxs = new Float32Array(ranges);

  for (let i = 0; i < ranges; i++) {
    mins[i] = view.getFloat32(offset, true);
    offset += 4;
  }

  for (let i = 0; i < ranges; i++) {
    maxs[i] = view.getFloat32(offset, true);
    offset += 4;
  }

  const values = new Float32Array(ranges * voxels);

  for (let i = 0; i < ranges; i++) {
    const min = mins[i];
    const max = maxs[i];
    const target = i * voxels;

    if (min === max) {
      values.fill(min, target, target + voxels);
      continue;
    }

    const step = (max - min) / maxCode;

    for (let voxel = 0; voxel < voxels; voxel++) {
      let code;

      if (bits === 16) {
        code = view.getUint16(offset, true);
        offset += 2;
      } else {
        code = bytes[offset];
        offset += 1;
      }

      // NOTE The end codes give min and max exactly
      values[target + voxel] = code === maxCode ? max : min + code * step;
    }
  }

  return { indices, values };
}

// NOTE positions: Float32Array(count * 3), colors: Float32Array(count * 3) or null (0.0 to 1.0).
// High and low bytes are in separate planes. Deflate compresses the high bytes well.
export const encodeWVDBPoints = (positions, colors) => {
  const count = positions.length / 3;
  const size = 4 + 24 + 6 * count + (colors ? 3 * count : 0);
  const view = new DataView(new ArrayBuffer(size));
  const bytes = new Uint8Array(view.buffer);

  view.setUint32(0, count, true);

  for (let axis = 0; axis < 3; axis++) {
    let min = Infinity;
    let max = -Infinity;

    for (let point = 0; point < count; point++) {
      min = Math.min(min, positions[point * 3 + axis]);
      max = Math.max(max, positions[point * 3 + axis]);
    }

    min = count > 0 ? Math.fround(min) : 0.0;
    max = count > 0 ? Math.fround(max) : 0.0;

    view.setFloat32(4 + axis * 4, min, true);
    view.setFloat32(16 + axis * 4, max, true);

    const scale = min === max ? 0.0 : pointCodeMax / (max - min);
    const high = 28 + axis * 2 * count;
    const low = high + count;

    for (let point = 0; point < count; point++) {
      const code = Math.min(
        Math.max(Math.round((positions[point * 3 + axis] - min) * scale), 0),
        pointCodeMax
      );

      bytes[high + point] = code >>> 8;
      bytes[low + point] = code & 0xff;
    }
  }

  if (colors) {
    const start = 28 + 6 * count;

    for (let channel = 0; channel < 3; channel++) {
      for (let point = 0; point < count; point++) {
        const value = colors[point * 3 + channel];

        bytes[start + channel * count + point] = Math.round(
          Math.min(Math.max(Number.isFinite(value) ? value : 1.0, 0.0), 1.0) * 255.0
        );
      }
    }
  }

  return bytes;
};

// NOTE Workers run this function from its source text. It must not use names from outside the function.
// Returns positions and colors (or null) as Float32Array(count * 3).
export function decodeWVDBPoints(bytes, { colors: hasColors }) {
  const codeMax = 0xffff;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(0, true);
  const positions = new Float32Array(count * 3);
  const colors = hasColors ? new Float32Array(count * 3) : null;

  for (let axis = 0; axis < 3; axis++) {
    const min = view.getFloat32(4 + axis * 4, true);
    const max = view.getFloat32(16 + axis * 4, true);
    const step = (max - min) / codeMax;
    const high = 28 + axis * 2 * count;
    const low = high + count;

    for (let point = 0; point < count; point++) {
      const code = (bytes[high + point] << 8) | bytes[low + point];

      // NOTE The end codes give min and max exactly
      positions[point * 3 + axis] = code === codeMax ? max : min + code * step;
    }
  }

  if (colors) {
    const start = 28 + 6 * count;

    for (let channel = 0; channel < 3; channel++) {
      for (let point = 0; point < count; point++) {
        colors[point * 3 + channel] = bytes[start + channel * count + point] / 255.0;
      }
    }
  }

  return { positions, colors };
}

export const encodeWVDBMask = (indices, total) => {
  const words = new Uint32Array(Math.ceil(total / 32));

  indices.forEach((index) => {
    words[index >>> 5] |= 1 << (index & 31);
  });

  const view = new DataView(new ArrayBuffer(words.length * 4));
  words.forEach((word, index) => view.setUint32(index * 4, word, true));

  return new Uint8Array(view.buffer);
};

// NOTE Workers run this function from its source text. It must not use names from outside the function.
export function decodeWVDBMask(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const words = new Uint32Array(bytes.byteLength >>> 2);

  for (let i = 0; i < words.length; i++) {
    words[i] = view.getUint32(i * 4, true);
  }

  return words;
}

export const isWVDBBrickStored = (words, index) => (words[index >>> 5] & (1 << (index & 31))) !== 0;

// NOTE chunks: [{ bytes, entry }] in file order. Each entry is the header object of the chunk.
// It gets its offset and length here.
export const writeWVDBFile = (header, chunks) => {
  let offset = 0;

  chunks.forEach(({ bytes, entry }) => {
    entry.offset = offset;
    entry.length = bytes.length;
    offset += bytes.length;
  });

  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const file = new Uint8Array(wvdbPreambleSize + headerBytes.length + offset);
  const view = new DataView(file.buffer);

  file.set(new TextEncoder().encode(wvdbMagic), 0);
  view.setUint32(4, header.version, true);
  view.setUint32(8, headerBytes.length, true);
  file.set(headerBytes, wvdbPreambleSize);

  let position = wvdbPreambleSize + headerBytes.length;

  chunks.forEach(({ bytes }) => {
    file.set(bytes, position);
    position += bytes.length;
  });

  return file;
};

// NOTE Returns null until the bytes contain the full header
export const readWVDBHeader = (bytes) => {
  if (bytes.length < wvdbPreambleSize) {
    return null;
  }

  if (new TextDecoder().decode(bytes.subarray(0, 4)) !== wvdbMagic) {
    throw new Error('Not a WVDB file.');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = view.getUint32(4, true);

  if (version > wvdbVersion) {
    throw new Error(`WVDB version ${version} is not supported.`);
  }

  const dataStart = wvdbPreambleSize + view.getUint32(8, true);

  if (bytes.length < dataStart) {
    return null;
  }

  return {
    header: JSON.parse(new TextDecoder().decode(bytes.subarray(wvdbPreambleSize, dataStart))),
    dataStart,
  };
};

// NOTE Chunks of LOD 0 to maxLod in file order. firstPoint is the number of points of a grid before the chunk.
export const getWVDBChunks = (header, maxLod = Infinity) => {
  const chunks = [];

  header.grids.forEach((grid, gridIndex) => {
    let firstPoint = 0;

    grid.lods.forEach(({ mask, pages }, lod) => {
      if (lod > maxLod) {
        return;
      }

      if (grid.type === wvdbGridTypes.points) {
        pages.forEach(({ offset, length, points }) => {
          chunks.push({ gridIndex, lod, kind: 'points', offset, length, firstPoint });
          firstPoint += points;
        });

        return;
      }

      if (mask) {
        chunks.push({ gridIndex, lod, kind: 'mask', offset: mask.offset, length: mask.length });
      }

      let firstIndex = 0;

      pages.forEach(({ offset, length, bricks }) => {
        chunks.push({ gridIndex, lod, kind: 'page', offset, length, firstIndex });
        firstIndex += bricks;
      });
    });
  });

  return chunks.sort((a, b) => a.offset - b.offset);
};

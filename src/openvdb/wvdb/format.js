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

export const wvdbMagic = 'WVDB';
export const wvdbVersion = 1;

// NOTE Magic, version and header length
export const wvdbPreambleSize = 12;

export const brickLog2Dim = 3;
export const brickDim = 1 << brickLog2Dim;
export const brickVoxels = 1 << (3 * brickLog2Dim);

export const wvdbLayouts = {
  dense: 'dense',
  sparse: 'sparse',
};

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
  view.setUint32(4, wvdbVersion, true);
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

// NOTE Chunks of LOD 0 to maxLod in file order
export const getWVDBChunks = (header, maxLod = Infinity) => {
  const chunks = [];

  header.grids.forEach((grid, gridIndex) => {
    grid.lods.forEach(({ mask, pages }, lod) => {
      if (lod > maxLod) {
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

// NOTE Minimal ZIP reader (stored and deflate entries, ZIP64). It reads one entry at a time, so large files do not go into memory.
import { closeSync, fstatSync, openSync, readSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const endSignature = 0x06054b50;
const end64LocatorSignature = 0x07064b50;
const centralSignature = 0x02014b50;
const localSignature = 0x04034b50;
const zip64ExtraId = 0x0001;
const maxUint32 = 0xffffffff;

const readAt = (fd, position, length) => {
  const buffer = Buffer.alloc(length);
  readSync(fd, buffer, 0, length, position);

  return buffer;
};

const readUint64 = (buffer, offset) => Number(buffer.readBigUInt64LE(offset));

// NOTE The end record is in the last 64 KB plus 22 bytes (record size without comment)
const findEnd = (fd, size) => {
  const length = Math.min(size, 0xffff + 22);
  const start = size - length;
  const tail = readAt(fd, start, length);

  for (let offset = length - 22; offset >= 0; offset--) {
    if (tail.readUInt32LE(offset) === endSignature) {
      return { tail, offset, position: start + offset };
    }
  }

  throw new Error('Not a ZIP file.');
};

const readCentralDirectory = (fd, size) => {
  const { tail, offset, position } = findEnd(fd, size);

  let count = tail.readUInt16LE(offset + 10);
  let directorySize = tail.readUInt32LE(offset + 12);
  let directoryOffset = tail.readUInt32LE(offset + 16);

  if (count === 0xffff || directorySize === maxUint32 || directoryOffset === maxUint32) {
    const locator = readAt(fd, position - 20, 20);

    if (locator.readUInt32LE(0) !== end64LocatorSignature) {
      throw new Error('ZIP64 end record not found.');
    }

    const end64 = readAt(fd, readUint64(locator, 8), 56);

    count = readUint64(end64, 32);
    directorySize = readUint64(end64, 40);
    directoryOffset = readUint64(end64, 48);
  }

  return { count, directory: readAt(fd, directoryOffset, directorySize) };
};

// NOTE The ZIP64 extra field has only the values that are 0xffffffff in the main record, in this order
const readZip64Extra = (extra, values) => {
  let offset = 0;

  while (offset + 4 <= extra.length) {
    const id = extra.readUInt16LE(offset);
    const size = extra.readUInt16LE(offset + 2);

    if (id === zip64ExtraId) {
      let field = offset + 4;

      ['size', 'compressedSize', 'localOffset'].forEach((key) => {
        if (values[key] === maxUint32) {
          values[key] = readUint64(extra, field);
          field += 8;
        }
      });
    }

    offset += 4 + size;
  }

  return values;
};

// NOTE Returns { entries: [{ name, read() }], close() }. read() gives the entry bytes as a Buffer.
export const openZip = (path) => {
  const fd = openSync(path, 'r');
  const { count, directory } = readCentralDirectory(fd, fstatSync(fd).size);
  const entries = [];

  let offset = 0;

  for (let index = 0; index < count; index++) {
    if (directory.readUInt32LE(offset) !== centralSignature) {
      throw new Error('Broken ZIP central directory.');
    }

    const flags = directory.readUInt16LE(offset + 8);
    const method = directory.readUInt16LE(offset + 10);
    const nameLength = directory.readUInt16LE(offset + 28);
    const extraLength = directory.readUInt16LE(offset + 30);
    const commentLength = directory.readUInt16LE(offset + 32);
    const name = directory.toString('utf8', offset + 46, offset + 46 + nameLength);
    const extra = directory.subarray(offset + 46 + nameLength, offset + 46 + nameLength + extraLength);

    const { compressedSize, size, localOffset } = readZip64Extra(extra, {
      compressedSize: directory.readUInt32LE(offset + 20),
      size: directory.readUInt32LE(offset + 24),
      localOffset: directory.readUInt32LE(offset + 42),
    });

    entries.push({
      name,
      size,
      read: () => {
        if (flags & 0x1) {
          throw new Error(`${name}: encrypted ZIP entries are not supported.`);
        }

        const local = readAt(fd, localOffset, 30);

        if (local.readUInt32LE(0) !== localSignature) {
          throw new Error(`${name}: broken ZIP entry.`);
        }

        const dataOffset = localOffset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
        const data = readAt(fd, dataOffset, compressedSize);

        if (method === 0) {
          return data;
        }

        if (method === 8) {
          return inflateRawSync(data);
        }

        throw new Error(`${name}: ZIP compression method ${method} is not supported.`);
      },
    });

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return { entries, close: () => closeSync(fd) };
};

import { assert, unsupported } from "../debug";
import {
  charSize,
  uint32Size,
  uint64Size
} from '../math/memory';
import { BufferIterator } from "./BufferIterator";
import { Compression } from "./Compression";
import { GridDescriptor } from "./GridDescriptor";
import { Version } from "./Version";

export class VDBReader {
  libraryVersion;
  hasGridOffsets;
  uuid;
  metadata;

  prepare() {
    // TODO Pre-fill VDB structure without reading actual values
    BufferIterator.withBufferIterator(this, new BufferIterator(source));
  }

  read(source) {
    BufferIterator.withBufferIterator(this, new BufferIterator(source));

    this.validateVDBFile();

    this.readFileVersion();
    this.readHeader();
    this.readGrids();

    console.info(this);
  }

  validateVDBFile() {
    BufferIterator.assert(this);

    const magic = this.bufferIterator.readBytes(uint64Size);

    assert('VDB magic number', 0x56444220, magic);
  }

  readFileVersion() {
    BufferIterator.assert(this);
    
    Version.tagVersion(this, this.bufferIterator.readBytes(uint32Size));

    this.libraryVersion = {
      minor: -1,
      major: -1
    };

    if (this.version > 211) {
      this.libraryVersion.major = this.bufferIterator.readBytes(uint32Size);
      this.libraryVersion.minor = this.bufferIterator.readBytes(uint32Size);
    } else {
      this.libraryVersion.major = 0.0;
      this.libraryVersion.minor = 0.0;
    }
  }

  readHeader() {
    BufferIterator.assert(this);

    this.hasGridOffsets = this.bufferIterator.readBytes(charSize);

    let compression;

    if (this.version >= 220 && this.version < 222) {
      compression = this.bufferIterator.readBytes(charSize);
      compression = {
        none: compression & 0x0,
        zip: compression & 0x1,
        activeMask: compression & 0x2,
        blosc: compression & 0x4,
      };
    } else {
      compression = {
        none: false,
        zip: false,
        activeMask: true,
        blosc: false
      };
    }

    Compression.tagCompression(this, compression);

    let uuid = '';
    Array(36).fill(0).map((_) => uuid += String.fromCharCode(this.bufferIterator.readBytes(1)));

    this.uuid = uuid;

    const metadata = {};
    const metadataCount = this.bufferIterator.readBytes(uint32Size);
    Array(metadataCount).fill(0).forEach(() => {
      const name = this.bufferIterator.readNameString();
      const type = this.bufferIterator.readNameString();
      const value = this.bufferIterator.readNameString(type);

      metadata[name] = { type, value };
    });

    this.metadata = metadata;
  }

  readGrids() {
    BufferIterator.assert(this);

    let grids = {};

    this.grids = grids;

    if (!this.hasGridOffsets) {
      // TODO Handle case without grid offsets
      // File.cc:364
      unsupported('VDB without grid offsets');
    } else {
      const gridCount = this.bufferIterator.readBytes(uint32Size);

      Array(gridCount).fill(0).forEach(() => {
        const gridDescriptor = new GridDescriptor(this.bufferIterator);

        BufferIterator.withBufferIterator(gridDescriptor, this.bufferIterator);
        Version.tagVersion(gridDescriptor, Version.getVersion(this));
        Compression.tagCompression(gridDescriptor, Compression.getCompression(this));

        gridDescriptor.readGrid();

        this.grids[gridDescriptor.uniqueName] = gridDescriptor;
      });
    }
  }
}

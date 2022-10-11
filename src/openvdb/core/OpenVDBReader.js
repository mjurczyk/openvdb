import { assert, unsupported } from '../debug';
import { charSize, uint32Size, uint64Size } from '../math/memory';
import { BufferIterator } from './BufferIterator';
import { Compression } from './Compression';
import { GridDescriptor } from './GridDescriptor';
import { GridSharedContext } from './GridSharedContext';

export class OpenVDBReader {
  libraryVersion;
  hasGridOffsets;
  uuid;
  metadata;

  constructor() {
    GridSharedContext.tagContext(this, new GridSharedContext());
  }

  // TODO Pre-fill VDB structure without reading actual values
  async prepare() {
    await Compression.prepareModules();

    GridSharedContext.getContext(this).bufferIterator = new BufferIterator(source);
  }

  async read(source) {
    await Compression.prepareModules();
    GridSharedContext.getContext(this).bufferIterator = new BufferIterator(source);

    if (this.validateVDBFile()) {
      this.readFileVersion();
      this.readHeader();
      this.readGrids();
    } else {
      throw 'Not a VDB file.';
    }
  }

  validateVDBFile() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const magic = bufferIterator.readBytes(uint64Size);

    assert('VDB magic number', 0x56444220, magic);

    return 0x56444220 === magic;
  }

  readFileVersion() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const version = bufferIterator.readBytes(uint32Size);
    GridSharedContext.getContext(this).version = version;

    this.libraryVersion = {
      minor: -1,
      major: -1,
    };

    if (version > 211) {
      this.libraryVersion.major = bufferIterator.readBytes(uint32Size);
      this.libraryVersion.minor = bufferIterator.readBytes(uint32Size);
    } else {
      this.libraryVersion.major = 0.0;
      this.libraryVersion.minor = 0.0;
    }
  }

  readHeader() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);
    this.hasGridOffsets = bufferIterator.readBytes(charSize);

    let compression;

    if (version >= 220 && version < 222) {
      compression = bufferIterator.readBytes(charSize);
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
        blosc: false,
      };
    }

    GridSharedContext.getContext(this).compression = compression;

    let uuid = '';
    Array(36)
      .fill(0)
      .map((_) => (uuid += String.fromCharCode(bufferIterator.readBytes(1))));

    this.uuid = uuid;

    const metadata = {};
    const metadataCount = bufferIterator.readBytes(uint32Size);
    Array(metadataCount)
      .fill(0)
      .forEach(() => {
        const name = bufferIterator.readString();
        const type = bufferIterator.readString();
        const value = bufferIterator.readString(type);

        metadata[name] = { type, value };
      });

    this.metadata = metadata;
  }

  readGrids() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    let grids = {};

    this.grids = grids;

    if (!this.hasGridOffsets) {
      // TODO Handle case without grid offsets
      // File.cc:364
      unsupported('VDB without grid offsets');
    } else {
      const gridCount = bufferIterator.readBytes(uint32Size);

      Array(gridCount)
        .fill(0)
        .forEach(() => {
          const gridDescriptor = new GridDescriptor(bufferIterator);
          GridSharedContext.passContext(this, gridDescriptor);

          gridDescriptor.readGrid();

          GridSharedContext.cleanContext(gridDescriptor);

          this.grids[gridDescriptor.uniqueName] = gridDescriptor;
        });
    }
  }
}

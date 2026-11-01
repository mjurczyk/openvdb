import { assert, unsupported } from '../debug.js';
import { charSize, uint32Size, uint64Size } from '../math/memory.js';
import { BufferIterator } from './BufferIterator.js';
import { Compression, compressionFlags, parseCompressionFlags } from './Compression.js';
import { GridDescriptor } from './GridDescriptor.js';
import { GridSharedContext } from './GridSharedContext.js';

export class OpenVDBReader {
  libraryVersion;
  hasGridOffsets;
  uuid;
  metadata;

  constructor() {
    GridSharedContext.tagContext(this, new GridSharedContext());
  }

  // TODO Pre-fill VDB structure without reading actual values
  async prepare(source) {
    await Compression.prepareModules();

    GridSharedContext.getContext(this).bufferIterator = new BufferIterator(source);
  }

  // NOTE With metadataOnly, grids have metadata and transforms (for example the world box), but no tree.
  // With topologyOnly, grids also have the tree topology (active voxels, evalActiveVoxelBoundingBox), but no leaf values.
  // Grids of files without grid offsets (before version 2.16) are read in full.
  async read(source, { metadataOnly = false, topologyOnly = false } = {}) {
    await Compression.prepareModules();
    GridSharedContext.getContext(this).bufferIterator = new BufferIterator(source);
    GridSharedContext.getContext(this).metadataOnly = metadataOnly;
    GridSharedContext.getContext(this).topologyOnly = topologyOnly;

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

    if (version >= 211) {
      this.libraryVersion.major = bufferIterator.readBytes(uint32Size);
      this.libraryVersion.minor = bufferIterator.readBytes(uint32Size);
    } else {
      this.libraryVersion.major = 0.0;
      this.libraryVersion.minor = 0.0;
    }
  }

  readHeader() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);
    // NOTE Files before version 212 do not store this flag. They always have grid offsets.
    this.hasGridOffsets = version >= 212 ? bufferIterator.readBytes(charSize) !== 0 : true;
    GridSharedContext.getContext(this).hasGridOffsets = this.hasGridOffsets;

    // NOTE Files before version 220 always use zip. From version 222, each grid stores its flags.
    let compression = compressionFlags.zip | compressionFlags.activeMask;

    if (version >= 220 && version < 222) {
      // NOTE This byte is a boolean, not flags.
      compression =
        bufferIterator.readBytes(charSize) !== 0 ? compressionFlags.zip : compressionFlags.none;
    }

    GridSharedContext.getContext(this).compression = parseCompressionFlags(compression);

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

    this.grids = {};

    // NOTE Files without grid offsets have the same layout, but grid positions are 0
    const gridCount = bufferIterator.readBytes(uint32Size);

    for (let index = 0; index < gridCount; index++) {
      const gridDescriptor = new GridDescriptor(bufferIterator);
      GridSharedContext.passContext(this, gridDescriptor);

      gridDescriptor.readGrid();

      GridSharedContext.cleanContext(gridDescriptor);

      this.grids[gridDescriptor.uniqueName] = gridDescriptor;

      if (gridDescriptor.isSkipped && !this.hasGridOffsets) {
        // NOTE Without grid offsets, the end of a skipped grid is not known
        unsupported('Grids after a skipped grid in a VDB without grid offsets');
        break;
      }
    }

    this.connectInstances();
  }

  // NOTE Instance grids share the tree of the parent grid, same as Archive::connectInstances
  connectInstances() {
    Object.values(this.grids).forEach((grid) => {
      const parent = grid.isInstance() ? this.grids[grid.instanceParentName] : null;

      if (parent) {
        grid.root = parent.root;
        grid.leavesCount = parent.leavesCount;
      }
    });
  }
}

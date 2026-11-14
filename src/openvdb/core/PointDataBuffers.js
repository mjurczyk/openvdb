import { uint32Size, uint64Size } from '../math/memory.js';
import { BufferIterator } from './BufferIterator.js';
import { Compression } from './Compression.js';
import { GridSharedContext } from './GridSharedContext.js';

const uint16Size = 2;

const uncompressedVoxelBufferSize = 0xffff;

// NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/points/AttributeArray.h
const serializationFlags = {
  strided: 0x1,
  uniform: 0x2,
  paged: 0x8,
};

const descriptorHeaderFlags = {
  shared: 0x1,
  skipBytes: 0x2,
};

// NOTE Leaves in the order of RootNode.readBuffers
const collectLeaves = (node, leaves) => {
  if (node.isLeaf()) {
    leaves.push(node);
  } else if (node.isInternalNode()) {
    node.childMask.forEachOn(({ offset }) => collectLeaves(node.table[offset], leaves));
  }
};

// NOTE Point data leaves save buffers in passes. Leaves keep pointAttributes and compressed pointArrays for utils/points.js.
// NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/points/PointDataGrid.h
export class PointDataBuffers {
  readBuffers(root) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const leaves = [];
    root.table.forEach((node) => collectLeaves(node, leaves));

    // NOTE OpenVDB saves point data grids in passes also in files of version 223
    const passCount = bufferIterator.readBytes(uint16Size);
    const attributeCount = (passCount - 4) / 2;

    // NOTE Pass 0: voxel buffer sizes. The voxel pass reads the size again.
    bufferIterator.skip(leaves.length * uint16Size);

    // NOTE Pass 1: attribute descriptor and attribute array metadata
    let sharedDescriptor = null;

    const leafArrays = leaves.map((leaf) => {
      let descriptor = sharedDescriptor;

      if (!descriptor) {
        const header = bufferIterator.readBytes(1);
        descriptor = this.readDescriptor();

        if (header & descriptorHeaderFlags.shared) {
          sharedDescriptor = descriptor;
        }

        if (header & descriptorHeaderFlags.skipBytes) {
          bufferIterator.skip(bufferIterator.readBytes(uint64Size));
        }
      }

      leaf.pointAttributes = descriptor;
      leaf.pointArrays = descriptor.map(() => this.readArrayMetadata());

      return leaf.pointArrays;
    });

    // NOTE Passes 2 to n + 1: page headers of each attribute
    const pagedStreams = [];

    for (let attributeIndex = 0; attributeIndex < attributeCount; attributeIndex++) {
      pagedStreams.push(this.readPageHeaders(leafArrays.map((arrays) => arrays[attributeIndex])));
    }

    // NOTE Pass n + 2: voxel values
    leaves.forEach((leaf) => this.readVoxelValues(leaf));

    // NOTE Passes n + 3 to 2n + 2: attribute values
    for (let attributeIndex = 0; attributeIndex < attributeCount; attributeIndex++) {
      this.readAttributePages(
        leafArrays.map((arrays) => arrays[attributeIndex]),
        pagedStreams[attributeIndex]
      );
    }
  }

  // NOTE AttributeSet::Descriptor::read
  readDescriptor() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const attributeCount = bufferIterator.readBytes(uint64Size);
    const attributes = [];

    for (let index = 0; index < attributeCount; index++) {
      attributes.push({ type: bufferIterator.readString(), codec: bufferIterator.readString() });
    }

    // NOTE The name map is sorted by name. Its index is the position in the type list.
    for (let entry = 0; entry < attributeCount; entry++) {
      const name = bufferIterator.readString();
      const index = bufferIterator.readBytes(uint64Size);

      attributes[index].name = name;
      attributes[index].index = index;
    }

    const groupCount = bufferIterator.readBytes(uint64Size);

    for (let index = 0; index < groupCount; index++) {
      bufferIterator.readString();
      bufferIterator.skip(uint64Size);
    }

    const metadataCount = bufferIterator.readBytes(uint32Size);

    for (let index = 0; index < metadataCount; index++) {
      bufferIterator.readString();
      bufferIterator.readString();
      bufferIterator.skip(bufferIterator.readBytes(uint32Size));
    }

    return attributes;
  }

  // NOTE TypedAttributeArray::readMetadata
  readArrayMetadata() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    // NOTE Byte count includes the flags byte, the serialization flags byte and the size
    const byteCount = bufferIterator.readBytes(uint64Size) - 2 - uint32Size;

    // NOTE Skip the flags. Serialization flags set the layout.
    bufferIterator.skip(1);
    const serialization = bufferIterator.readBytes(1);

    // NOTE Skip the point count
    bufferIterator.skip(uint32Size);

    if (serialization & serializationFlags.strided) {
      bufferIterator.skip(uint32Size);
    }

    return {
      byteCount,
      isUniform: (serialization & serializationFlags.uniform) !== 0,
      isPaged: (serialization & serializationFlags.paged) !== 0,
    };
  }

  // NOTE PagedInputStream::createHandle. A page starts when the previous page has no bytes left.
  readPageHeaders(arrays) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const pagedStream = { pages: [], byteIndex: 0, uncompressedBytes: 0 };

    arrays.forEach((array) => {
      if (!array?.isPaged) {
        return;
      }

      if (pagedStream.byteIndex === pagedStream.uncompressedBytes) {
        // NOTE Uncompressed pages save a negative size
        const compressedBytes = bufferIterator.readInt32();
        const uncompressedBytes =
          compressedBytes > 0 ? bufferIterator.readInt32() : -compressedBytes;

        pagedStream.pages.push({ compressedBytes, uncompressedBytes });
        pagedStream.uncompressedBytes = uncompressedBytes;
        pagedStream.byteIndex = 0;
      }

      // NOTE An array never spans two pages (PagedOutputStream::write)
      array.page = pagedStream.pages[pagedStream.pages.length - 1];
      array.pageOffset = pagedStream.byteIndex;
      pagedStream.byteIndex += array.byteCount;
    });

    return pagedStream;
  }

  // NOTE LeafNode::readBuffers with the PointDataIndex32 readCompressedValues
  readVoxelValues(leaf) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    // NOTE Value mask is a copy of the mask read in readTopology
    bufferIterator.skip(leaf.valueMask.size >> 3);

    const byteCount = leaf.numValues * uint32Size;
    const compressedByteCount = bufferIterator.readBytes(uint16Size);

    const bytes =
      compressedByteCount === uncompressedVoxelBufferSize
        ? bufferIterator.readRawBytes(byteCount)
        : Compression.blosc.decode(bufferIterator.readRawBytes(compressedByteCount));

    const dataIterator = new BufferIterator(bytes);
    leaf.values = new Uint32Array(leaf.numValues);

    for (let index = 0; index < leaf.numValues; index++) {
      leaf.values[index] = dataIterator.readUint32();
    }
  }

  // NOTE TypedAttributeArray::readPagedBuffers and PagedInputStream::read.
  // Pages keep a view of the source bytes. Arrays that are not paged are skipped.
  readAttributePages(arrays, pagedStream) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    arrays.forEach((array) => {
      if (!array) {
        return;
      }

      if (!array.isPaged) {
        // NOTE Arrays that are not uniform save a blosc flag byte
        bufferIterator.skip((array.isUniform ? 0 : 1) + array.byteCount);
        return;
      }

      if (pagedStream.byteIndex === pagedStream.uncompressedBytes) {
        pagedStream.uncompressedBytes = array.page.uncompressedBytes;
        array.page.bytes = bufferIterator.readRawView(Math.abs(array.page.compressedBytes));
        pagedStream.byteIndex = 0;
      }

      pagedStream.byteIndex += array.byteCount;
    });
  }
}

import { assert, unsupported } from "../debug";
import { BufferIterator } from "./BufferIterator";
import { Compression } from "./Compression";
import { Version } from "./Version";
import {
  floatType,
  int64Type,
  uint32Size,
} from '../math/memory';
import {
  Vector3
} from '../math/vector';
import { GridTransform } from "./GridTransform";
import { RootNode } from "./RootNode";
import { GridUtils } from "./GridUtils";

export class GridDescriptor {
  static halfFloatGridPrefix = '_HalfFloat';

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;
  
  readGrid() {
    BufferIterator.assert(this);

    this.readGridHeader();
    assert('Grid buffer position', this.gridBufferPosition, this.bufferIterator.offset);

    this.readCompression();
    this.readMetadata();
    this.readGridTransform();
    this.readTopology();
  }

  readGridHeader() {
    this.uniqueName = this.bufferIterator.readNameString();
    this.gridName = this.uniqueName.split('\x1e')[0];
    this.gridType = this.bufferIterator.readNameString();

    if (this.gridType.indexOf(GridDescriptor.halfFloatGridPrefix) !== -1) {
      this.saveAsHalfFloat = true;
      this.gridType = this.gridType.split(GridDescriptor.halfFloatGridPrefix).join('');
    }

    if (Version.greaterEq(this, 216)) {
      this.instanceParentName = this.bufferIterator.readNameString();
    }

    // NOTE Buffer offset at which grid description ends
    this.gridBufferPosition = this.bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which grid blocks end
    this.blockBufferPosition = this.bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which the file ends
    this.endBufferPosition = this.bufferIterator.readFloat(int64Type);
  }

  readCompression() {
    if (Version.greaterEq(this, 222)) {
      let compression = this.bufferIterator.readBytes(uint32Size);
      compression = {
        none: compression & 0x0,
        zip: compression & 0x1,
        activeMask: compression & 0x2,
        blosc: compression & 0x4,
      };

      Compression.tagCompression(this, compression);
    } else {
      // NOTE Use inherited compression instead
    }
  }

  readMetadata() {
    this.metadata = {
      count: this.bufferIterator.readBytes(uint32Size)
    };
  
    Array(this.metadata.count).fill(0).forEach(() => {
      const name = this.bufferIterator.readNameString();
      const type = this.bufferIterator.readNameString();
      const value = this.bufferIterator.readNameString(type);
  
      this.metadata[name] = { type, value };
    });

    if (Version.less(this, 219)) {
      this.metadata.name = this.gridName;
    }
  }

  getGridValueType() {
    const value = Object.entries(this.metadata).find(([ id ]) => id === 'value_type');

    return (value ? value[1].value : undefined) || floatType;
  }

  readGridTransform() {
    if (Version.less(this, 216)) {
      // NOTE Implement this conditional
      unsupported('GridDescriptor::getGridTransform pre-216 transform skipped.');
      return;
    }

    this.transform = new GridTransform();
    BufferIterator.withBufferIterator(this.transform, BufferIterator.getBufferIterator(this));
    Version.tagVersion(this.transform, Version.getVersion(this));

    this.transform.readTransform();
  }

  readTopology() {
    const topologyBufferCount = this.bufferIterator.readBytes(uint32Size);

    if (topologyBufferCount !== 1) {
      // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/tree/Tree.h#L1120
      unsupported('Multi-buffer trees');
      return;
    }

    this.root = new RootNode();
    BufferIterator.withBufferIterator(this.root, BufferIterator.getBufferIterator(this));
    GridUtils.tagValueType(this.root, this.getGridValueType(), this.saveAsHalfFloat);
    Compression.tagCompression(this.root, Compression.getCompression(this));
    Version.tagVersion(this.root, Version.getVersion(this));

    this.root.readNode();
    this.leavesCount = this.root.leavesCount;

    assert('Block buffer', this.blockBufferPosition, this.bufferIterator.offset);
  }
}

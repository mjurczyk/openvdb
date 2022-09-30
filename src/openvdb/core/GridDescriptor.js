import { assert, unsupported } from "../debug";
import { Version } from "./Version";
import {
  floatType,
  int64Type,
  uint32Size,
} from '../math/memory';
import { GridTransform } from "./GridTransform";
import { RootNode } from "./RootNode";
import { GridSharedContext } from "./GridSharedContext";

export class GridDescriptor {
  static halfFloatGridPrefix = '_HalfFloat';

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;
  
  readGrid() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    this.readGridHeader();
    assert('Grid buffer position', this.gridBufferPosition, bufferIterator.offset);

    this.readCompression();
    this.readMetadata();
    this.readGridTransform();
    this.readTopology();
  }

  readGridHeader() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    this.uniqueName = bufferIterator.readString();
    this.gridName = this.uniqueName.split('\x1e')[0];
    this.gridType = bufferIterator.readString();

    if (this.gridType.indexOf(GridDescriptor.halfFloatGridPrefix) !== -1) {
      this.saveAsHalfFloat = true;
      this.gridType = this.gridType.split(GridDescriptor.halfFloatGridPrefix).join('');
    }

    if (Version.greaterEq(version, 216)) {
      this.instanceParentName = bufferIterator.readString();
    }

    // NOTE Buffer offset at which grid description ends
    this.gridBufferPosition = bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which grid blocks end
    this.blockBufferPosition = bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which the file ends
    this.endBufferPosition = bufferIterator.readFloat(int64Type);
  }

  readCompression() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    if (Version.greaterEq(version, 222)) {
      let compression = bufferIterator.readBytes(uint32Size);
      compression = {
        none: compression & 0x0,
        zip: compression & 0x1,
        activeMask: compression & 0x2,
        blosc: compression & 0x4,
      };

      GridSharedContext.getContext(this).compression = compression;
    } else {
      // NOTE Use inherited compression instead
    }
  }

  readMetadata() {
    const { bufferIterator, version} = GridSharedContext.getContext(this);

    this.metadata = {
      count: bufferIterator.readBytes(uint32Size)
    };
  
    Array(this.metadata.count).fill(0).forEach(() => {
      const name = bufferIterator.readString();
      const type = bufferIterator.readString();
      const value = bufferIterator.readString(type);
  
      this.metadata[name] = { type, value };
    });

    if (Version.less(version, 219)) {
      this.metadata.name = this.gridName;
    }
  }

  getGridValueType() {
    const value = Object.entries(this.metadata).find(([ id ]) => id === 'value_type');

    return (value ? value[1].value : undefined) || floatType;
  }

  readGridTransform() {
    const { version } = GridSharedContext.getContext(this);

    if (Version.less(version, 216)) {
      // NOTE Implement this conditional
      unsupported('GridDescriptor::getGridTransform pre-216 transform skipped.');
      return;
    }

    this.transform = new GridTransform();
    GridSharedContext.passContext(this, this.transform);

    this.transform.readTransform();
  }

  readTopology() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    GridSharedContext.getContext(this).useHalf = this.saveAsHalfFloat;
    GridSharedContext.getContext(this).valueType = this.getGridValueType();

    const topologyBufferCount = bufferIterator.readBytes(uint32Size);

    if (topologyBufferCount !== 1) {
      // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/tree/Tree.h#L1120
      unsupported('Multi-buffer trees');
      return;
    }

    this.root = new RootNode();
    GridSharedContext.passContext(this, this.root);

    this.root.readNode();
    this.leavesCount = this.root.leavesCount;

    assert('Block buffer', this.blockBufferPosition, bufferIterator.offset);
  }
}

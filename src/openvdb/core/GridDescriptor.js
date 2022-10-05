import { assert, unsupported } from "../debug";
import { Version } from "./Version";
import {
  floatType,
  int64Type,
  uint32Size,
} from '../math/memory';
import { gridClassLevelSet } from '../math/metadata';
import { GridTransform } from "./GridTransform";
import { RootNode } from "./RootNode";
import { GridSharedContext } from "./GridSharedContext";
import { log2dimMap, totalMap } from "./ChildNode";
import { Accessor } from "./Accessor";

export class GridDescriptor {
  static halfFloatGridPrefix = '_HalfFloat';

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;
  
  readGrid() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    this.readGridHeader();
    assert('Grid buffer position', this.gridBufferPosition, bufferIterator.offset);

    if (this.gridBufferPosition !== bufferIterator.offset) {
      bufferIterator.offset = this.gridBufferPosition;
    }

    this.readCompression();
    this.readMetadata();

    if (Version.less(version, 216)) {
      this.readTopology();
      this.readGridTransform();
      this.readBuffers();
    } else {
      this.readGridTransform();
      this.readTopology();
      this.readBuffers();
    }

    
    // NOTE Hack to make multi-grid VDBs work without reading leaf values
    bufferIterator.offset = this.endBufferPosition;
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

  getGridClass() {
    const value = Object.entries(this.metadata).find(([ id ]) => id === 'class');

    return (value ? value[1].value : undefined) || gridClassLevelSet;
  }

  readGridTransform() {
    this.transform = new GridTransform();
    GridSharedContext.passContext(this, this.transform);

    this.transform.readTransform();

    GridSharedContext.cleanContext(this.transform);
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

    GridSharedContext.cleanContext(this.root);

    assert('Block buffer', this.blockBufferPosition, bufferIterator.offset);
  }

  readBuffers() {
    // TODO
  }

  getWorldBbox(child) {
    const localBbox = (child || this).getLocalBbox();

    return localBbox.map(vector => vector.clone()).map(this.transform.applyTransformMap);
  }

  getLocalBbox() {
    const maxLog2Dim = 1 << (log2dimMap[0] + totalMap.reduce((total, next) => total + next));

    return [
      this.metadata.file_bbox_min.value.subScalar(maxLog2Dim - 1),
      this.metadata.file_bbox_max.value.addScalar(maxLog2Dim - 1),
    ];
  }

  getPreciseWorldBbox() {
    return [
      this.transform.applyTransformMap(this.metadata.file_bbox_min.value.clone()),
      this.transform.applyTransformMap(this.metadata.file_bbox_max.value.clone()),
    ];
  }

  valueCache = {};
  accessor = new Accessor(this);

  getValue(position) {
    return this.accessor.getValue(position);
  }
}

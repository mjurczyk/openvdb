import { assert, debugLog, unsupported } from '../debug';
import { Version } from './Version';
import {
  floatType,
  int64Type,
  pointDataIndex32,
  uint32Size,
  valueTypeSizeMap,
} from '../math/memory';
import { GridTransform } from './GridTransform';
import { RootNode } from './RootNode';
import { GridSharedContext } from './GridSharedContext';
import { Accessor } from './Accessor';
import { parseCompressionFlags } from './Compression';
import { Vector3 } from '../math/vector';
import { TreeLayout } from './TreeLayout';
import { PointDataBuffers } from './PointDataBuffers';

export class GridDescriptor {
  static halfFloatGridPrefix = '_HalfFloat';

  saveAsHalfFloat = false;
  leavesCount = 0;
  isSkipped = false;

  uniqueName;
  gridName;
  gridType;

  readGrid() {
    const { bufferIterator, version, hasGridOffsets, metadataOnly } =
      GridSharedContext.getContext(this);

    this.readGridHeader();

    // NOTE Without grid offsets, the grid starts right after the header
    if (hasGridOffsets) {
      assert('Grid buffer position', this.gridBufferPosition, bufferIterator.offset);

      if (this.gridBufferPosition !== bufferIterator.offset) {
        bufferIterator.offset = this.gridBufferPosition;
      }
    }

    this.readCompression();
    this.readMetadata();

    if (!valueTypeSizeMap[this.getGridValueType()]) {
      // NOTE For example vec2, string and 64-bit point data grids
      this.skipGrid(`Trees of ${this.getGridValueType()} grids`);
      return;
    }

    if (Version.less(version, 216)) {
      this.readTopology();
      this.readGridTransform();
      this.readBuffers();
    } else {
      this.readGridTransform();

      // NOTE Instance grids save no tree. OpenVDBReader.connectInstances adds the parent tree.
      if (this.isInstance()) {
        return;
      }

      if (metadataOnly && hasGridOffsets) {
        bufferIterator.offset = this.endBufferPosition;
        return;
      }

      this.readTopology();
      this.readBuffers();
    }
  }

  // NOTE Without grid offsets, the reader cannot find the end of the grid
  skipGrid(description) {
    const { bufferIterator, hasGridOffsets } = GridSharedContext.getContext(this);

    unsupported(description);
    this.isSkipped = true;

    if (hasGridOffsets) {
      bufferIterator.offset = this.endBufferPosition;
    }
  }

  isInstance() {
    return Boolean(this.instanceParentName);
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

    this.treeLayout = TreeLayout.fromGridType(this.gridType);

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
      GridSharedContext.getContext(this).compression = parseCompressionFlags(
        bufferIterator.readBytes(uint32Size)
      );
    } else {
      // NOTE Use inherited compression instead
    }
  }

  readMetadata() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    this.metadata = {
      count: bufferIterator.readBytes(uint32Size),
    };

    Array(this.metadata.count)
      .fill(0)
      .forEach(() => {
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
    // NOTE Grid type has the form Tree_<value type>_<log2 dims>. OpenVDB does not write value_type metadata.
    const [, treeValueType] = this.gridType.match(/^Tree_(.+?)(_\d+)+$/) || [];
    const value = Object.entries(this.metadata).find(([id]) => id === 'value_type');

    return treeValueType || (value ? value[1].value : undefined) || floatType;
  }

  getGridClass() {
    const value = Object.entries(this.metadata).find(([id]) => id === 'class');

    return (value ? value[1].value : undefined) || 'level set';
  }

  readGridTransform() {
    this.transform = new GridTransform();
    GridSharedContext.passContext(this, this.transform);

    this.transform.readTransform();

    GridSharedContext.cleanContext(this.transform);
  }

  readTopology() {
    const { bufferIterator, hasGridOffsets } = GridSharedContext.getContext(this);

    GridSharedContext.getContext(this).useHalf = this.saveAsHalfFloat;
    GridSharedContext.getContext(this).valueType = this.getGridValueType();
    GridSharedContext.getContext(this).treeLayout = this.treeLayout;

    // NOTE Old trees can have more buffers. Leaves save their own buffer count, see ChildNode.readBuffers.
    const topologyBufferCount = bufferIterator.readBytes(uint32Size);

    if (topologyBufferCount !== 1) {
      debugLog('Multi-buffer tree, auxiliary leaf buffers are not used', topologyBufferCount);
    }

    this.root = new RootNode();
    GridSharedContext.passContext(this, this.root);

    this.root.readNode();
    this.leavesCount = this.root.leavesCount;

    GridSharedContext.cleanContext(this.root);

    if (hasGridOffsets) {
      assert('Block buffer', this.blockBufferPosition, bufferIterator.offset);
    }
  }

  readBuffers() {
    const { bufferIterator, version, hasGridOffsets } = GridSharedContext.getContext(this);

    if (!this.root || Version.less(version, 214)) {
      // NOTE Files before 214 have no child nodes
      this.skipGrid('Leaf buffers');
      return;
    }

    if (this.getGridValueType() === pointDataIndex32) {
      const pointDataBuffers = new PointDataBuffers();
      GridSharedContext.passContext(this, pointDataBuffers);
      pointDataBuffers.readBuffers(this.root);
      GridSharedContext.cleanContext(pointDataBuffers);
    } else {
      GridSharedContext.passContext(this, this.root);
      this.root.readBuffers();
      GridSharedContext.cleanContext(this.root);
    }

    if (hasGridOffsets) {
      assert('End buffer', this.endBufferPosition, bufferIterator.offset);
    }
  }

  getWorldBbox(child) {
    return this.transform.applyTransformMapToBbox((child || this).getLocalBbox());
  }

  getLocalBbox() {
    const { rootChildDim } = this.treeLayout;

    return [
      this.metadata.file_bbox_min.value.subScalar(rootChildDim - 1),
      this.metadata.file_bbox_max.value.addScalar(rootChildDim - 1),
    ];
  }

  getPreciseWorldBbox() {
    return this.transform.applyTransformMapToBbox([
      this.metadata.file_bbox_min.value,
      this.metadata.file_bbox_max.value,
    ]);
  }

  valueCache = {};
  accessor = new Accessor(this);

  // NOTE Scratch vector for lookups. Nodes do not keep the position after a call.
  roundedPosition = new Vector3();

  getValue(position) {
    return this.accessor.getValue(this.roundedPosition.copy(position).round());
  }

  isActive(position) {
    return this.accessor.isActive(this.roundedPosition.copy(position).round());
  }

  // NOTE Level sets store signed distance values, not density
  isLevelSet() {
    return this.metadata?.class?.value === 'level set';
  }

  getLeafAt(position) {
    return this.accessor.getLeafAt(this.roundedPosition.copy(position).round());
  }
}

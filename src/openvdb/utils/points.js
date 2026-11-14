import { Compression } from '../core/Compression.js';
import { Vector3 } from '../math/vector.js';

// NOTE vec3s codecs of OpenVDB AttributeArray.h. Fixed point divides by the integer max. Position range adds -0.5.
const vec3Codecs = {
  null: { bytes: 4, read: (view, offset) => view.getFloat32(offset, true), shift: 0.0 },
  trnc: { bytes: 2, read: (view, offset) => readFloat16(view.getUint16(offset, true)), shift: 0.0 },
  fxpt8: { bytes: 1, read: (view, offset) => view.getUint8(offset) / 255.0, shift: -0.5 },
  fxpt16: { bytes: 2, read: (view, offset) => view.getUint16(offset, true) / 65535.0, shift: -0.5 },
  ufxpt8: { bytes: 1, read: (view, offset) => view.getUint8(offset) / 255.0, shift: 0.0 },
  ufxpt16: { bytes: 2, read: (view, offset) => view.getUint16(offset, true) / 65535.0, shift: 0.0 },
};

// NOTE IEEE 754 binary16, same as BufferIterator.readFloat16
const readFloat16 = (bits) => {
  const sign = bits & 0x8000 ? -1 : 1;
  const exponent = (bits >> 10) & 0x1f;
  const fraction = bits & 0x3ff;

  if (exponent === 0) {
    return sign * 2 ** -14 * (fraction / 1024);
  }

  if (exponent === 0x1f) {
    return fraction ? NaN : sign * Infinity;
  }

  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
};

// NOTE Leaves with their index origin (sum of the node origins), in tree order
const collectPointLeaves = (node, origin, leaves) => {
  if (node.isLeaf?.()) {
    if (node.values && node.pointArrays) {
      leaves.push({ leaf: node, origin });
    }
  } else if (node.isInternalNode?.()) {
    node.childMask.forEachOn(({ offset }) => {
      const child = node.table[offset];

      collectPointLeaves(child, origin.clone().add(child.origin), leaves);
    });
  }
};

const getPointLeaves = (grid) => {
  const leaves = [];

  grid.root?.table.forEach((node) => collectPointLeaves(node, node.origin.clone(), leaves));

  return leaves;
};

// NOTE Leaf values are the end offsets of the points of each voxel
const getLeafPointCount = (leaf) => leaf.values[leaf.values.length - 1];

// NOTE Decoded bytes of the page of an array. The last page is cached, because pages hold many leaves.
const createPageReader = () => {
  let lastPage = null;
  let lastView = null;

  return (page) => {
    if (page !== lastPage) {
      const bytes =
        page.compressedBytes > 0 ? Compression.blosc.decode(page.bytes) : page.bytes;

      lastPage = page;
      lastView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }

    return lastView;
  };
};

const findAttribute = (leaf, name) => {
  const index = leaf.pointAttributes.findIndex((attribute) => attribute.name === name);
  const attribute = leaf.pointAttributes[index];
  const array = leaf.pointArrays[index];

  if (!attribute || attribute.type !== 'vec3s' || !vec3Codecs[attribute.codec] || !array?.page) {
    return null;
  }

  return { codec: vec3Codecs[attribute.codec], array };
};

// NOTE Point data grids (ptdataidx32) only
export const getPointCount = (grid) =>
  getPointLeaves(grid).reduce((sum, { leaf }) => sum + getLeafPointCount(leaf), 0);

// NOTE World positions (P) and colors (Cd or null). Above maxPoints, every stride-th point is used.
// The arrays are full when the task generator is done.
export const createPointData = (grid, { maxPoints = Infinity } = {}) => {
  const leaves = getPointLeaves(grid);
  const totalCount = leaves.reduce((sum, { leaf }) => sum + getLeafPointCount(leaf), 0);
  const stride = Math.max(1, Math.ceil(totalCount / maxPoints));
  const count = totalCount > 0 ? Math.floor((totalCount - 1) / stride) + 1 : 0;
  const hasColors = leaves.some(({ leaf }) => findAttribute(leaf, 'Cd'));

  const positions = new Float32Array(count * 3);
  const colors = hasColors ? new Float32Array(count * 3).fill(1.0) : null;

  // NOTE Length of one voxel side in world units
  const origin = grid.transform.applyTransformMap(new Vector3(0.0, 0.0, 0.0));
  const voxelSize = Math.cbrt(
    ['x', 'y', 'z'].reduce((volume, axis) => {
      const step = new Vector3(0.0, 0.0, 0.0);
      step[axis] = 1.0;

      return volume * grid.transform.applyTransformMap(step).sub(origin).length();
    }, 1.0)
  );

  let activeVoxels = 0;

  leaves.forEach(({ leaf }) => {
    let start = 0;

    leaf.values.forEach((end) => {
      activeVoxels += end > start ? 1 : 0;
      start = end;
    });
  });

  // NOTE Mean distance of the points in world units
  const pointsPerVoxel = activeVoxels > 0 ? totalCount / activeVoxels : 1.0;
  const spacing = (voxelSize / Math.cbrt(pointsPerVoxel)) * Math.cbrt(stride);

  function* task() {
    const readPositionPage = createPageReader();
    const readColorPage = createPageReader();
    const index = new Vector3();

    let leafStart = 0;
    let target = 0;

    for (const { leaf, origin: leafOrigin } of leaves) {
      const leafCount = getLeafPointCount(leaf);
      const position = findAttribute(leaf, 'P');
      const color = findAttribute(leaf, 'Cd');
      const positionView = position && readPositionPage(position.array.page);
      const colorView = color && readColorPage(color.array.page);
      const log2dim = leaf.log2dim;
      const dimMask = (1 << log2dim) - 1;

      // NOTE First point of this leaf that is a multiple of stride
      let point = (stride - (leafStart % stride)) % stride;
      let voxel = 0;

      for (; point < leafCount; point += stride) {
        while (leaf.values[voxel] <= point) {
          voxel++;
        }

        index.set(
          leafOrigin.x + (voxel >> (2 * log2dim)),
          leafOrigin.y + ((voxel >> log2dim) & dimMask),
          leafOrigin.z + (voxel & dimMask)
        );

        // NOTE P is the offset from the voxel center in index space. Uniform arrays have one value.
        if (positionView) {
          const { codec, array } = position;
          const offset = array.pageOffset + (array.isUniform ? 0 : point) * codec.bytes * 3;

          index.x += codec.read(positionView, offset) + codec.shift;
          index.y += codec.read(positionView, offset + codec.bytes) + codec.shift;
          index.z += codec.read(positionView, offset + codec.bytes * 2) + codec.shift;
        }

        grid.transform.applyTransformMap(index);
        positions[target * 3] = index.x;
        positions[target * 3 + 1] = index.y;
        positions[target * 3 + 2] = index.z;

        if (colorView) {
          const { codec, array } = color;
          const offset = array.pageOffset + (array.isUniform ? 0 : point) * codec.bytes * 3;

          colors[target * 3] = codec.read(colorView, offset) + codec.shift;
          colors[target * 3 + 1] = codec.read(colorView, offset + codec.bytes) + codec.shift;
          colors[target * 3 + 2] = codec.read(colorView, offset + codec.bytes * 2) + codec.shift;
        }

        target++;
      }

      leafStart += leafCount;

      yield target;
    }

    return target;
  }

  return { count, totalCount, stride, spacing, positions, colors, task: task() };
};

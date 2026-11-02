// NOTE Minimal BVH for MeshVolume. Only MeshVolume imports it.
// Triangles are 9 floats each, in one non-indexed position array.

const maxLeafTriangles = 8;
const maxDepth = 64;

export class MeshVolumeBVH {
  constructor(positions) {
    const triangleCount = positions.length / 9;

    this.positions = positions;
    this.order = new Uint32Array(triangleCount);
    this.centroids = new Float32Array(triangleCount * 3);

    // NOTE A tree with N triangles has fewer than 2N nodes. Node data: right child, or leaf start and count.
    this.bounds = new Float32Array(Math.max(1, triangleCount * 2) * 6);
    this.nodes = new Uint32Array(Math.max(1, triangleCount * 2) * 3);
    this.nodeCount = 0;
    this.stack = new Uint32Array(maxDepth);

    for (let i = 0; i < triangleCount; i++) {
      this.order[i] = i;

      for (let axis = 0; axis < 3; axis++) {
        this.centroids[i * 3 + axis] =
          (positions[i * 9 + axis] + positions[i * 9 + 3 + axis] + positions[i * 9 + 6 + axis]) / 3.0;
      }
    }

    if (triangleCount > 0) {
      this.buildNode(0, triangleCount, 0);
    }
  }

  // NOTE Depth-first layout: the left child is the next node
  buildNode(start, count, depth) {
    const { positions, order, centroids, bounds, nodes } = this;
    const node = this.nodeCount++;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let centerMinX = Infinity, centerMinY = Infinity, centerMinZ = Infinity;
    let centerMaxX = -Infinity, centerMaxY = -Infinity, centerMaxZ = -Infinity;

    for (let i = start; i < start + count; i++) {
      const triangle = order[i];

      for (let vertex = 0; vertex < 9; vertex += 3) {
        const x = positions[triangle * 9 + vertex];
        const y = positions[triangle * 9 + vertex + 1];
        const z = positions[triangle * 9 + vertex + 2];

        minX = Math.min(minX, x); minY = Math.min(minY, y); minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); maxZ = Math.max(maxZ, z);
      }

      const cx = centroids[triangle * 3];
      const cy = centroids[triangle * 3 + 1];
      const cz = centroids[triangle * 3 + 2];

      centerMinX = Math.min(centerMinX, cx); centerMinY = Math.min(centerMinY, cy); centerMinZ = Math.min(centerMinZ, cz);
      centerMaxX = Math.max(centerMaxX, cx); centerMaxY = Math.max(centerMaxY, cy); centerMaxZ = Math.max(centerMaxZ, cz);
    }

    bounds.set([minX, minY, minZ, maxX, maxY, maxZ], node * 6);

    if (count <= maxLeafTriangles || depth >= maxDepth - 2) {
      nodes[node * 3] = 0;
      nodes[node * 3 + 1] = start;
      nodes[node * 3 + 2] = count;

      return node;
    }

    // NOTE Split at the middle of the longest centroid axis. If one side is empty, split at the middle index.
    const spanX = centerMaxX - centerMinX;
    const spanY = centerMaxY - centerMinY;
    const spanZ = centerMaxZ - centerMinZ;
    const axis = spanX >= spanY && spanX >= spanZ ? 0 : spanY >= spanZ ? 1 : 2;
    const split = [centerMinX + spanX / 2.0, centerMinY + spanY / 2.0, centerMinZ + spanZ / 2.0][axis];

    let middle = start;

    for (let i = start; i < start + count; i++) {
      if (centroids[order[i] * 3 + axis] < split) {
        const swap = order[i];
        order[i] = order[middle];
        order[middle] = swap;
        middle++;
      }
    }

    if (middle === start || middle === start + count) {
      middle = start + Math.floor(count / 2);
    }

    this.buildNode(start, middle - start, depth + 1);

    const right = this.buildNode(middle, start + count - middle, depth + 1);

    nodes[node * 3] = right;
    nodes[node * 3 + 1] = 0;
    nodes[node * 3 + 2] = 0;

    return node;
  }

  // NOTE Pushes the distance of each hit (both triangle sides, distance >= 0) to target
  raycast(origin, direction, target) {
    target.length = 0;

    if (this.nodeCount === 0) {
      return target;
    }

    const { positions, order, bounds, nodes, stack } = this;
    const ox = origin.x, oy = origin.y, oz = origin.z;
    const dx = direction.x, dy = direction.y, dz = direction.z;
    const invX = 1.0 / dx, invY = 1.0 / dy, invZ = 1.0 / dz;

    let stackSize = 0;
    stack[stackSize++] = 0;

    while (stackSize > 0) {
      const node = stack[--stackSize];
      const b = node * 6;

      // NOTE Slab test of the node box
      let t0 = (bounds[b] - ox) * invX, t1 = (bounds[b + 3] - ox) * invX;
      let near = Math.min(t0, t1), far = Math.max(t0, t1);

      t0 = (bounds[b + 1] - oy) * invY; t1 = (bounds[b + 4] - oy) * invY;
      near = Math.max(near, Math.min(t0, t1)); far = Math.min(far, Math.max(t0, t1));

      t0 = (bounds[b + 2] - oz) * invZ; t1 = (bounds[b + 5] - oz) * invZ;
      near = Math.max(near, Math.min(t0, t1)); far = Math.min(far, Math.max(t0, t1));

      if (far < 0.0 || near > far) {
        continue;
      }

      const count = nodes[node * 3 + 2];

      if (count === 0) {
        stack[stackSize++] = nodes[node * 3];
        stack[stackSize++] = node + 1;

        continue;
      }

      const start = nodes[node * 3 + 1];

      // NOTE Moller-Trumbore ray-triangle test
      for (let i = start; i < start + count; i++) {
        const p = order[i] * 9;
        const ax = positions[p], ay = positions[p + 1], az = positions[p + 2];
        const e1x = positions[p + 3] - ax, e1y = positions[p + 4] - ay, e1z = positions[p + 5] - az;
        const e2x = positions[p + 6] - ax, e2y = positions[p + 7] - ay, e2z = positions[p + 8] - az;

        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
        const det = e1x * px + e1y * py + e1z * pz;

        if (det === 0.0) {
          continue;
        }

        const invDet = 1.0 / det;
        const sx = ox - ax, sy = oy - ay, sz = oz - az;
        const u = (sx * px + sy * py + sz * pz) * invDet;

        if (u < 0.0 || u > 1.0) {
          continue;
        }

        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
        const v = (dx * qx + dy * qy + dz * qz) * invDet;

        if (v < 0.0 || u + v > 1.0) {
          continue;
        }

        const t = (e2x * qx + e2y * qy + e2z * qz) * invDet;

        if (t >= 0.0) {
          target.push(t);
        }
      }
    }

    return target;
  }
}

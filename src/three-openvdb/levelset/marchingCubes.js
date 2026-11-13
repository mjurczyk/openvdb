import { triangleTable } from './marchingCubesTables.js';
import { distanceSurfaceTexel } from './levelSetDistance.js';

// NOTE Corner offsets (x, y, z) in the order of marchingCubesTables.js
const corners = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 0, 1],
  [0, 0, 1],
  [0, 1, 0],
  [1, 1, 0],
  [1, 1, 1],
  [0, 1, 1],
];

// NOTE Each edge: start corner offset, axis (0 x, 1 y, 2 z)
const edges = [
  [0, 0, 0, 0],
  [1, 0, 0, 2],
  [0, 0, 1, 0],
  [0, 0, 0, 2],
  [0, 1, 0, 0],
  [1, 1, 0, 2],
  [0, 1, 1, 0],
  [0, 1, 0, 2],
  [0, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 1, 1],
  [0, 0, 1, 1],
];

// NOTE Passes of normal smoothing on the mesh
const smoothPasses = 2;

// NOTE Each normal becomes the mean of its own normal and the normals of its neighbour vertices.
// The shape does not change. Shading steps from coarse texels become smaller.
const smoothNormals = (normals, indices) => {
  let source = Float32Array.from(normals);
  let target = new Float32Array(source.length);

  for (let pass = 0; pass < smoothPasses; pass++) {
    target.set(source);

    for (let i = 0; i < indices.length; i += 3) {
      for (let corner = 0; corner < 3; corner++) {
        const vertex = indices[i + corner] * 3;
        const next = indices[i + ((corner + 1) % 3)] * 3;
        const previous = indices[i + ((corner + 2) % 3)] * 3;

        for (let axis = 0; axis < 3; axis++) {
          target[vertex + axis] += source[next + axis] + source[previous + axis];
        }
      }
    }

    for (let i = 0; i < target.length; i += 3) {
      const length = Math.hypot(target[i], target[i + 1], target[i + 2]) || 1.0;

      target[i] /= length;
      target[i + 1] /= length;
      target[i + 2] /= length;
    }

    [source, target] = [target, source];
  }

  return source;
};

// NOTE Surface of signed distance texels (see levelSetDistance.js) in world space.
// Texels outside the data are outside the surface, so all surfaces close.
// Yields the number of cells after each slice. Returns { positions, normals, indices }.
export function* polygonize({ data, dimensions, bbox }) {
  const { x: width, y: height, z: depth } = dimensions;
  const slice = width * height;
  const spacingX = (bbox.max.x - bbox.min.x) / width;
  const spacingY = (bbox.max.y - bbox.min.y) / height;
  const spacingZ = (bbox.max.z - bbox.min.z) / depth;

  const value = (x, y, z) =>
    x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= depth
      ? 255
      : data[x + y * width + z * slice];

  // NOTE Points from -1 to width on each axis. Edge vertex caches of one point slice.
  const pointsX = width + 2;
  const pointsY = height + 2;
  const sliceSize = pointsX * pointsY;
  let lower = [new Int32Array(sliceSize).fill(-1), new Int32Array(sliceSize).fill(-1)];
  let upper = [new Int32Array(sliceSize).fill(-1), new Int32Array(sliceSize).fill(-1)];
  const between = new Int32Array(sliceSize).fill(-1);

  const positions = [];
  const normals = [];
  const indices = [];

  // NOTE Sobel gradient: central differences, smoothed with 1-2-1 weights on the two other axes.
  // Smoother normals than one central difference of 8-bit texels.
  const gradient = (x, y, z, axis) => {
    let sum = 0.0;

    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const weight = (2 - Math.abs(a)) * (2 - Math.abs(b));

        sum +=
          weight *
          (axis === 0
            ? value(x + 1, y + a, z + b) - value(x - 1, y + a, z + b)
            : axis === 1
              ? value(x + a, y + 1, z + b) - value(x + a, y - 1, z + b)
              : value(x + a, y + b, z + 1) - value(x + a, y + b, z - 1));
      }
    }

    return sum;
  };

  const addVertex = (x, y, z, axis) => {
    const x1 = x + (axis === 0 ? 1 : 0);
    const y1 = y + (axis === 1 ? 1 : 0);
    const z1 = z + (axis === 2 ? 1 : 0);
    const a = value(x, y, z) - distanceSurfaceTexel;
    const b = value(x1, y1, z1) - distanceSurfaceTexel;
    const t = a / (a - b);

    positions.push(
      bbox.min.x + (x + (x1 - x) * t + 0.5) * spacingX,
      bbox.min.y + (y + (y1 - y) * t + 0.5) * spacingY,
      bbox.min.z + (z + (z1 - z) * t + 0.5) * spacingZ,
    );

    // NOTE Distance grows outward, so its gradient is the outward normal. Texel units to world units.
    let nx = (gradient(x, y, z, 0) * (1.0 - t) + gradient(x1, y1, z1, 0) * t) / spacingX;
    let ny = (gradient(x, y, z, 1) * (1.0 - t) + gradient(x1, y1, z1, 1) * t) / spacingY;
    let nz = (gradient(x, y, z, 2) * (1.0 - t) + gradient(x1, y1, z1, 2) * t) / spacingZ;
    const length = Math.hypot(nx, ny, nz);

    if (length > 0.0) {
      nx /= length;
      ny /= length;
      nz /= length;
    } else {
      ny = 1.0;
    }

    normals.push(nx, ny, nz);

    return positions.length / 3 - 1;
  };

  // NOTE x and y edges of a point slice are in lower or upper, z edges are in between
  const getVertex = (x, y, z, edge) => {
    const [dx, dy, dz, axis] = edges[edge];
    const px = x + dx;
    const py = y + dy;
    const cache = axis === 2 ? between : (dz ? upper : lower)[axis];
    const index = px + 1 + (py + 1) * pointsX;

    if (cache[index] === -1) {
      cache[index] = addVertex(px, py, z + dz, axis);
    }

    return cache[index];
  };

  for (let z = -1; z < depth; z++) {
    for (let y = -1; y < height; y++) {
      for (let x = -1; x < width; x++) {
        let cubeIndex = 0;

        for (let i = 0; i < 8; i++) {
          const [dx, dy, dz] = corners[i];

          if (value(x + dx, y + dy, z + dz) < distanceSurfaceTexel) {
            cubeIndex |= 1 << i;
          }
        }

        const triangles = triangleTable[cubeIndex];

        for (let i = 0; i < triangles.length; i++) {
          indices.push(getVertex(x, y, z, triangles[i]));
        }
      }
    }

    // NOTE The upper slice is the lower slice of the next cells
    [lower, upper] = [upper, lower];
    upper.forEach((cache) => cache.fill(-1));
    between.fill(-1);

    yield (width + 1) * (height + 1);
  }

  return { positions, normals: smoothNormals(normals, indices), indices };
}

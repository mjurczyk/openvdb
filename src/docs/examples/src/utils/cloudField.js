// NOTE Cloud placement of the Sky demo. Plain numbers, no three.js, so it runs in Node too.

// NOTE Seeded random numbers (mulberry32). The same seed gives the same sky.
export const createRandom = (seed) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// NOTE Random value from 0 to 1 at each integer lattice point
const hash = (x, z, seed) => {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 1442695041);

  h = Math.imul(h ^ (h >>> 13), 1274126177);

  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t) => t * t * (3.0 - 2.0 * t);

const wrap = (value, cells) => ((value % cells) + cells) % cells;

// NOTE 2D value noise, from 0 to 1. The lattice repeats on X after cellsX cells.
const valueNoise = (x, z, seed, cellsX) => {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = smooth(x - x0);
  const tz = smooth(z - z0);
  const ix0 = wrap(x0, cellsX);
  const ix1 = wrap(x0 + 1, cellsX);
  const a = hash(ix0, z0, seed);
  const b = hash(ix1, z0, seed);
  const c = hash(ix0, z0 + 1, seed);
  const d = hash(ix1, z0 + 1, seed);

  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
};

// NOTE Two octaves of value noise, from 0 to 1. The noise repeats on X after period cells, so the field loops without a seam.
export const fieldNoise = (x, z, seed, period) =>
  (valueNoise(x, z, seed, period) * 2.0 + valueNoise(x * 2.0, z * 2.0, seed + 1, period * 2)) / 3.0;

const overlap = (a, b, offsetX) => {
  const x = Math.min(a.max[0], b.max[0] + offsetX) - Math.max(a.min[0], b.min[0] + offsetX);
  const y = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
  const z = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);

  return x > 0.0 && y > 0.0 && z > 0.0 ? x * y * z : 0.0;
};

const boxVolume = (box) =>
  (box.max[0] - box.min[0]) * (box.max[1] - box.min[1]) * (box.max[2] - box.min[2]);

// NOTE Overlap of two boxes: shared volume divided by the volume of the smaller box. The field loops on X,
// so a box also overlaps the copies of the other box one field size to the left and right.
export const getOverlap = (a, b, fieldSize) => {
  let shared = 0.0;

  for (let offset = -1; offset <= 1; offset++) {
    shared += overlap(a, b, offset * fieldSize);
  }

  return shared / Math.min(boxVolume(a), boxVolume(b));
};

// NOTE Places count clouds in a square field (fieldSize, centered on 0, 0). Noise sets where clouds can spawn and their height.
// size: the [x, y, z] size of a cloud box with Y up. A quarter turn swaps x and z. Returns { clouds, attempts }.
// Each cloud: { type, x, y, z, turns, scale, box: { min, max } }.
export const placeClouds = ({
  count,
  types,
  size,
  fieldSize,
  altitude,
  altitudeRange,
  scaleRange,
  maxOverlap,
  noiseCells,
  seed,
  maxAttempts = 200000,
}) => {
  const random = createRandom(seed);
  const clouds = [];
  let attempts = 0;

  while (clouds.length < count && attempts < maxAttempts) {
    attempts++;

    const x = (random() - 0.5) * fieldSize;
    const z = (random() - 0.5) * fieldSize;
    const cellX = (x / fieldSize + 0.5) * noiseCells;
    const cellZ = (z / fieldSize + 0.5) * noiseCells;

    // NOTE Clouds spawn more in high noise. The square makes clear gaps between the cloud groups.
    const coverage = fieldNoise(cellX, cellZ, seed, noiseCells);

    if (random() > coverage * coverage) {
      continue;
    }

    const turns = Math.floor(random() * 4.0);
    const scale = scaleRange[0] + random() * (scaleRange[1] - scaleRange[0]);
    const y = altitude + fieldNoise(cellX + 0.5, cellZ + 0.5, seed + 7, noiseCells) * altitudeRange;
    const halfX = ((turns % 2 === 0 ? size[0] : size[2]) * scale) / 2.0;
    const halfY = (size[1] * scale) / 2.0;
    const halfZ = ((turns % 2 === 0 ? size[2] : size[0]) * scale) / 2.0;
    const box = { min: [x - halfX, y - halfY, z - halfZ], max: [x + halfX, y + halfY, z + halfZ] };

    if (clouds.some((cloud) => getOverlap(box, cloud.box, fieldSize) > maxOverlap)) {
      continue;
    }

    clouds.push({ type: Math.floor(random() * types), x, y, z, turns, scale, box });
  }

  return { clouds, attempts };
};

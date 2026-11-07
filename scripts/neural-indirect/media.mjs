// NOTE Training media of the neural indirect light: procedural clouds, smoke, layers and shapes,
// and the bunny cloud and smoke assets of the examples. A medium is a density function in [0, 1] in its box.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { readWVDBHeader, getWVDBChunks, decodeWVDBPage } from '../../src/openvdb/wvdb/format.js';
import { createRandom, fitGrid } from './features.mjs';

const assetFolder = new URL('../../src/docs/examples/public/assets/', import.meta.url);

// NOTE Value noise with a hashed lattice, smooth interpolation. Range [-1, 1].
const hash = (x, y, z, seed) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(seed, 1274126177);

  h = Math.imul(h ^ (h >>> 13), 1274126177);

  return ((h ^ (h >>> 16)) >>> 0) / 2147483648 - 1;
};

const smooth = (t) => t * t * (3 - 2 * t);

const valueNoise = (x, y, z, seed) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const fz = smooth(z - iz);
  const lerp = (a, b, t) => a + (b - a) * t;
  const plane = (dz) =>
    lerp(
      lerp(hash(ix, iy, iz + dz, seed), hash(ix + 1, iy, iz + dz, seed), fx),
      lerp(hash(ix, iy + 1, iz + dz, seed), hash(ix + 1, iy + 1, iz + dz, seed), fx),
      fy,
    );

  return lerp(plane(0), plane(1), fz);
};

const fbm = (x, y, z, seed, octaves = 4) => {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    sum += amplitude * valueNoise(x * frequency, y * frequency, z * frequency, seed + i * 17);
    amplitude *= 0.5;
    frequency *= 2.03;
  }

  return sum;
};

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

// NOTE Cumulus: soft spheres, eroded by noise at the edges
const createCumulus = (random, seed) => {
  const count = 4 + Math.floor(random() * 20);
  const spheres = Array.from({ length: count }, () => {
    const radius = 0.12 + random() * 0.25;

    return {
      center: [random() * 1.2 - 0.6, (random() * 0.6 - 0.2) * 0.8, random() * 1.2 - 0.6],
      radius,
    };
  });
  const frequency = 3 + random() * 6;
  const erosion = 0.2 + random() * 0.5;
  const softness = 0.05 + random() * 0.2;

  return {
    boxMin: [-1, -0.6, -1],
    boxMax: [1, 0.8, 1],
    density: (x, y, z) => {
      let field = -Infinity;

      for (const { center, radius } of spheres) {
        const dx = x - center[0];
        const dy = y - center[1];
        const dz = z - center[2];

        field = Math.max(field, 1 - Math.sqrt(dx * dx + dy * dy + dz * dz) / radius);
      }

      const noise = fbm(x * frequency, y * frequency, z * frequency, seed) * erosion;

      return clamp01((field + noise) / softness);
    },
  };
};

// NOTE Smoke and wisps: thresholded noise in a soft box
const createWisps = (random, seed) => {
  const frequency = 2 + random() * 5;
  const threshold = random() * 0.25;
  const gain = 2 + random() * 6;

  return {
    boxMin: [-1, -1, -1],
    boxMax: [1, 1, 1],
    density: (x, y, z) => {
      const edge = clamp01((1 - Math.max(Math.abs(x), Math.abs(y), Math.abs(z))) * 4);

      return clamp01((fbm(x * frequency, y * frequency, z * frequency, seed, 5) - threshold) * gain) * edge;
    },
  };
};

// NOTE Stratus: a flat layer with a noisy top and bottom
const createLayer = (random, seed) => {
  const thickness = 0.05 + random() * 0.35;
  const frequency = 2 + random() * 4;
  const roughness = random() * 0.15;

  return {
    boxMin: [-1, -0.5, -1],
    boxMax: [1, 0.5, 1],
    density: (x, y, z) => {
      const top = thickness + fbm(x * frequency, 0, z * frequency, seed) * roughness;
      const bottom = -thickness + fbm(x * frequency, 5, z * frequency, seed + 3) * roughness;

      return clamp01(Math.min(top - y, y - bottom) * 30) * clamp01((1 - Math.max(Math.abs(x), Math.abs(z))) * 10);
    },
  };
};

// NOTE Plain shapes: sphere or box, with uniform or noisy density
const createShape = (random, seed) => {
  const isSphere = random() < 0.5;
  const noise = random() < 0.5 ? 0 : random() * 0.8;
  const frequency = 3 + random() * 5;

  return {
    boxMin: [-1, -1, -1],
    boxMax: [1, 1, 1],
    density: (x, y, z) => {
      const inside = isSphere
        ? clamp01((1 - Math.sqrt(x * x + y * y + z * z)) * 20)
        : clamp01((1 - Math.max(Math.abs(x), Math.abs(y), Math.abs(z))) * 20);

      return inside * clamp01(1 - noise * (0.5 + 0.5 * fbm(x * frequency, y * frequency, z * frequency, seed)));
    },
  };
};

// NOTE Densest LOD of the first grid of a .wvdb file, as a dense Float32Array (x first, then y, then z)
const loadWVDB = (name) => {
  const bytes = new Uint8Array(readFileSync(new URL(name, assetFolder)));
  const { header, dataStart } = readWVDBHeader(bytes);
  const grid = header.grids[0];
  const lod = grid.lods.length - 1;
  const [width, height, depth] = grid.lods[lod].dimensions;
  const values = new Float32Array(width * height * depth);
  const countX = Math.ceil(width / 8);
  const countY = Math.ceil(height / 8);

  getWVDBChunks(header, lod)
    .filter((chunk) => chunk.lod === lod && chunk.kind === 'page' && chunk.gridIndex === 0)
    .forEach((chunk) => {
      const page = inflateSync(bytes.subarray(dataStart + chunk.offset, dataStart + chunk.offset + chunk.length));
      const decoded = decodeWVDBPage(new Uint8Array(page), {
        layout: header.bake.layout,
        bits: header.bake.bits,
        firstIndex: chunk.firstIndex,
        channels: grid.channels,
      });

      decoded.indices.forEach((index, brick) => {
        const ox = (index % countX) * 8;
        const oy = (Math.floor(index / countX) % countY) * 8;
        const oz = Math.floor(index / (countX * countY)) * 8;
        let voxel = brick * 512;

        for (let z = 0; z < 8; z++) {
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++, voxel++) {
              if (ox + x < width && oy + y < height && oz + z < depth) {
                values[ox + x + ((oy + y) + (oz + z) * height) * width] = clamp01(decoded.values[voxel]);
              }
            }
          }
        }
      });
    });

  const [boxMin, boxMax] = grid.bbox;

  return { values, dimensions: [width, height, depth], boxMin, boxMax };
};

const assets = {};

// NOTE Asset medium: trilinear density of the texture, the same texel layout as FrameVolume (texel centres)
const createAsset = (name) => {
  assets[name] = assets[name] ?? loadWVDB(name);

  const { values, dimensions, boxMin, boxMax } = assets[name];
  const [width, height, depth] = dimensions;
  const at = (x, y, z) => values[x + (y + z * height) * width];

  return {
    boxMin,
    boxMax,
    density: (x, y, z) => {
      const fx = Math.min(Math.max(((x - boxMin[0]) / (boxMax[0] - boxMin[0])) * width - 0.5, 0), width - 1);
      const fy = Math.min(Math.max(((y - boxMin[1]) / (boxMax[1] - boxMin[1])) * height - 0.5, 0), height - 1);
      const fz = Math.min(Math.max(((z - boxMin[2]) / (boxMax[2] - boxMin[2])) * depth - 0.5, 0), depth - 1);
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const z0 = Math.floor(fz);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);
      const z1 = Math.min(z0 + 1, depth - 1);
      const bx = fx - x0;
      const by = fy - y0;
      const bz = fz - z0;
      const lerp = (a, b, t) => a + (b - a) * t;

      return lerp(
        lerp(lerp(at(x0, y0, z0), at(x1, y0, z0), bx), lerp(at(x0, y1, z0), at(x1, y1, z0), bx), by),
        lerp(lerp(at(x0, y0, z1), at(x1, y0, z1), bx), lerp(at(x0, y1, z1), at(x1, y1, z1), bx), by),
        bz,
      );
    },
  };
};

export const mediumKinds = ['cumulus', 'wisps', 'layer', 'shape', 'bunny', 'smoke'];

// NOTE A medium of a kind, made from a seed. Asset media get a random density gamma for variety.
export const createMedium = (kind, seed) => {
  const random = createRandom(seed * 7919 + 13);

  switch (kind) {
    case 'cumulus':
      return createCumulus(random, seed);
    case 'wisps':
      return createWisps(random, seed);
    case 'layer':
      return createLayer(random, seed);
    case 'shape':
      return createShape(random, seed);
    case 'bunny':
      return createAsset('bunny_cloud.wvdb');
    case 'smoke':
      return createAsset('smoke.wvdb');
    default:
      throw new Error(`Unknown medium ${kind}`);
  }
};

// NOTE The world shadow grid of a medium, as the shadow density pass writes it: extinction and absorption
// at the voxel centres. Each voxel is the mean of 2 x 2 x 2 density samples (the pass reads a mip of the
// size of the voxel). voxelDepth: largest optical depth of one voxel (grid.unit), albedo: one value for all.
export const buildMediumGrid = (medium, { voxelDepth, albedo, offset = [0, 0, 0] }) => {
  const boxMin = medium.boxMin.map((value, axis) => value + offset[axis]);
  const boxMax = medium.boxMax.map((value, axis) => value + offset[axis]);
  const grid = fitGrid(boxMin, boxMax);
  const { resolution, voxel, min } = grid;
  const density = new Float32Array(resolution ** 3);
  let maxDensity = 0;

  for (let z = 0; z < resolution; z++) {
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        let sum = 0;

        for (let i = 0; i < 8; i++) {
          const px = min[0] + (x + 0.25 + 0.5 * (i & 1)) * voxel[0];
          const py = min[1] + (y + 0.25 + 0.5 * ((i >> 1) & 1)) * voxel[1];
          const pz = min[2] + (z + 0.25 + 0.5 * ((i >> 2) & 1)) * voxel[2];
          const inside =
            px >= boxMin[0] && px <= boxMax[0] && py >= boxMin[1] && py <= boxMax[1] && pz >= boxMin[2] && pz <= boxMax[2];

          sum += inside ? medium.density(px - offset[0], py - offset[1], pz - offset[2]) : 0;
        }

        const value = sum / 8;

        density[x + (y + z * resolution) * resolution] = value;
        maxDensity = Math.max(maxDensity, value);
      }
    }
  }

  // NOTE Extinction for each world unit: the densest voxel has optical depth voxelDepth over grid.unit
  const scale = maxDensity > 0 ? voxelDepth / (maxDensity * grid.unit) : 0;
  const data = new Float32Array(resolution ** 3 * 2);

  for (let i = 0; i < density.length; i++) {
    data[i * 2] = density[i] * scale;
    data[i * 2 + 1] = density[i] * scale * (1 - albedo);
  }

  return { grid, data };
};

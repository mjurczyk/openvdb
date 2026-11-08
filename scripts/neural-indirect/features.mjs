// NOTE Shared code of the neural indirect light scripts: the world shadow grid, its mips, the network inputs
// and the network. It must give the same values as the shaders (frameNeuralChunks.js, FrameTransmittanceMaterial.js
// and FrameGridMipMaterial.js of both backends). Run dataset.mjs, then train.mjs.

// NOTE frameRenderer.settings.shadowResolution default. The network inputs use voxel units of the last cascade.
export const gridResolution = 64;
// NOTE Mip levels 0 (the grid) to 5. Level k has gridResolution / 2^k voxels on each side.
export const neuralLevels = 6;
export const neuralInputs = 3 * neuralLevels + 2;
export const neuralHidden = 32;
// NOTE The settings phase of the training (frameRenderer.settings default: Henyey-Greenstein, g 0.8)
export const trainingPhaseG = 0.8;
// NOTE Shadow march: frameShadowMarchDepth limit and step jitter of the shader (frameJitter 0.5)
const marchDepthLimit = 6.0;
const marchJitter = 0.5;
const maxShadowSteps = 1024;

// NOTE Small deterministic random generator (mulberry32). Returns numbers in [0, 1).
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

// NOTE The same cascade fit as updateGridCascades (core/frameGrid.js) for the last cascade:
// power-of-two voxels on each axis, bounds snapped to the voxels.
export const fitGrid = (boxMin, boxMax, resolution = gridResolution) => {
  const voxel = [0, 0, 0];
  const min = [0, 0, 0];
  const size = [0, 0, 0];

  for (let axis = 0; axis < 3; axis++) {
    const extent = Math.max(boxMax[axis] - boxMin[axis], 1e-6);

    voxel[axis] = 2 ** Math.ceil(Math.log2(extent / (resolution - 1)));
    min[axis] = Math.floor(boxMin[axis] / voxel[axis]) * voxel[axis];
    size[axis] = voxel[axis] * resolution;
  }

  return { resolution, voxel, min, size, unit: Math.max(voxel[0], voxel[1], voxel[2]) };
};

// NOTE Box filter mips of a two-channel grid (extinction, absorption), the same as FrameGridMipMaterial.
// Returns levels 0 to neuralLevels - 1: { resolution, data: Float32Array(resolution^3 * 2) }.
export const buildMips = (grid, data) => {
  const levels = [{ resolution: grid.resolution, data }];

  for (let level = 1; level < neuralLevels; level++) {
    const source = levels[level - 1];
    const sourceResolution = source.resolution;
    const resolution = Math.max(1, sourceResolution >> 1);
    const target = new Float32Array(resolution * resolution * resolution * 2);

    for (let z = 0; z < resolution; z++) {
      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          let extinction = 0;
          let absorption = 0;

          for (let i = 0; i < 8; i++) {
            const sx = Math.min(x * 2 + (i & 1), sourceResolution - 1);
            const sy = Math.min(y * 2 + ((i >> 1) & 1), sourceResolution - 1);
            const sz = Math.min(z * 2 + ((i >> 2) & 1), sourceResolution - 1);
            const index = (sx + (sy + sz * sourceResolution) * sourceResolution) * 2;

            extinction += source.data[index];
            absorption += source.data[index + 1];
          }

          const index = (x + (y + z * resolution) * resolution) * 2;

          target[index] = extinction / 8;
          target[index + 1] = absorption / 8;
        }
      }
    }

    levels.push({ resolution, data: target });
  }

  return levels;
};

// NOTE Linear filter with the edge texels clamped, the same as sampleTiles of the shader
// (hardware bilinear in a slice, manual linear between slices). out gets (extinction, absorption).
export const sampleLevel = (level, u, v, w, out) => {
  const { resolution, data } = level;
  const fx = Math.min(Math.max(u * resolution, 0.5), resolution - 0.5) - 0.5;
  const fy = Math.min(Math.max(v * resolution, 0.5), resolution - 0.5) - 0.5;
  const fz = w * resolution - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const z0 = Math.min(Math.max(Math.floor(fz), 0), resolution - 1);
  const x1 = Math.min(x0 + 1, resolution - 1);
  const y1 = Math.min(y0 + 1, resolution - 1);
  const z1 = Math.min(z0 + 1, resolution - 1);
  const bx = fx - x0;
  const by = fy - y0;
  const bz = Math.min(Math.max(fz - z0, 0), 1);

  for (let channel = 0; channel < 2; channel++) {
    const at = (x, y, z) => data[(x + (y + z * resolution) * resolution) * 2 + channel];
    const slice = (z) => {
      const a = at(x0, y0, z) + (at(x1, y0, z) - at(x0, y0, z)) * bx;
      const b = at(x0, y1, z) + (at(x1, y1, z) - at(x0, y1, z)) * bx;

      return a + (b - a) * by;
    };
    const s0 = slice(z0);

    out[channel] = s0 + (slice(z1) - s0) * bz;
  }

  return out;
};

const inUnitBox = (u, v, w) => u >= 0 && u <= 1 && v >= 0 && v <= 1 && w >= 0 && w <= 1;

// NOTE Mip sample at a world position. 0.0 outside the grid box.
const sampleMip = (grid, levels, level, x, y, z, out) => {
  const u = (x - grid.min[0]) / grid.size[0];
  const v = (y - grid.min[1]) / grid.size[1];
  const w = (z - grid.min[2]) / grid.size[2];

  if (!inUnitBox(u, v, w)) {
    out[0] = 0;
    out[1] = 0;

    return out;
  }

  return sampleLevel(levels[level], u, v, w, out);
};

// NOTE Shadow march values of one step, the same as frameShadowStep: (extinction, effective, reduced scattering)
const shadowStep = (extinction, absorption, multipleScattering, out) => {
  const absorbed = Math.min(absorption, extinction);
  const reduced = (extinction - absorbed) * multipleScattering;

  out[0] = extinction;
  out[1] = Math.sqrt(absorbed * 3 * (absorbed + reduced));
  out[2] = reduced;

  return out;
};

// NOTE The diffusion depth of frameShadowDepth
const diffusionDepth = (depths) => Math.min(depths[0], depths[1] + Math.log(depths[2] * 0.75 + 1));

const halfVoxelInside = (grid, x, y, z) => {
  const inset = 0.5 / grid.resolution;

  for (let axis = 0; axis < 3; axis++) {
    const value = ((axis === 0 ? x : axis === 1 ? y : z) - grid.min[axis]) / grid.size[axis];

    if (value < inset || value > 1 - inset) {
      return false;
    }
  }

  return true;
};

const stepSample = [0, 0];
const stepValues = [0, 0, 0];

// NOTE The light slot march of FrameTransmittanceMaterial (one cascade, diffusion multipleScattering 1 - g).
// One voxel on the fastest axis of the direction for each step. Returns depths [extinction, effective, reduced].
export const marchShadow = (grid, levels, position, direction, multipleScattering, depths = [0, 0, 0]) => {
  const voxelsPerUnit = Math.max(
    Math.abs(direction[0]) / grid.voxel[0],
    Math.abs(direction[1]) / grid.voxel[1],
    Math.abs(direction[2]) / grid.voxel[2],
  );
  const stepLength = 1 / voxelsPerUnit;
  let x = position[0];
  let y = position[1];
  let z = position[2];

  depths[0] = 0;
  depths[1] = 0;
  depths[2] = 0;

  for (let i = 0; i < maxShadowSteps; i++) {
    if (!halfVoxelInside(grid, x, y, z) || diffusionDepth(depths) > marchDepthLimit) {
      break;
    }

    const offset = stepLength * marchJitter;
    const sx = x + direction[0] * offset;
    const sy = y + direction[1] * offset;
    const sz = z + direction[2] * offset;

    // NOTE gridExtinction of the shader: 0.0 when the sample is not in the cascade
    if (halfVoxelInside(grid, sx, sy, sz)) {
      sampleMip(grid, levels, 0, sx, sy, sz, stepSample);
    } else {
      stepSample[0] = 0;
      stepSample[1] = 0;
    }

    shadowStep(stepSample[0], stepSample[1], multipleScattering, stepValues);

    depths[0] += stepValues[0] * stepLength;
    depths[1] += stepValues[1] * stepLength;
    depths[2] += stepValues[2] * stepLength;
    x += direction[0] * stepLength;
    y += direction[1] * stepLength;
    z += direction[2] * stepLength;
  }

  return depths;
};

const featureSample = [0, 0];

// NOTE Network inputs at a world position for a direction to the light. depths: march depths of the slot.
// Inputs: log(1 + optical size) of the local mip box, of the mip box toward the light and of the mip box
// away from the light, for each level k, with the box side and distance h 2^k. Then log(1 + direct optical depth)
// and sqrt(absorption / extinction) of mip level 1 at the position.
export const getFeatures = (grid, levels, position, direction, depths, out) => {
  const [px, py, pz] = position;
  const [dx, dy, dz] = direction;

  for (let level = 0; level < neuralLevels; level++) {
    const length = grid.unit * 2 ** level;

    sampleMip(grid, levels, level, px, py, pz, featureSample);
    out[level] = Math.log1p(featureSample[0] * length);

    sampleMip(grid, levels, level, px + dx * length, py + dy * length, pz + dz * length, featureSample);
    out[neuralLevels + level] = Math.log1p(featureSample[0] * length);

    sampleMip(grid, levels, level, px - dx * length, py - dy * length, pz - dz * length, featureSample);
    out[2 * neuralLevels + level] = Math.log1p(featureSample[0] * length);
  }

  sampleMip(grid, levels, 1, px, py, pz, featureSample);
  out[3 * neuralLevels] = Math.log1p(depths[0]);
  out[3 * neuralLevels + 1] =
    featureSample[0] > 0 ? Math.sqrt(Math.min(Math.max(featureSample[1] / featureSample[0], 0), 1)) : 0;

  return out;
};

// NOTE Scattered light (total - direct) of the existing modes, for the comparison of the training script.
// Diffusion: frameShadowTransmittance. Octaves: isotropic sum of frameShadowTotal (count 4, a b c 0.5).
export const getDiffusionIndirect = (depths) => Math.max(Math.exp(-diffusionDepth(depths)) - Math.exp(-depths[0]), 0);

export const getOctaveIndirect = (depths, count = 4, a = 0.5, b = 0.5) => {
  let light = 0;

  for (let n = 1; n <= count; n++) {
    light += b ** n * Math.exp(-(a ** n) * depths[0]);
  }

  return light;
};

// NOTE Network: inputs -> hidden (ReLU) -> hidden (ReLU) -> 1. Output exp(o): scattered light / light color.
// weights: { w1 (hidden x inputs, row major), b1, w2 (hidden x hidden), b2, w3 (hidden), b3 }. Input scaling is in w1, b1.
export const createNetwork = () => ({
  w1: new Float32Array(neuralHidden * neuralInputs),
  b1: new Float32Array(neuralHidden),
  w2: new Float32Array(neuralHidden * neuralHidden),
  b2: new Float32Array(neuralHidden),
  w3: new Float32Array(neuralHidden),
  b3: new Float32Array(1),
});

// NOTE Forward pass. cache (optional): { h1, h2 } Float32Array(neuralHidden) of the activations. Returns o (log output).
export const runNetwork = (network, inputs, cache) => {
  const h1 = cache?.h1 ?? new Float32Array(neuralHidden);
  const h2 = cache?.h2 ?? new Float32Array(neuralHidden);
  const { w1, b1, w2, b2, w3, b3 } = network;

  for (let j = 0; j < neuralHidden; j++) {
    let sum = b1[j];
    const row = j * neuralInputs;

    for (let i = 0; i < neuralInputs; i++) {
      sum += w1[row + i] * inputs[i];
    }

    h1[j] = sum > 0 ? sum : 0;
  }

  for (let j = 0; j < neuralHidden; j++) {
    let sum = b2[j];
    const row = j * neuralHidden;

    for (let i = 0; i < neuralHidden; i++) {
      sum += w2[row + i] * h1[i];
    }

    h2[j] = sum > 0 ? sum : 0;
  }

  let output = b3[0];

  for (let i = 0; i < neuralHidden; i++) {
    output += w3[i] * h2[i];
  }

  return output;
};

// NOTE Scattered light of multipleScattering 'two-sided' (frameTwoSidedDiffusion of the shaders). front, back: march
// depths toward and away from the light. Light also leaves at the sides: the volume is as wide as it is deep (L).
// phi'' - k^2 phi = -3 exp(-x), k^2 = 2 (PI / (L + 2 z0))^2 (lowest side mode of a square of side L + 2 z0).
// Robin boundaries at x = 0 and x = L. Returns the scattered light (total - direct).
export const getTwoSidedIndirect = (front, back) => {
  const z0 = 2 / 3;
  const f = front[2];
  const slab = f + back[2];
  let k = (Math.SQRT2 * Math.PI) / (slab + 2 * z0);

  if (Math.abs(1 - k * k) < 1e-2) {
    k += 1e-2;
  }

  const p = -3 / (1 - k * k);
  const kl = k * slab;
  const c11 = 1;
  const c12 = -z0 * k;
  const r1 = -p * (1 + z0);
  const c21 = Math.cosh(kl) + z0 * k * Math.sinh(kl);
  const c22 = Math.sinh(kl) + z0 * k * Math.cosh(kl);
  const r2 = -p * Math.exp(-slab) * (1 - z0);
  const det = c11 * c22 - c12 * c21;
  const c = (r1 * c22 - c12 * r2) / det;
  const d = (c11 * r2 - c21 * r1) / det;
  const diffuse = p * Math.exp(-f) + c * Math.cosh(k * f) + d * Math.sinh(k * f);
  const direct = Math.exp(-front[0]);
  const total = Math.max(direct, (diffuse + Math.exp(-f)) * Math.exp(-front[1]));

  return total - direct;
};

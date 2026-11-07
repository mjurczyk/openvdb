// NOTE Makes the training data of the neural indirect light: network inputs and path-traced scattered light
// at voxels of random media, light directions, densities and albedos.
// Run: node scripts/neural-indirect/dataset.mjs [scenes] [workers] [output]
// Defaults: 600 scenes, 8 workers, scripts/neural-indirect/.data/dataset.bin (not in git).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import {
  createRandom,
  buildMips,
  marchShadow,
  getFeatures,
  getDiffusionIndirect,
  getOctaveIndirect,
  neuralInputs,
  trainingPhaseG,
} from './features.mjs';
import { createMedium, buildMediumGrid, mediumKinds } from './media.mjs';
import { createTraceScene, estimateScatteredFluence } from './trace.mjs';

// NOTE Floats of one sample: inputs, target, target variance, diffusion, octaves, direct, scene, kind
export const sampleFloats = neuralInputs + 7;

const pointsPerScene = 1000;
const minPaths = 16;
const maxPaths = 128;
const targetRelativeError = 0.15;
// NOTE Kind weights: cumulus, wisps, layer, shape, bunny, smoke
const kindWeights = [0.3, 0.15, 0.1, 0.15, 0.15, 0.15];

const pickKind = (random) => {
  let value = random();

  for (let i = 0; i < kindWeights.length; i++) {
    value -= kindWeights[i];

    if (value <= 0) {
      return i;
    }
  }

  return kindWeights.length - 1;
};

const logUniform = (random, min, max) => Math.exp(Math.log(min) + random() * (Math.log(max) - Math.log(min)));

const randomDirection = (random) => {
  const z = 1 - 2 * random();
  const r = Math.sqrt(Math.max(0, 1 - z * z));
  const phi = 2 * Math.PI * random();

  return [r * Math.cos(phi), r * Math.sin(phi), z];
};

// NOTE Smallest optical depth from each voxel centre to the grid box along the 6 axis directions (prefix sums).
// Deep voxels are not visible from outside, so they get fewer samples.
const getSurfaceDepths = (grid, data) => {
  const { resolution: r, voxel } = grid;
  const depths = new Float32Array(r * r * r).fill(Infinity);
  const line = new Float32Array(r);

  for (let axis = 0; axis < 3; axis++) {
    const stride = axis === 0 ? 1 : axis === 1 ? r : r * r;

    for (let a = 0; a < r; a++) {
      for (let b = 0; b < r; b++) {
        const base =
          axis === 0 ? (a + b * r) * r : axis === 1 ? a + b * r * r : a + b * r;

        for (let i = 0; i < r; i++) {
          line[i] = data[(base + i * stride) * 2] * voxel[axis];
        }

        let forward = 0;

        for (let i = 0; i < r; i++) {
          const index = base + i * stride;

          depths[index] = Math.min(depths[index], forward + line[i] * 0.5);
          forward += line[i];
        }

        let backward = 0;

        for (let i = r - 1; i >= 0; i--) {
          const index = base + i * stride;

          depths[index] = Math.min(depths[index], backward + line[i] * 0.5);
          backward += line[i];
        }
      }
    }
  }

  return depths;
};

// NOTE Voxels for samples: voxels with extinction, and empty voxels next to them (the shader lights both).
// Weight exp(-surface depth / 4) + 0.05.
const pickPoints = (grid, data, random, count) => {
  const r = grid.resolution;
  const surface = getSurfaceDepths(grid, data);
  const candidates = [];
  const weights = [];

  for (let z = 0; z < r; z++) {
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < r; x++) {
        const index = x + (y + z * r) * r;
        let near = data[index * 2] > 0;

        for (let i = 0; i < 27 && !near; i++) {
          const nx = x + (i % 3) - 1;
          const ny = y + (Math.floor(i / 3) % 3) - 1;
          const nz = z + Math.floor(i / 9) - 1;

          near = nx >= 0 && ny >= 0 && nz >= 0 && nx < r && ny < r && nz < r && data[(nx + (ny + nz * r) * r) * 2] > 0;
        }

        if (near) {
          candidates.push(index);
          weights.push((data[index * 2] > 0 ? 1 : 0.2) * (Math.exp(-surface[index] / 4) + 0.05));
        }
      }
    }
  }

  const cumulative = new Float64Array(weights.length);
  let total = 0;

  for (let i = 0; i < weights.length; i++) {
    total += weights[i];
    cumulative[i] = total;
  }

  return Array.from({ length: Math.min(count, candidates.length) }, () => {
    const value = random() * total;
    let low = 0;
    let high = cumulative.length - 1;

    while (low < high) {
      const middle = (low + high) >> 1;

      if (cumulative[middle] < value) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }

    return candidates[low];
  });
};

// NOTE Medium, grid, mips, light and sample voxels of a scene. The same for the same scene index and seed.
export const makeSceneSetup = (sceneIndex, seed) => {
  const random = createRandom(seed * 104729 + sceneIndex * 31 + 7);
  const kind = pickKind(random);
  const medium = createMedium(mediumKinds[kind], sceneIndex + seed * 100000);
  const voxelDepth = random() < 0.5 ? logUniform(random, 1, 15) : logUniform(random, 0.03, 30);
  const albedoRoll = random();
  const albedo = albedoRoll < 0.45 ? 1 : albedoRoll < 0.6 ? 0.97 + random() * 0.03 : 0.2 + random() * 0.77;
  const extent = Math.max(...medium.boxMax.map((value, axis) => value - medium.boxMin[axis]));
  const offset = [0, 1, 2].map(() => (random() - 0.5) * extent * 0.1);
  const { grid, data } = buildMediumGrid(medium, { voxelDepth, albedo, offset });
  const levels = buildMips(grid, data);
  const lightDirection = randomDirection(random);
  const points = pickPoints(grid, data, random, pointsPerScene);

  return { random, kind, albedo, grid, data, levels, lightDirection, points };
};

const makeScene = (sceneIndex, seed) => {
  const { random, kind, albedo, grid, data, levels, lightDirection, points } = makeSceneSetup(sceneIndex, seed);
  const scene = createTraceScene(grid, data, lightDirection, albedo);
  const samples = new Float32Array(points.length * sampleFloats);
  const features = new Float32Array(neuralInputs);
  const depths = [0, 0, 0];
  const r = grid.resolution;

  points.forEach((index, sample) => {
    const x = index % r;
    const y = Math.floor(index / r) % r;
    const z = Math.floor(index / (r * r));
    const position = [0, 1, 2].map((axis) => grid.min[axis] + ([x, y, z][axis] + 0.5) * grid.voxel[axis]);

    marchShadow(grid, levels, position, lightDirection, 1 - trainingPhaseG, depths);
    getFeatures(grid, levels, position, lightDirection, depths, features);

    // NOTE Paths in batches until the relative error is small, or maxPaths
    let sum = 0;
    let sumVariance = 0;
    let paths = 0;

    while (paths < maxPaths) {
      const batch = estimateScatteredFluence(scene, [x + 0.5, y + 0.5, z + 0.5], minPaths, random, trainingPhaseG);

      sum += batch.mean * minPaths;
      sumVariance += batch.variance * minPaths * minPaths;
      paths += minPaths;

      const mean = sum / paths;

      if (mean <= 0 || Math.sqrt(sumVariance) / paths < targetRelativeError * mean) {
        break;
      }
    }

    const offsetFloats = sample * sampleFloats;

    samples.set(features, offsetFloats);
    samples[offsetFloats + neuralInputs] = sum / paths;
    samples[offsetFloats + neuralInputs + 1] = sumVariance / (paths * paths);
    samples[offsetFloats + neuralInputs + 2] = getDiffusionIndirect(depths);
    samples[offsetFloats + neuralInputs + 3] = getOctaveIndirect(depths);
    samples[offsetFloats + neuralInputs + 4] = Math.exp(-depths[0]);
    samples[offsetFloats + neuralInputs + 5] = sceneIndex;
    samples[offsetFloats + neuralInputs + 6] = kind;
  });

  return samples;
};

const isScript = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainThread && isScript) {
  const sceneCount = Number(process.argv[2] ?? 600);
  const workerCount = Number(process.argv[3] ?? 8);
  const outputPath =
    process.argv[4] ?? fileURLToPath(new URL('./.data/dataset.bin', import.meta.url));
  const seed = 1;
  const started = Date.now();
  const results = new Array(sceneCount);
  let next = 0;
  let done = 0;

  const runWorker = () =>
    new Promise((resolve, reject) => {
      const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { seed } });

      const send = () => {
        if (next >= sceneCount) {
          worker.terminate().then(resolve);

          return;
        }

        worker.postMessage(next++);
      };

      worker.on('message', ({ sceneIndex, samples }) => {
        results[sceneIndex] = samples;
        done++;

        if (done % 20 === 0 || done === sceneCount) {
          const seconds = (Date.now() - started) / 1000;

          console.log(`${done} / ${sceneCount} scenes, ${seconds.toFixed(0)} s`);
        }

        send();
      });
      worker.on('error', reject);
      send();
    });

  await Promise.all(Array.from({ length: workerCount }, runWorker));

  const total = results.reduce((sum, samples) => sum + samples.length, 0);
  const all = new Float32Array(total);
  let offset = 0;

  results.forEach((samples) => {
    all.set(samples, offset);
    offset += samples.length;
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(all.buffer));
  writeFileSync(
    `${outputPath}.json`,
    JSON.stringify({ sceneCount, seed, sampleFloats, samples: total / sampleFloats }, null, 2),
  );
  console.log(`${total / sampleFloats} samples -> ${outputPath}`);
} else if (!isMainThread) {
  parentPort.on('message', (sceneIndex) => {
    const samples = makeScene(sceneIndex, workerData.seed);

    parentPort.postMessage({ sceneIndex, samples }, [samples.buffer]);
  });
}

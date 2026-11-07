// NOTE Compares the scattered light of all multipleScattering modes with the path tracer, on the validation
// scenes of the dataset (scene index % 10 = 0). Run: node scripts/neural-indirect/compare.mjs [dataset]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  neuralInputs,
  trainingPhaseG,
  marchShadow,
  getFeatures,
  getTwoSidedIndirect,
  runNetwork,
} from './features.mjs';
import { makeSceneSetup } from './dataset.mjs';
import { mediumKinds } from './media.mjs';
import { frameNeuralWeights, frameNeuralHidden } from '../../src/three-openvdb/frame/core/frameNeuralIndirect.js';

const datasetPath = process.argv[2] ?? fileURLToPath(new URL('./.data/dataset.bin', import.meta.url));
const meta = JSON.parse(readFileSync(`${datasetPath}.json`, 'utf8'));
const buffer = readFileSync(datasetPath);
const data = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
const floats = neuralInputs + 7;
const count = data.length / floats;

// NOTE Network of the weights module (vec4 layout, input scaling in w1 and b1)
const unpack = () => {
  const w = frameNeuralWeights;
  const n = { w1: w.subarray(0, frameNeuralHidden * neuralInputs) };
  let offset = n.w1.length;

  n.b1 = w.subarray(offset, (offset += frameNeuralHidden));
  n.w2 = w.subarray(offset, (offset += frameNeuralHidden * frameNeuralHidden));
  n.b2 = w.subarray(offset, (offset += frameNeuralHidden));
  n.w3 = w.subarray(offset, (offset += frameNeuralHidden));
  n.b3 = w.subarray(offset, offset + 1);

  return n;
};
const network = unpack();

// NOTE First sample of each scene
const sceneStart = new Map();

for (let i = 0; i < count; i++) {
  const scene = data[i * floats + neuralInputs + 5];

  if (!sceneStart.has(scene)) {
    sceneStart.set(scene, i);
  }
}

const modes = ['1D', '2D', 'OCT', 'N'];
const rows = new Map();
const add = (key, target, values) => {
  const row = rows.get(key) ?? { count: 0, target: 0, error: modes.map(() => 0), bias: modes.map(() => 0) };

  row.count++;
  row.target += target;
  values.forEach((value, i) => {
    row.error[i] += Math.abs(value - target);
    row.bias[i] += value - target;
  });
  rows.set(key, row);
};

const front = [0, 0, 0];
const back = [0, 0, 0];
const features = new Float32Array(neuralInputs);
let mismatches = 0;

for (let sceneIndex = 0; sceneIndex < meta.sceneCount; sceneIndex += 10) {
  const { kind, grid, levels, lightDirection, points } = makeSceneSetup(sceneIndex, meta.seed);
  const r = grid.resolution;
  const away = lightDirection.map((value) => -value);
  const start = sceneStart.get(sceneIndex);

  points.forEach((index, sample) => {
    const offset = (start + sample) * floats;
    const position = [index % r, Math.floor(index / r) % r, Math.floor(index / (r * r))].map(
      (cell, axis) => grid.min[axis] + (cell + 0.5) * grid.voxel[axis],
    );

    marchShadow(grid, levels, position, lightDirection, 1 - trainingPhaseG, front);
    marchShadow(grid, levels, position, away, 1 - trainingPhaseG, back);
    getFeatures(grid, levels, position, lightDirection, front, features);

    if (Math.abs(features[0] - data[offset]) > 1e-4 || Math.abs(features[19] - data[offset + 19]) > 1e-4) {
      mismatches++;
    }

    const target = data[offset + neuralInputs];
    const values = [
      data[offset + neuralInputs + 2],
      getTwoSidedIndirect(front, back),
      data[offset + neuralInputs + 3],
      Math.exp(Math.min(runNetwork(network, features), 4)),
    ];
    const white = data[offset + 19] === 0;

    add(mediumKinds[kind], target, values);
    add(white ? 'albedo 1' : 'albedo < 1', target, values);
    add('all', target, values);
  });
}

console.log(`scattered light vs path tracer, validation scenes (mean abs error / bias, % of the mean target). Sample mismatches: ${mismatches}`);
console.log(`${'set'.padEnd(11)}${'samples'.padStart(8)}  ${modes.map((mode) => mode.padStart(14)).join('')}`);
rows.forEach((row, key) => {
  const cells = modes.map((_, i) => `${((100 * row.error[i]) / row.target).toFixed(0)}% / ${((100 * row.bias[i]) / row.target).toFixed(0)}%`.padStart(14));

  console.log(`${key.padEnd(11)}${String(row.count).padStart(8)}  ${cells.join('')}`);
});

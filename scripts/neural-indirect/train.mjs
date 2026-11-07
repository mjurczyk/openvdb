// NOTE Trains the neural indirect light network on the data of dataset.mjs and writes the weights module
// src/three-openvdb/frame/core/frameNeuralIndirect.js.
// Run: node scripts/neural-indirect/train.mjs [dataset] [epochs]
// Loss: relative squared error (prediction - target)^2 / (prediction + 0.02)^2, the prediction in the
// denominator is a constant for the gradient. Then noisy path-traced targets give the mean (no bias).
// Scenes with index % 10 = 0 are the validation set.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createNetwork, createRandom, runNetwork, neuralInputs, neuralHidden, neuralLevels } from './features.mjs';
import { mediumKinds } from './media.mjs';

const datasetPath = process.argv[2] ?? fileURLToPath(new URL('./.data/dataset.bin', import.meta.url));
const epochs = Number(process.argv[3] ?? 40);
const outputPath = fileURLToPath(new URL('../../src/three-openvdb/frame/core/frameNeuralIndirect.js', import.meta.url));

const sampleFloats = neuralInputs + 7;
const targetOffset = neuralInputs;
const varianceOffset = neuralInputs + 1;
const diffusionOffset = neuralInputs + 2;
const octaveOffset = neuralInputs + 3;
const sceneOffset = neuralInputs + 5;
const kindOffset = neuralInputs + 6;
const batchSize = 256;
const learningRate = 2e-3;
const finalLearningRate = 5e-5;
const lossFloor = 0.02;

const buffer = readFileSync(datasetPath);
const data = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
const count = data.length / sampleFloats;
const train = [];
const validation = [];

for (let i = 0; i < count; i++) {
  (data[i * sampleFloats + sceneOffset] % 10 === 0 ? validation : train).push(i);
}

// NOTE Input scaling from the training set. It is moved into w1 and b1 for export.
const mean = new Float64Array(neuralInputs);
const deviation = new Float64Array(neuralInputs);

train.forEach((index) => {
  for (let i = 0; i < neuralInputs; i++) {
    mean[i] += data[index * sampleFloats + i] / train.length;
  }
});
train.forEach((index) => {
  for (let i = 0; i < neuralInputs; i++) {
    deviation[i] += (data[index * sampleFloats + i] - mean[i]) ** 2 / train.length;
  }
});
for (let i = 0; i < neuralInputs; i++) {
  deviation[i] = Math.sqrt(deviation[i]) || 1;
}

const random = createRandom(12345);
const gaussian = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
const network = createNetwork();
const parameters = ['w1', 'b1', 'w2', 'b2', 'w3', 'b3'];

// NOTE He initialisation. b3 starts at the log of the mean target.
network.w1.forEach((_, i) => (network.w1[i] = gaussian() * Math.sqrt(2 / neuralInputs)));
network.w2.forEach((_, i) => (network.w2[i] = gaussian() * Math.sqrt(2 / neuralHidden)));
network.w3.forEach((_, i) => (network.w3[i] = gaussian() * Math.sqrt(1 / neuralHidden)));
network.b3[0] = Math.log(train.reduce((sum, index) => sum + data[index * sampleFloats + targetOffset], 0) / train.length);

const gradients = Object.fromEntries(parameters.map((key) => [key, new Float32Array(network[key].length)]));
const moments = Object.fromEntries(parameters.map((key) => [key, new Float32Array(network[key].length)]));
const velocities = Object.fromEntries(parameters.map((key) => [key, new Float32Array(network[key].length)]));
const inputs = new Float32Array(neuralInputs);
const cache = { h1: new Float32Array(neuralHidden), h2: new Float32Array(neuralHidden) };
const delta1 = new Float32Array(neuralHidden);
const delta2 = new Float32Array(neuralHidden);

const loadInputs = (index) => {
  for (let i = 0; i < neuralInputs; i++) {
    inputs[i] = (data[index * sampleFloats + i] - mean[i]) / deviation[i];
  }
};

const predict = (index) => {
  loadInputs(index);

  return Math.exp(Math.min(runNetwork(network, inputs, cache), 4));
};

// NOTE Adds the gradient of one sample. Returns its loss.
const backward = (index) => {
  const prediction = predict(index);
  const target = data[index * sampleFloats + targetOffset];
  const scale = prediction + lossFloor;
  const error = (prediction - target) / scale;
  const outputGradient = ((2 * error) / scale) * prediction;
  const { w2, w3 } = network;
  const { h1, h2 } = cache;

  gradients.b3[0] += outputGradient;

  for (let j = 0; j < neuralHidden; j++) {
    gradients.w3[j] += outputGradient * h2[j];
    delta2[j] = h2[j] > 0 ? outputGradient * w3[j] : 0;
  }

  delta1.fill(0);

  for (let j = 0; j < neuralHidden; j++) {
    const d = delta2[j];

    if (d === 0) {
      continue;
    }

    gradients.b2[j] += d;

    const row = j * neuralHidden;

    for (let i = 0; i < neuralHidden; i++) {
      gradients.w2[row + i] += d * h1[i];
      delta1[i] += d * w2[row + i];
    }
  }

  for (let j = 0; j < neuralHidden; j++) {
    const d = h1[j] > 0 ? delta1[j] : 0;

    if (d === 0) {
      continue;
    }

    gradients.b1[j] += d;

    const row = j * neuralInputs;

    for (let i = 0; i < neuralInputs; i++) {
      gradients.w1[row + i] += d * inputs[i];
    }
  }

  return error * error;
};

let step = 0;

const adam = (rate, size) => {
  step++;

  const beta1 = 0.9;
  const beta2 = 0.999;
  const correction1 = 1 - beta1 ** step;
  const correction2 = 1 - beta2 ** step;

  parameters.forEach((key) => {
    const values = network[key];
    const gradient = gradients[key];
    const moment = moments[key];
    const velocity = velocities[key];

    for (let i = 0; i < values.length; i++) {
      const g = gradient[i] / size;

      moment[i] = beta1 * moment[i] + (1 - beta1) * g;
      velocity[i] = beta2 * velocity[i] + (1 - beta2) * g * g;
      values[i] -= (rate * (moment[i] / correction1)) / (Math.sqrt(velocity[i] / correction2) + 1e-8);
      gradient[i] = 0;
    }
  });
};

// NOTE Validation numbers of each kind: relative mean absolute error and relative bias (sum error / sum target)
// of the network, the diffusion mode and the octave mode. noise: the error that the target noise alone gives.
const evaluate = () => {
  const rows = mediumKinds.map(() => ({ count: 0, target: 0, noise: 0, net: [0, 0], diffusion: [0, 0], octaves: [0, 0] }));
  const all = { count: 0, target: 0, noise: 0, net: [0, 0], diffusion: [0, 0], octaves: [0, 0] };

  validation.forEach((index) => {
    const offset = index * sampleFloats;
    const target = data[offset + targetOffset];
    const values = {
      net: predict(index),
      diffusion: data[offset + diffusionOffset],
      octaves: data[offset + octaveOffset],
    };

    [rows[data[offset + kindOffset]], all].forEach((row) => {
      row.count++;
      row.target += target;
      row.noise += Math.sqrt(data[offset + varianceOffset]) * Math.sqrt(2 / Math.PI);

      Object.entries(values).forEach(([key, value]) => {
        row[key][0] += Math.abs(value - target);
        row[key][1] += value - target;
      });
    });
  });

  const format = (row, key) =>
    `${((100 * row[key][0]) / row.target).toFixed(0).padStart(4)}% ${((100 * row[key][1]) / row.target).toFixed(0).padStart(5)}%`;
  const line = (name, row) =>
    `${name.padEnd(8)} ${String(row.count).padStart(6)}  net ${format(row, 'net')}   diffusion ${format(row, 'diffusion')}   octaves ${format(row, 'octaves')}   noise ${((100 * row.noise) / row.target).toFixed(0)}%`;

  console.log('kind     samples  (relative mean abs error, relative bias)');
  rows.forEach((row, kind) => row.count && console.log(line(mediumKinds[kind], row)));
  console.log(line('all', all));
};

console.log(`${train.length} training samples, ${validation.length} validation samples, ${epochs} epochs`);

const order = Int32Array.from(train);

for (let epoch = 0; epoch < epochs; epoch++) {
  const started = Date.now();
  const rate =
    finalLearningRate + 0.5 * (learningRate - finalLearningRate) * (1 + Math.cos((Math.PI * epoch) / epochs));
  let loss = 0;

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = order[i];

    order[i] = order[j];
    order[j] = swap;
  }

  for (let start = 0; start < order.length; start += batchSize) {
    const end = Math.min(start + batchSize, order.length);

    for (let i = start; i < end; i++) {
      loss += backward(order[i]);
    }

    adam(rate, end - start);
  }

  console.log(`epoch ${epoch + 1}: loss ${(loss / order.length).toFixed(4)}, ${((Date.now() - started) / 1000).toFixed(1)} s`);
}

evaluate();

// NOTE Export. Input scaling moved into w1 and b1. vec4 layout for the shaders:
// w1 rows (inputs / 4 vec4 each), b1, w2 rows (hidden / 4 vec4 each), b2, w3, b3 (x).
const w1 = new Float32Array(network.w1.length);
const b1 = new Float32Array(neuralHidden);

for (let j = 0; j < neuralHidden; j++) {
  let bias = network.b1[j];

  for (let i = 0; i < neuralInputs; i++) {
    const weight = network.w1[j * neuralInputs + i] / deviation[i];

    w1[j * neuralInputs + i] = weight;
    bias -= weight * mean[i];
  }

  b1[j] = bias;
}

const packed = [...w1, ...b1, ...network.w2, ...network.b2, ...network.w3, network.b3[0], 0, 0, 0];
const values = packed.map((value) => Number(value.toPrecision(7)));
const rows = [];

for (let i = 0; i < values.length; i += 8) {
  rows.push(`  ${values.slice(i, i + 8).join(', ')},`);
}

writeFileSync(
  outputPath,
  `// NOTE Made by scripts/neural-indirect/train.mjs. Do not edit.
// Weights of the neural indirect light network (frameRenderer.settings.multipleScattering 'neural').
// Inputs (frameNeuralInputs) -> frameNeuralHidden (ReLU) -> frameNeuralHidden (ReLU) -> 1, output exp(o):
// the scattered light of a shadow slot (total - direct) for each unit of light. Input scaling is in w1 and b1.
// Inputs, the same as scripts/neural-indirect/features.mjs getFeatures: for each mip level k (0 to frameNeuralLevels - 1)
// of the world shadow grid, log(1 + extinction * h 2^k) at the position, at h 2^k toward the light and at h 2^k
// away from the light (h: largest voxel side). Then log(1 + direct optical depth) and sqrt(absorption / extinction).
// vec4 layout: w1 rows, b1, w2 rows, b2, w3, b3 (x).
export const frameNeuralLevels = ${neuralLevels};
export const frameNeuralInputs = ${neuralInputs};
export const frameNeuralHidden = ${neuralHidden};

export const frameNeuralWeights = new Float32Array([
${rows.join('\n')}
]);
`,
);

console.log(`${packed.length / 4} vec4 -> ${outputPath}`);

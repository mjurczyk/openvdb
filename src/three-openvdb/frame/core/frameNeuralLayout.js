import { frameNeuralInputs, frameNeuralHidden } from './frameNeuralIndirect.js';

// NOTE vec4 layout of the network weights (core/frameNeuralIndirect.js): w1 rows, b1, w2 rows, b2, w3, b3 (x).
// NOTE The offsets count vec4 values. Both backends read the weights with this layout.
const inputVectors = frameNeuralInputs / 4;
const hiddenVectors = frameNeuralHidden / 4;
const w1Offset = 0;
const b1Offset = frameNeuralHidden * inputVectors;
const w2Offset = b1Offset + hiddenVectors;
const b2Offset = w2Offset + frameNeuralHidden * hiddenVectors;
const w3Offset = b2Offset + hiddenVectors;
const b3Offset = w3Offset + hiddenVectors;

export const frameNeuralLayout = {
  inputVectors,
  hiddenVectors,
  w1Offset,
  b1Offset,
  w2Offset,
  b2Offset,
  w3Offset,
  b3Offset,
};

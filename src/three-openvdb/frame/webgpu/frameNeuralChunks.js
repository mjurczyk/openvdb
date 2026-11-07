import { Fn, float, vec2, vec4, max, min, mix, clamp, floor, exp, log, sqrt, dot, select } from 'three/tsl';
import { frameSample, minComponent, maxComponent } from './frameShaderChunks.js';
import {
  frameNeuralLevels,
  frameNeuralInputs,
  frameNeuralHidden,
  frameNeuralWeights,
} from '../core/frameNeuralIndirect.js';

// NOTE multipleScattering 'neural': scattered light of a shadow slot from a small network
// (core/frameNeuralIndirect.js, made by scripts/neural-indirect). The inputs are the same as getFeatures of
// scripts/neural-indirect/features.mjs. Level 0 is the last cascade of the grid atlas, levels 1 and up are the
// rows of FrameGridMipMaterial. Values outside the last cascade are 0.0.

const inputVectors = frameNeuralInputs / 4;
const hiddenVectors = frameNeuralHidden / 4;
const weight = (index) => vec4(...frameNeuralWeights.subarray(index * 4, index * 4 + 4));

// NOTE vec4 offsets of the weight layout (see core/frameNeuralIndirect.js)
const w1Offset = 0;
const b1Offset = frameNeuralHidden * inputVectors;
const w2Offset = b1Offset + hiddenVectors;
const b2Offset = w2Offset + frameNeuralHidden * hiddenVectors;
const w3Offset = b2Offset + hiddenVectors;
const b3Offset = w3Offset + hiddenVectors;

// NOTE Dense layer with ReLU. inputs: vec4 nodes. Weights are constants in the shader.
const dense = (inputs, weightOffset, biasOffset) => {
  const outputs = [];

  for (let group = 0; group < hiddenVectors; group++) {
    const bias = weight(biasOffset + group);
    const values = [0, 1, 2, 3].map((component) => {
      const row = weightOffset + (group * 4 + component) * inputs.length;

      return inputs.reduce((sum, input, i) => sum.add(dot(weight(row + i), input)), bias.element(component));
    });

    outputs.push(max(vec4(...values), vec4(0.0)).toVar());
  }

  return outputs;
};

// NOTE gridUniforms, grid nodes (createGridNodes), the grid atlas texture node and the mip texture nodes (levels 1 and up)
export const createNeuralNodes = (gridUniforms, grid, densityMap, mipMaps) => {
  const { frameGridCount, frameGridVoxel, frameGridResolution } = gridUniforms;
  const lastCascade = () => frameGridCount.sub(1);

  // NOTE (extinction, absorption) of a level at a world position. Linear filter, edge texels clamped.
  const sampleLevel = (level, worldPosition) => {
    const cascade = lastCascade();
    const uvw = grid.gridUvw(cascade, worldPosition).toVar();
    const inside = minComponent(uvw).greaterThanEqual(0.0).and(maxComponent(uvw).lessThanEqual(1.0));
    let value;

    if (level === 0) {
      value = grid.sampleGrid(densityMap, cascade, uvw).rg;
    } else {
      const resolution = max(floor(frameGridResolution.div(2 ** level)), 1.0);
      const z = uvw.z.mul(resolution).sub(0.5);
      const z0 = clamp(floor(z), 0.0, resolution.sub(1.0));
      const z1 = min(z0.add(1.0), resolution.sub(1.0));
      const blend = clamp(z.sub(z0), 0.0, 1.0);
      const xy = clamp(uvw.xy.mul(resolution), vec2(0.5), vec2(resolution.sub(0.5)));
      const size = vec2(resolution.mul(resolution), resolution);
      const sliceUv = (slice) => vec2(slice.mul(resolution).add(xy.x), xy.y).div(size);

      value = mix(frameSample(mipMaps[level - 1], sliceUv(z0)).rg, frameSample(mipMaps[level - 1], sliceUv(z1)).rg, blend);
    }

    return select(inside, value, vec2(0.0));
  };

  const unit = () => maxComponent(frameGridVoxel.element(lastCascade()));

  // NOTE Inputs that do not depend on the light: (local 0 to 3), (local 4, local 5, albedo input, 0)
  const getLocalInputs = (worldPosition) => {
    const h = unit().toVar();
    const local = Array.from({ length: frameNeuralLevels }, (_, level) =>
      log(sampleLevel(level, worldPosition).x.mul(h.mul(2 ** level)).add(1.0)),
    );
    const albedoSample = sampleLevel(1, worldPosition).toVar();
    const albedoInput = select(
      albedoSample.x.greaterThan(0.0),
      sqrt(clamp(albedoSample.y.div(max(albedoSample.x, 1e-20)), 0.0, 1.0)),
      float(0.0),
    );

    return [vec4(local[0], local[1], local[2], local[3]).toVar(), vec4(local[4], local[5], albedoInput, 0.0).toVar()];
  };

  // NOTE Scattered light (total - direct) for each unit of light. direction: unit direction to the light,
  // opticalDepth: direct optical depth of the slot march.
  const neuralLight = Fn(([worldPosition, direction, opticalDepth, local0, local1]) => {
    const h = unit().toVar();
    const toward = [];
    const away = [];

    for (let level = 0; level < frameNeuralLevels; level++) {
      const length = h.mul(2 ** level).toVar();

      toward.push(log(sampleLevel(level, worldPosition.add(direction.mul(length))).x.mul(length).add(1.0)));
      away.push(log(sampleLevel(level, worldPosition.sub(direction.mul(length))).x.mul(length).add(1.0)));
    }

    const inputs = [
      local0,
      vec4(local1.x, local1.y, toward[0], toward[1]),
      vec4(toward[2], toward[3], toward[4], toward[5]),
      vec4(away[0], away[1], away[2], away[3]),
      vec4(away[4], away[5], log(opticalDepth.add(1.0)), local1.z),
    ].map((input) => input.toVar());

    const hidden1 = dense(inputs, w1Offset, b1Offset);
    const hidden2 = dense(hidden1, w2Offset, b2Offset);
    const output = hidden2.reduce(
      (sum, value, i) => sum.add(dot(weight(w3Offset + i), value)),
      weight(b3Offset).x,
    );

    return exp(min(output, 4.0));
  }).setLayout({
    name: 'frameNeuralLight',
    type: 'float',
    inputs: [
      { name: 'worldPosition', type: 'vec3' },
      { name: 'direction', type: 'vec3' },
      { name: 'opticalDepth', type: 'float' },
      { name: 'local0', type: 'vec4' },
      { name: 'local1', type: 'vec4' },
    ],
  });

  return { getLocalInputs, neuralLight };
};

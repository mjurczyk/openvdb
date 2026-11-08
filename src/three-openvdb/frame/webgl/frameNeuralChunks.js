import {
  frameNeuralLevels,
  frameNeuralInputs,
  frameNeuralHidden,
  frameNeuralWeights,
} from '../core/frameNeuralIndirect.js';

// NOTE multipleScattering 'neural': scattered light of a shadow slot from a small network
// (core/frameNeuralIndirect.js, made by scripts/neural-indirect). The same as webgpu/frameNeuralChunks.js.
// Level 0 is the last cascade of the grid atlas, levels 1 and up are the atlases of FrameGridMipMaterial.
// Values outside the last cascade are 0.0. Needs gridPars. Weights are constants in the shader.

const inputVectors = frameNeuralInputs / 4;
const hiddenVectors = frameNeuralHidden / 4;

const toFloat = (value) => {
  const text = String(value);

  return /[.eE]/.test(text) ? text : `${text}.0`;
};
const weight = (index) =>
  `vec4(${Array.from(frameNeuralWeights.subarray(index * 4, index * 4 + 4), toFloat).join(', ')})`;

const w1Offset = 0;
const b1Offset = frameNeuralHidden * inputVectors;
const w2Offset = b1Offset + hiddenVectors;
const b2Offset = w2Offset + frameNeuralHidden * hiddenVectors;
const w3Offset = b2Offset + hiddenVectors;
const b3Offset = w3Offset + hiddenVectors;

// NOTE Dense layer with ReLU: inputs (names of vec4 variables) -> output vec4 variables named prefix0, prefix1, ...
const dense = (inputs, prefix, weightOffset, biasOffset) =>
  Array.from({ length: hiddenVectors }, (_, group) => {
    const values = [0, 1, 2, 3].map((component) => {
      const row = weightOffset + (group * 4 + component) * inputs.length;
      const sum = inputs.map((input, i) => `dot(${weight(row + i)}, ${input})`).join(' + ');

      return `${weight(biasOffset + group)}.${'xyzw'[component]} + ${sum}`;
    });

    return `    vec4 ${prefix}${group} = max(vec4(\n      ${values.join(',\n      ')}\n    ), vec4(0.0));`;
  }).join('\n');

const hidden1 = Array.from({ length: hiddenVectors }, (_, i) => `frameHidden1${i}`);
const hidden2 = Array.from({ length: hiddenVectors }, (_, i) => `frameHidden2${i}`);
const levels = Array.from({ length: frameNeuralLevels }, (_, level) => level);

export const neuralPars = `
  ${levels
    .slice(1)
    .map((level) => `uniform sampler2D frameNeuralMipMap${level};\n  uniform vec3 frameNeuralMipLayout${level};`)
    .join('\n  ')}

  int frameNeuralCascade() {
    return frameGridCount - 1;
  }

  // NOTE (extinction, absorption) of a level at a world position. 0.0 outside the last cascade.
  // Mip levels: atlas layout (columns, width, height) of FrameGridMipMaterial.
  vec2 frameNeuralSample(int level, vec3 worldPosition) {
    int cascade = frameNeuralCascade();
    vec3 uvw = frameGridUvw(cascade, worldPosition);

    if (any(lessThan(uvw, vec3(0.0))) || any(greaterThan(uvw, vec3(1.0)))) {
      return vec2(0.0);
    }

    if (level == 0) {
      return frameSampleGrid(frameShadowDensityMap, cascade, uvw).rg;
    }

    float resolution = max(floor(frameGridResolution / exp2(float(level))), 1.0);

    ${levels
      .slice(1)
      .map(
        (level) =>
          `${level > 1 ? 'else ' : ''}if (level == ${level}) {\n      return frameSampleTiles(frameNeuralMipMap${level}, resolution, 0.0, frameNeuralMipLayout${level}.x, frameNeuralMipLayout${level}.yz, uvw).rg;\n    }`,
      )
      .join('\n    ')}

    return vec2(0.0);
  }

  float frameNeuralUnit() {
    vec3 voxel = frameGridVoxel[frameNeuralCascade()];

    return max(voxel.x, max(voxel.y, voxel.z));
  }

  // NOTE Inputs that do not depend on the light: (local 0 to 3), (local 4, local 5, albedo input, 0)
  void frameNeuralLocalInputs(vec3 worldPosition, out vec4 local0, out vec4 local1) {
    float h = frameNeuralUnit();
    float localInputs[${frameNeuralLevels}];
    // NOTE The albedo input uses the level 1 sample
    vec2 albedoSample = vec2(0.0);

    for (int level = 0; level < ${frameNeuralLevels}; level++) {
      vec2 levelSample = frameNeuralSample(level, worldPosition);

      if (level == 1) {
        albedoSample = levelSample;
      }

      localInputs[level] = log(levelSample.x * h * exp2(float(level)) + 1.0);
    }

    float albedoInput = albedoSample.x > 0.0 ? sqrt(clamp(albedoSample.y / max(albedoSample.x, 1e-20), 0.0, 1.0)) : 0.0;

    local0 = vec4(localInputs[0], localInputs[1], localInputs[2], localInputs[3]);
    local1 = vec4(localInputs[4], localInputs[5], albedoInput, 0.0);
  }

  // NOTE Scattered light (total - direct) for each unit of light. direction: unit direction to the light,
  // opticalDepth: direct optical depth of the slot march.
  float frameNeuralLight(vec3 worldPosition, vec3 direction, float opticalDepth, vec4 local0, vec4 local1) {
    float h = frameNeuralUnit();
    float toward[${frameNeuralLevels}];
    float away[${frameNeuralLevels}];

    for (int level = 0; level < ${frameNeuralLevels}; level++) {
      float scale = h * exp2(float(level));

      toward[level] = log(frameNeuralSample(level, worldPosition + direction * scale).x * scale + 1.0);
      away[level] = log(frameNeuralSample(level, worldPosition - direction * scale).x * scale + 1.0);
    }

    vec4 frameInput0 = local0;
    vec4 frameInput1 = vec4(local1.x, local1.y, toward[0], toward[1]);
    vec4 frameInput2 = vec4(toward[2], toward[3], toward[4], toward[5]);
    vec4 frameInput3 = vec4(away[0], away[1], away[2], away[3]);
    vec4 frameInput4 = vec4(away[4], away[5], log(opticalDepth + 1.0), local1.z);

${dense(
  Array.from({ length: inputVectors }, (_, i) => `frameInput${i}`),
  'frameHidden1',
  w1Offset,
  b1Offset,
)}

${dense(hidden1, 'frameHidden2', w2Offset, b2Offset)}

    float result = ${weight(b3Offset)}.x + ${hidden2.map((name, i) => `dot(${weight(w3Offset + i)}, ${name})`).join(' + ')};

    return exp(min(result, 4.0));
  }
`;

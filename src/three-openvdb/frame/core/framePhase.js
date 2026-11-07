import { frameMieTable, frameMieTableSize } from './frameMieTable.js';
import { frameMieRgbTable } from './frameMieRgbTable.js';
import { frameSpectrumWavelengths } from './frameSpectrum.js';

const clampG = (g) => Math.min(0.99, Math.max(-0.99, Number(g) || 0.0));
const clampWeight = (weight) => Math.min(1.0, Math.max(0.0, Number(weight) || 0.0));

// NOTE Lorenz-Mie mode of 'lorenz-mie-rgb' in the phase vector
export const frameMieRgbMode = 2.0;

// NOTE Phase of a FrameVolume ('volume' lighting) or of frameRenderer.settings ('frame' lighting).
// Modes: 'isotropic', 'henyey-greenstein', 'dual-lobe', 'lorenz-mie' or 'lorenz-mie-rgb'.
// Writes (forward g, back g, back weight, Lorenz-Mie mode) to target.
// Lorenz-Mie mode: 0.0 off, 1.0 the 550 nm table, 2.0 the red, green and blue tables (frameMieRgbMode).
// Isotropic is (0, 0, 0, 0), then the shader phase weight is 1.
export const getFramePhase = (source, target) => {
  if (source.phase === 'henyey-greenstein') {
    return target.set(clampG(source.phaseG), 0.0, 0.0, 0.0);
  }

  if (source.phase === 'dual-lobe') {
    return target.set(
      clampG(source.phaseG),
      clampG(source.phaseBackG),
      clampWeight(source.phaseBackWeight),
      0.0,
    );
  }

  if (source.phase === 'lorenz-mie') {
    return target.set(0.0, 0.0, 0.0, 1.0);
  }

  if (source.phase === 'lorenz-mie-rgb') {
    return target.set(0.0, 0.0, 0.0, frameMieRgbMode);
  }

  return target.set(0.0, 0.0, 0.0, 0.0);
};

// NOTE Phase of each channel of a FrameVolume or of frameRenderer.settings. Writes (red g scale, blue g scale, flag) to target.
// 'henyey-greenstein' and 'dual-lobe': g of each channel is g * (wavelength / 550 nm)^-phaseGExponent.
// Flag 1.0: the channels have other phases ('lorenz-mie-rgb', or a phaseGExponent that is not 0).
export const getFramePhaseSpectrum = (source, target) => {
  const exponent = Number.isFinite(Number(source.phaseGExponent)) ? Number(source.phaseGExponent) : 0.0;

  if (source.phase === 'lorenz-mie-rgb') {
    return target.set(1.0, 1.0, 1.0);
  }

  if ((source.phase === 'henyey-greenstein' || source.phase === 'dual-lobe') && exponent !== 0.0) {
    const [red, green, blue] = frameSpectrumWavelengths;

    return target.set(Math.pow(red / green, -exponent), Math.pow(blue / green, -exponent), 1.0);
  }

  return target.set(1.0, 1.0, 0.0);
};

// NOTE Texels of the Lorenz-Mie texture: 'lorenz-mie-rgb' tables in red, green, blue, and the 'lorenz-mie' table in alpha.
// One texture keeps the texture count of the shaders below the limit of 16.
export const getFrameMieTexels = () => {
  const texels = new Float32Array(frameMieTableSize * 4);

  for (let i = 0; i < frameMieTableSize; i++) {
    texels[i * 4] = frameMieRgbTable[i * 3];
    texels[i * 4 + 1] = frameMieRgbTable[i * 3 + 1];
    texels[i * 4 + 2] = frameMieRgbTable[i * 3 + 2];
    texels[i * 4 + 3] = frameMieTable[i];
  }

  return texels;
};

// NOTE Asymmetry g of the Lorenz-Mie table, see core/frameMieTable.js.
// 'lorenz-mie-rgb' uses it too: g of its channels is less than 1% different.
export const frameMieAsymmetry = 0.8526;

// NOTE Asymmetry g (mean cosine of the scattering angle) of the phase of source
const getFramePhaseAsymmetry = (source) => {
  if (source.phase === 'henyey-greenstein') {
    return clampG(source.phaseG);
  }

  if (source.phase === 'dual-lobe') {
    const weight = clampWeight(source.phaseBackWeight);

    return clampG(source.phaseG) * (1.0 - weight) + clampG(source.phaseBackG) * weight;
  }

  if (source.phase === 'lorenz-mie' || source.phase === 'lorenz-mie-rgb') {
    return frameMieAsymmetry;
  }

  return 0.0;
};

// NOTE Modes of multipleScattering with the diffusion approximation: true (1D, toward the light only),
// 'two-sided' (2D, toward and away from the light) and 'neural' (diffusion where the network is not used)
export const isFrameDiffusion = (mode) => !!mode && mode !== 'octaves';

// NOTE 1.0 for multipleScattering 'two-sided': the shadows of scene lights march away from the light too (frameTwoSidedDiffusion)
export const getFrameTwoSidedDiffusion = (mode) => (mode === 'two-sided' ? 1.0 : 0.0);

// NOTE Multiple scattering value of the shadow marches: 1 - g, the reduced scattering of each unit of scattering.
// Only mode true (diffusion approximation). 'octaves' and false give 0.0. See frameShadowDepth in the shader chunks.
export const getFrameMultipleScattering = (mode, source) =>
  isFrameDiffusion(mode) ? 1.0 - getFramePhaseAsymmetry(source) : 0.0;

export const frameMaxScatteringOctaves = 8;

const clampUnit = (value, fallback) => Math.min(1.0, Math.max(0.0, Number.isFinite(Number(value)) ? Number(value) : fallback));

// NOTE Indirect light octaves of multipleScattering 'octaves'. Writes (count N, extinction a, contribution b, phase c) to target.
// Octave n (1 to N) has extinction * a^n, light * b^n and phase g * c^n. Count 0 is off (true or false multipleScattering).
export const getFrameScatteringOctaves = (settings, target) => {
  if (settings.multipleScattering !== 'octaves') {
    return target.set(0.0, 0.0, 0.0, 0.0);
  }

  const count = Math.min(frameMaxScatteringOctaves, Math.max(1, Math.round(Number(settings.scatteringOctaves) || 1)));

  return target.set(
    count,
    clampUnit(settings.scatteringOctaveExtinction, 0.5),
    clampUnit(settings.scatteringOctaveContribution, 0.5),
    clampUnit(settings.scatteringOctavePhase, 0.5),
  );
};

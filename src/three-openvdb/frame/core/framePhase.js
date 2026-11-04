const clampG = (g) => Math.min(0.99, Math.max(-0.99, Number(g) || 0.0));
const clampWeight = (weight) => Math.min(1.0, Math.max(0.0, Number(weight) || 0.0));

// NOTE Phase of a FrameVolume ('volume' lighting) or of frameRenderer.settings ('frame' lighting).
// Modes: 'isotropic', 'henyey-greenstein', 'dual-lobe' or 'lorenz-mie'.
// Writes (forward g, back g, back weight, Lorenz-Mie weight) to target.
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

  return target.set(0.0, 0.0, 0.0, 0.0);
};

// NOTE Asymmetry g of the Lorenz-Mie table, see core/frameMieTable.js
const mieAsymmetry = 0.8526;

// NOTE Asymmetry g (mean cosine of the scattering angle) of the phase of source
const getFramePhaseAsymmetry = (source) => {
  if (source.phase === 'henyey-greenstein') {
    return clampG(source.phaseG);
  }

  if (source.phase === 'dual-lobe') {
    const weight = clampWeight(source.phaseBackWeight);

    return clampG(source.phaseG) * (1.0 - weight) + clampG(source.phaseBackG) * weight;
  }

  if (source.phase === 'lorenz-mie') {
    return mieAsymmetry;
  }

  return 0.0;
};

// NOTE Multiple scattering value of the shadow marches: 1 - g, the reduced scattering of each unit of scattering.
// 0.0 is single scattering. See frameShadowDepth in the shader chunks.
export const getFrameMultipleScattering = (enabled, source) =>
  enabled ? 1.0 - getFramePhaseAsymmetry(source) : 0.0;

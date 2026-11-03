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

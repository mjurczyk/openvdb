const clampG = (g) => Math.min(0.99, Math.max(-0.99, Number(g) || 0.0));

// NOTE FrameVolume phase: 'isotropic', 'henyey-greenstein' or 'dual-lobe'.
// Writes (forward g, back g, back weight) to target.
// Isotropic is (0, 0, 0), then the shader phase weight is 1.
export const getFramePhase = (frameVolume, target) => {
  if (frameVolume.phase === 'henyey-greenstein') {
    return target.set(clampG(frameVolume.phaseG), 0.0, 0.0);
  }

  if (frameVolume.phase === 'dual-lobe') {
    const backWeight = Math.min(1.0, Math.max(0.0, Number(frameVolume.phaseBackWeight) || 0.0));

    return target.set(clampG(frameVolume.phaseG), clampG(frameVolume.phaseBackG), backWeight);
  }

  return target.set(0.0, 0.0, 0.0);
};

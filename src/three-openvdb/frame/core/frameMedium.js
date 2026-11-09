import * as Three from 'three';

// NOTE Measured media. Albedo is linear (red 650 nm, green 550 nm, blue 450 nm). A range gives its midpoint.
// NOTE A green albedo that is not measured is the mean of red and blue.
// NOTE phaseG is g at 550 nm. phaseGExponent fits g at 450 nm and 650 nm. Extinction depends on the scene scale, so it is not here.
export const frameMediumPresets = {
  // NOTE Mie, Pope & Fry 1997. g 0.857 / 0.853 / 0.850 (blue / green / red): the 'lorenz-mie-rgb' tables.
  cloud: {
    albedo: [1.0, 1.0, 1.0],
    angstromExponent: 0.0,
    phase: 'lorenz-mie-rgb',
    phaseG: 0.853,
    phaseGExponent: 0.0,
  },
  // NOTE Hess et al. 1998 (OPAC). g 0.866 at 550 nm.
  fog: {
    albedo: [1.0, 1.0, 1.0],
    angstromExponent: 0.0,
    phase: 'henyey-greenstein',
    phaseG: 0.866,
    phaseGExponent: 0.0,
  },
  // NOTE OPAC, Baran 2012. g 0.76 to 0.78.
  ice: {
    albedo: [1.0, 1.0, 1.0],
    angstromExponent: 0.0,
    phase: 'henyey-greenstein',
    phaseG: 0.77,
    phaseGExponent: 0.0,
  },
  // NOTE Fresh soot (black carbon), Bond & Bergstrom 2006. Albedo 0.20 to 0.30 (flat), g 0.3 to 0.4 (estimate).
  soot: {
    albedo: [0.25, 0.25, 0.25],
    angstromExponent: 1.0,
    phase: 'henyey-greenstein',
    phaseG: 0.35,
    phaseGExponent: 0.0,
  },
  // NOTE Boreal forest smoke, Dubovik et al. 2002. Angstrom 1.0 to 2.3, g 0.69 / 0.61 (blue / red).
  'white-smoke': {
    albedo: [0.935, 0.9375, 0.94],
    angstromExponent: 1.65,
    phase: 'henyey-greenstein',
    phaseG: 0.645,
    phaseGExponent: 0.335,
  },
  // NOTE Savanna smoke, Dubovik et al. 2002. Angstrom 1.4 to 2.2, g 0.64 / 0.53 (blue / red).
  'dark-smoke': {
    albedo: [0.84, 0.86, 0.88],
    angstromExponent: 1.8,
    phase: 'henyey-greenstein',
    phaseG: 0.577,
    phaseGExponent: 0.513,
  },
  // NOTE Urban haze, Dubovik et al. 2002. Angstrom 1.2 to 2.5, g 0.68 / 0.59 (blue / red).
  haze: {
    albedo: [0.97, 0.975, 0.98],
    angstromExponent: 1.85,
    phase: 'henyey-greenstein',
    phaseG: 0.629,
    phaseGExponent: 0.386,
  },
  // NOTE Saharan dust, Dubovik et al. 2002, Kim et al. 2011. Angstrom -0.1 to 0.7, g 0.73 / 0.752 / 0.71 (blue / green / red).
  dust: {
    albedo: [0.98, 0.944, 0.93],
    angstromExponent: 0.3,
    phase: 'henyey-greenstein',
    phaseG: 0.752,
    phaseGExponent: 0.076,
  },
};

// NOTE FrameVolume props of a preset of frameMediumPresets: baseColor, extinctionScale, angstromExponent and phase props.
// Use them as constructor props, or assign them to a FrameVolume or FrameVolumeAnimation. Unknown names give null.
export const getFrameMediumProps = (name) => {
  const preset = frameMediumPresets[name];

  if (!preset) {
    return null;
  }

  return {
    baseColor: new Three.Color().setRGB(...preset.albedo, Three.LinearSRGBColorSpace),
    extinctionScale: new Three.Vector3(1.0, 1.0, 1.0),
    angstromExponent: preset.angstromExponent,
    phase: preset.phase,
    phaseG: preset.phaseG,
    phaseGExponent: preset.phaseGExponent,
  };
};

// NOTE Wavelengths in nm of the red, green and blue channels (frameRenderer.settings.spectral).
// Green is the reference: extinction is the value at 550 nm.
export const frameSpectrumWavelengths = [650.0, 550.0, 450.0];

const referenceWavelength = frameSpectrumWavelengths[1];

const toNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

// NOTE Measured Angstrom exponents (VDB-116 research). Cloud: droplets and ice, grey (Mie).
// Dust: Saharan dust, -0.1 to 0.7 (Dubovik 2002). Smoke: biomass smoke and haze, 1.2 to 2.5 (Dubovik 2002).
// Air: Rayleigh scattering of air molecules (Bodhaine 1999).
export const frameAngstromExponents = {
  cloud: 0.0,
  dust: 0.3,
  smoke: 1.8,
  air: 4.09,
};

// NOTE A preset name of frameAngstromExponents or a number. Unknown names give 0 (grey).
export const getFrameAngstromExponent = (value) =>
  typeof value === 'string' ? (frameAngstromExponents[value] ?? 0.0) : toNumber(value, 0.0);

// NOTE Extinction scale of each channel of a FrameVolume: extinctionScale * (wavelength / 550)^-angstromExponent.
// Writes (red, green, blue) to target. Values are 0 or more.
export const getFrameExtinctionSpectrum = (frameVolume, target) => {
  const scale = frameVolume.extinctionScale;
  const exponent = getFrameAngstromExponent(frameVolume.angstromExponent);
  const channel = (index, value) =>
    Math.max(0.0, toNumber(value, 1.0)) *
    Math.pow(frameSpectrumWavelengths[index] / referenceWavelength, -exponent);

  return target.set(channel(0, scale?.x), channel(1, scale?.y), channel(2, scale?.z));
};

// NOTE Spectral transmittance of 'frame' lighting: light slots in groups. One pass for each group in use.
// Group 0: sky up, sky down and slot 0. Group g (1 to 3): slots 2g - 1 and 2g. Each direction is marched one time.
// NOTE A group has two entries of (vec3 x, vec3 y): sky (x up, y down) or a slot (x total, y direct),
// packed in 3 RGBA targets: (a.x, a.y.r), (a.y.gb, b.x.rg), (b.x.b, b.y).
export const frameSpectralGroupCount = 4;

// NOTE Groups in use for the number of light slots in use (0 to 6)
export const getFrameSpectralGroups = (slotCount) => 1 + Math.ceil(Math.max(0, slotCount - 1) / 2);

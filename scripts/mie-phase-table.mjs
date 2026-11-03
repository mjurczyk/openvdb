// NOTE Makes the Lorenz-Mie phase table of the FrameVolume 'lorenz-mie' phase function.
// Run: node scripts/mie-phase-table.mjs. It writes src/three-openvdb/frame/core/frameMieTable.js.
// Water droplets, refractive index 1.335, wavelength 550 nm. Absorption is ignored.
// Droplet radii: Deirmendjian C1 cumulus gamma distribution, n(r) = r^6 exp(-1.5 r).
// r is in microns, the mode is 4 microns.
// Mie series: Bohren and Huffman, "Absorption and Scattering of Light by Small Particles", BHMIE.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const tableSize = 2048;
const refractiveIndex = 1.335;
const wavelength = 0.55;
const radiusMin = 0.05;
const radiusMax = 30.0;
const radiusSteps = 1200;

const outputPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'three-openvdb',
  'frame',
  'core',
  'frameMieTable.js',
);

// NOTE Table texel u is at the angle PI * u^2. Texels are dense near the forward diffraction peak.
const angles = Array.from({ length: tableSize }, (_, index) => {
  const u = index / (tableSize - 1);

  return Math.PI * u * u;
});
const cosines = angles.map(Math.cos);

const dropletCount = (radius) => radius ** 6 * Math.exp(-1.5 * radius);

// NOTE Adds (|S1|^2 + |S2|^2) / 2 of one droplet, times weight, to intensity
const addDroplet = (sizeParameter, weight, intensity) => {
  const x = sizeParameter;
  const m = refractiveIndex;
  const y = m * x;
  const termCount = Math.round(x + 4.0 * Math.cbrt(x) + 2.0);
  const recurrenceCount = Math.round(Math.max(termCount, Math.abs(y))) + 15;

  // NOTE Logarithmic derivative D(n), downward recurrence
  const logDerivative = new Float64Array(recurrenceCount + 1);

  for (let n = recurrenceCount; n >= 2; n--) {
    logDerivative[n - 1] = n / y - 1.0 / (logDerivative[n] + n / y);
  }

  // NOTE Riccati-Bessel functions psi and chi, xi = psi - i chi
  let psi0 = Math.cos(x);
  let psi1 = Math.sin(x);
  let chi0 = -Math.sin(x);
  let chi1 = Math.cos(x);

  const a = [];
  const b = [];

  for (let n = 1; n <= termCount; n++) {
    const psi = ((2 * n - 1) * psi1) / x - psi0;
    const chi = ((2 * n - 1) * chi1) / x - chi0;

    // NOTE an = (fa psi - psi1) / (fa xi - xi1), bn the same with fb
    const coefficient = (factor) => {
      const numerator = factor * psi - psi1;
      const denominatorRe = factor * psi - psi1;
      const denominatorIm = -(factor * chi - chi1);
      const scale = denominatorRe * denominatorRe + denominatorIm * denominatorIm;

      return [(numerator * denominatorRe) / scale, (-numerator * denominatorIm) / scale];
    };

    a.push(coefficient(logDerivative[n] / m + n / x));
    b.push(coefficient(m * logDerivative[n] + n / x));

    psi0 = psi1;
    psi1 = psi;
    chi0 = chi1;
    chi1 = chi;
  }

  for (let j = 0; j < tableSize; j++) {
    const mu = cosines[j];
    let pi0 = 0.0;
    let pi1 = 1.0;
    let s1Re = 0.0;
    let s1Im = 0.0;
    let s2Re = 0.0;
    let s2Im = 0.0;

    for (let n = 1; n <= termCount; n++) {
      const fn = (2 * n + 1) / (n * (n + 1));
      const tau = n * mu * pi1 - (n + 1) * pi0;
      const [aRe, aIm] = a[n - 1];
      const [bRe, bIm] = b[n - 1];

      s1Re += fn * (aRe * pi1 + bRe * tau);
      s1Im += fn * (aIm * pi1 + bIm * tau);
      s2Re += fn * (aRe * tau + bRe * pi1);
      s2Im += fn * (aIm * tau + bIm * pi1);

      const pi = ((2 * n + 1) / n) * mu * pi1 - ((n + 1) / n) * pi0;

      pi0 = pi1;
      pi1 = pi;
    }

    intensity[j] += weight * 0.5 * (s1Re * s1Re + s1Im * s1Im + s2Re * s2Re + s2Im * s2Im);
  }
};

const intensity = new Float64Array(tableSize);
const radiusStep = (radiusMax - radiusMin) / radiusSteps;

for (let i = 0; i <= radiusSteps; i++) {
  const radius = radiusMin + i * radiusStep;
  // NOTE Trapezoid rule over the radius
  const weight = dropletCount(radius) * radiusStep * (i === 0 || i === radiusSteps ? 0.5 : 1.0);

  addDroplet((2.0 * Math.PI * radius) / wavelength, weight, intensity);
}

// NOTE Normalize to the isotropic phase: the integral over the sphere is 4 PI, isotropic is 1
const sphereIntegral = (values) => {
  let sum = 0.0;

  for (let j = 1; j < tableSize; j++) {
    const left = values[j - 1] * Math.sin(angles[j - 1]);
    const right = values[j] * Math.sin(angles[j]);

    sum += 0.5 * (left + right) * (angles[j] - angles[j - 1]);
  }

  return 2.0 * Math.PI * sum;
};

const scale = (4.0 * Math.PI) / sphereIntegral(intensity);
const table = Array.from(intensity, (value) => value * scale);
const asymmetry = sphereIntegral(table.map((value, j) => value * cosines[j])) / (4.0 * Math.PI);
const peak = Math.max(...table);

const degrees = (angle) => (angle * 180.0) / Math.PI;
const findAngle = (from, to, compare) => {
  let best = -1;

  angles.forEach((angle, j) => {
    const value = degrees(angle);

    if (value >= from && value <= to && (best < 0 || compare(table[j], table[best]))) {
      best = j;
    }
  });

  return best;
};

const fogbow = findAngle(120, 170, (a, b) => a > b);
const fogbowMinimum = findAngle(100, degrees(angles[fogbow]), (a, b) => a < b);

console.log(`Asymmetry g: ${asymmetry.toFixed(4)}`);
console.log(`Forward peak (0 deg): ${table[0].toFixed(1)}`);
console.log(`Backward (180 deg): ${table[tableSize - 1].toFixed(4)}`);
console.log(`Fogbow: ${degrees(angles[fogbow]).toFixed(1)} deg (${table[fogbow].toFixed(4)})`);
console.log(
  `Minimum before the fogbow: ${degrees(angles[fogbowMinimum]).toFixed(1)} deg (${table[fogbowMinimum].toFixed(4)})`,
);

const values = table.map((value) => Number(value.toPrecision(6))).join(',');

writeFileSync(
  outputPath,
  `// NOTE Generated by scripts/mie-phase-table.mjs. Do not edit.
// Lorenz-Mie phase function of cumulus water droplets at 550 nm, divided by the isotropic phase 1 / (4 PI).
// Texel u (0 to 1) is at the scattering angle PI * u^2. Asymmetry g = ${asymmetry.toFixed(4)}.
export const frameMieTableSize = ${tableSize};

export const frameMiePeak = ${Number(peak.toPrecision(6))};

export const frameMieTable = new Float32Array([${values}]);
`,
);

console.log(`Wrote ${outputPath}`);

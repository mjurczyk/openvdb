// NOTE Multi-directional environment light (Disney "Deep Scattering", §4.4 and §7).
// NOTE The environment is read one time into a small lat-long map. The CPU makes directions with colors from it.
// NOTE Each direction gets its own transmittance in the shaders. The sum of color * transmittance is the irradiance.

export const frameMaxEnvironmentLights = 12;
export const frameMaxEnvironmentSamples = 8;
export const frameEnvironmentMapWidth = 64;
export const frameEnvironmentMapHeight = 32;

// NOTE PMREM blur of the map. A small sun covers more than one texel and is not lost between texels.
export const frameEnvironmentMapRoughness = 0.4;

export const frameEnvironmentModes = {
  outward: 'outward',
  directional: 'directional',
  sphericalHarmonics: 'spherical-harmonics',
};

// NOTE Retry an empty map (environment or PMREM not ready) after this number of updates
const retryInterval = 30;

const normalize = (x, y, z) => {
  const length = Math.hypot(x, y, z) || 1.0;

  return [x / length, y / length, z / length];
};

// NOTE The same direction as the map shaders. u and v are 0 to 1. v = 0 is +Y.
export const getEnvironmentMapDirection = (u, v) => {
  const phi = u * 2.0 * Math.PI;
  const theta = v * Math.PI;

  return [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];
};

// NOTE Real SH basis, bands 0 to 2. Same constants as three.js SphericalHarmonics3.
const getShBasis = ([x, y, z], count) =>
  [
    0.282095,
    0.488603 * y,
    0.488603 * z,
    0.488603 * x,
    1.092548 * x * y,
    1.092548 * y * z,
    0.315392 * (3.0 * z * z - 1.0),
    1.092548 * x * z,
    0.546274 * (x * x - y * y),
  ].slice(0, count);

// NOTE Quadrature directions. Octahedron (spherical 3-design) for L1, icosahedron (5-design) for L2.
const goldenRatio = (1.0 + Math.sqrt(5.0)) / 2.0;
const octahedron = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const icosahedron = [
  [0, 1, goldenRatio],
  [0, -1, goldenRatio],
  [0, 1, -goldenRatio],
  [0, -1, -goldenRatio],
  [1, goldenRatio, 0],
  [-1, goldenRatio, 0],
  [1, -goldenRatio, 0],
  [-1, -goldenRatio, 0],
  [goldenRatio, 0, 1],
  [-goldenRatio, 0, 1],
  [goldenRatio, 0, -1],
  [-goldenRatio, 0, -1],
].map(([x, y, z]) => normalize(x, y, z));

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export const getEnvironmentMode = (settings) => {
  const mode = settings.environmentLighting;

  return mode === frameEnvironmentModes.directional ||
    mode === frameEnvironmentModes.sphericalHarmonics
    ? mode
    : frameEnvironmentModes.outward;
};

// NOTE Holds the map of the scene environment and the environment lights made from it.
// NOTE extract( renderer, scene ) is the backend part. It draws the map and returns a Promise of RGBA floats.
// NOTE RGB is radiance, A is the v coordinate of the texel. Then the row order of the readback does not matter.
export class FrameEnvironmentLights {
  key = null;
  pending = false;
  retryAt = 0;
  updates = 0;
  texels = null;
  texelsVersion = 0;
  warned = false;

  lightsKey = null;
  lights = [];

  // NOTE Output of update(). Colors include scene.environmentIntensity.
  result = {
    mode: frameEnvironmentModes.outward,
    count: 0,
    directions: Array.from({ length: frameMaxEnvironmentLights }, () => [0.0, 1.0, 0.0]),
    colors: Array.from({ length: frameMaxEnvironmentLights }, () => [0.0, 0.0, 0.0]),
  };

  constructor(extract) {
    this.extract = extract;
  }

  getKey(scene) {
    const { environment, environmentRotation: rotation } = scene;

    return `${environment.uuid}:${environment.version}:${rotation.x}:${rotation.y}:${rotation.z}:${rotation.order}`;
  }

  // NOTE Returns null when the current 'outward' path must be used: other mode, no environment, or no map yet.
  update(renderer, scene, settings) {
    const mode = getEnvironmentMode(settings);

    this.updates++;

    if (mode === frameEnvironmentModes.outward || !scene.environment) {
      return null;
    }

    const key = this.getKey(scene);

    if (key !== this.key && !this.pending && this.updates >= this.retryAt) {
      this.requestMap(renderer, scene, key);
    }

    if (!this.texels) {
      return null;
    }

    const lightsKey = `${mode}:${settings.environmentSamples}:${settings.environmentShOrder}:${this.texelsVersion}`;

    if (lightsKey !== this.lightsKey) {
      this.lights =
        mode === frameEnvironmentModes.directional
          ? this.getDirectionalLights(settings.environmentSamples)
          : this.getShLights(settings.environmentShOrder);
      this.lightsKey = lightsKey;
    }

    const { result } = this;
    const intensity = scene.environmentIntensity;

    result.mode = mode;
    result.count = this.lights.length;

    this.lights.forEach(({ direction, color }, index) => {
      result.directions[index] = direction;
      result.colors[index] = color.map((value) => value * intensity);
    });

    return result;
  }

  requestMap(renderer, scene, key) {
    this.pending = true;

    this.extract(renderer, scene)
      .then((pixels) => {
        this.pending = false;

        if (this.setTexels(pixels)) {
          this.key = key;
        } else {
          this.retryAt = this.updates + retryInterval;
        }
      })
      .catch((error) => {
        this.pending = false;
        this.retryAt = this.updates + retryInterval;

        if (!this.warned) {
          console.warn('FrameRenderer: could not read the environment map.', error);
          this.warned = true;
        }
      });
  }

  // NOTE Radiance, direction and solid angle of each texel. Returns false for an empty map.
  setTexels(pixels) {
    const width = frameEnvironmentMapWidth;
    const height = frameEnvironmentMapHeight;
    const texels = [];
    let energy = 0.0;

    for (let i = 0; i < width * height; i++) {
      const r = Math.max(0.0, pixels[i * 4]);
      const g = Math.max(0.0, pixels[i * 4 + 1]);
      const b = Math.max(0.0, pixels[i * 4 + 2]);
      const v = pixels[i * 4 + 3];
      const u = ((i % width) + 0.5) / width;
      const theta = v * Math.PI;
      const solidAngle = ((2.0 * Math.PI) / width) * (Math.PI / height) * Math.sin(theta);

      if (!Number.isFinite(r + g + b + v)) {
        return false;
      }

      energy += luminance(r, g, b) * solidAngle;

      texels.push({
        radiance: [r, g, b],
        luminance: luminance(r, g, b),
        direction: getEnvironmentMapDirection(u, v),
        solidAngle,
      });
    }

    if (energy <= 0.0) {
      return false;
    }

    this.texels = texels;
    this.texelsVersion++;

    return true;
  }

  // NOTE Dominant direction (brightest texel) and fixed sky directions: zenith, nadir, then a horizon ring.
  // NOTE Each texel goes to the nearest direction. A light is at the energy centroid of its texels, with their energy.
  // NOTE Color is energy / 4. Then a uniform environment gives the same light as the 'outward' path.
  getDirectionalLights(samples) {
    const count = Math.min(frameMaxEnvironmentSamples, Math.max(1, Math.round(samples) || 1));
    const peak = this.texels.reduce((best, texel) => (texel.luminance > best.luminance ? texel : best));
    const seeds = [peak.direction];
    const ringCount = count - 3;

    if (count >= 2) {
      seeds.push([0.0, 1.0, 0.0]);
    }

    if (count >= 3) {
      seeds.push([0.0, -1.0, 0.0]);
    }

    // NOTE The horizon ring starts opposite the dominant direction
    const peakAzimuth = Math.atan2(peak.direction[2], peak.direction[0]);

    for (let i = 0; i < ringCount; i++) {
      const azimuth = peakAzimuth + Math.PI + (2.0 * Math.PI * i) / ringCount;

      seeds.push([Math.cos(azimuth), 0.0, Math.sin(azimuth)]);
    }

    const cells = seeds.map((seed) => ({ seed, energy: [0.0, 0.0, 0.0], centroid: [0.0, 0.0, 0.0] }));

    this.texels.forEach(({ radiance, luminance: texelLuminance, direction, solidAngle }) => {
      let nearest = cells[0];
      let nearestDot = -Infinity;

      cells.forEach((cell) => {
        const dot =
          cell.seed[0] * direction[0] + cell.seed[1] * direction[1] + cell.seed[2] * direction[2];

        if (dot > nearestDot) {
          nearest = cell;
          nearestDot = dot;
        }
      });

      for (let c = 0; c < 3; c++) {
        nearest.energy[c] += radiance[c] * solidAngle;
        nearest.centroid[c] += direction[c] * texelLuminance * solidAngle;
      }
    });

    return cells
      .filter(({ energy }) => luminance(...energy) > 0.0)
      .map(({ seed, energy, centroid }) => ({
        direction: Math.hypot(...centroid) > 1e-6 ? normalize(...centroid) : seed,
        color: energy.map((value) => value / 4.0),
        power: luminance(...energy),
      }))
      .sort((a, b) => b.power - a.power);
  }

  // NOTE SH projection of the environment (L1: 4, L2: 9 coefficients). The shaders march the quadrature directions.
  // NOTE SH-projected transmittance: T_lm = sum_m (4PI / M) T_m Y_lm(w_m). Then sum_lm L_lm T_lm = sum_m T_m (4PI / M) Lsh(w_m).
  // NOTE So quadrature direction m gets the color (4PI / M) Lsh(w_m) / 4. The shaders clamp the sum to 0 or more.
  getShLights(order) {
    const coefficientCount = Number(order) === 1 ? 4 : 9;
    const directions = coefficientCount === 4 ? octahedron : icosahedron;
    const coefficients = Array.from({ length: coefficientCount }, () => [0.0, 0.0, 0.0]);

    this.texels.forEach(({ radiance, direction, solidAngle }) => {
      getShBasis(direction, coefficientCount).forEach((basis, index) => {
        for (let c = 0; c < 3; c++) {
          coefficients[index][c] += radiance[c] * basis * solidAngle;
        }
      });
    });

    const weight = (4.0 * Math.PI) / directions.length / 4.0;

    return directions.map((direction) => {
      const color = [0.0, 0.0, 0.0];

      getShBasis(direction, coefficientCount).forEach((basis, index) => {
        for (let c = 0; c < 3; c++) {
          color[c] += coefficients[index][c] * basis * weight;
        }
      });

      return { direction, color };
    });
  }
}

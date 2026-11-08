// NOTE Reference path tracer of the neural indirect light. The medium is the world shadow grid (trilinear extinction,
// clamped at the edge texels, nothing outside the grid box), lit by one directional light of irradiance 1.
// It estimates the scattered fluence at a point: the integral over all directions of the radiance that was
// scattered one or more times before it arrives. That is total - direct of a shadow slot (isotropic weight 1).
// Delta tracking with a majorant for each trilinear cell, next event estimation with a grid of the optical depth
// to the light, Henyey-Greenstein phase (trainingPhaseG) at each scattering.

const maxBounces = 4096;

// NOTE Trilinear cells are between voxel centres. Cell c (-1 to resolution - 1 on each axis) has the voxels c and c + 1.
// Its majorant is the largest extinction of its 8 corners (edge voxels clamped).
const buildMajorants = (resolution, data) => {
  const cells = resolution + 1;
  const majorants = new Float32Array(cells * cells * cells);
  const clampIndex = (value) => Math.min(Math.max(value, 0), resolution - 1);

  for (let z = 0; z < cells; z++) {
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        let max = 0;

        for (let i = 0; i < 8; i++) {
          const vx = clampIndex(x - 1 + (i & 1));
          const vy = clampIndex(y - 1 + ((i >> 1) & 1));
          const vz = clampIndex(z - 1 + ((i >> 2) & 1));

          max = Math.max(max, data[(vx + (vy + vz * resolution) * resolution) * 2]);
        }

        majorants[x + (y + z * cells) * cells] = max;
      }
    }
  }

  return majorants;
};

// NOTE Trilinear value of a scalar voxel field in voxel coordinates (voxel centres at integer + 0.5), edges clamped
const trilinear = (field, stride, offset, resolution, gx, gy, gz) => {
  const fx = Math.min(Math.max(gx - 0.5, 0), resolution - 1);
  const fy = Math.min(Math.max(gy - 0.5, 0), resolution - 1);
  const fz = Math.min(Math.max(gz - 0.5, 0), resolution - 1);
  const x0 = Math.min(fx | 0, resolution - 1);
  const y0 = Math.min(fy | 0, resolution - 1);
  const z0 = Math.min(fz | 0, resolution - 1);
  const x1 = Math.min(x0 + 1, resolution - 1);
  const y1 = Math.min(y0 + 1, resolution - 1);
  const z1 = Math.min(z0 + 1, resolution - 1);
  const bx = fx - x0;
  const by = fy - y0;
  const bz = fz - z0;
  const r = resolution;
  const at = (x, y, z) => field[(x + (y + z * r) * r) * stride + offset];
  const c00 = at(x0, y0, z0) + (at(x1, y0, z0) - at(x0, y0, z0)) * bx;
  const c10 = at(x0, y1, z0) + (at(x1, y1, z0) - at(x0, y1, z0)) * bx;
  const c01 = at(x0, y0, z1) + (at(x1, y0, z1) - at(x0, y0, z1)) * bx;
  const c11 = at(x0, y1, z1) + (at(x1, y1, z1) - at(x0, y1, z1)) * bx;
  const c0 = c00 + (c10 - c00) * by;
  const c1 = c01 + (c11 - c01) * by;

  return c0 + (c1 - c0) * bz;
};

// NOTE Optical depth from each voxel centre to the light, along lightDirection (in voxel space), to the grid box exit.
// Steps of a quarter voxel, trilinear extinction.
const buildLightDepths = (scene) => {
  const { resolution, data, voxel, lightVoxelDirection, lightStepWorld } = scene;
  const depths = new Float32Array(resolution ** 3);
  const [dx, dy, dz] = lightVoxelDirection;
  const step = 0.25;

  for (let z = 0; z < resolution; z++) {
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        let gx = x + 0.5;
        let gy = y + 0.5;
        let gz = z + 0.5;
        let depth = 0;

        while (gx >= 0 && gx <= resolution && gy >= 0 && gy <= resolution && gz >= 0 && gz <= resolution) {
          gx += dx * step * 0.5;
          gy += dy * step * 0.5;
          gz += dz * step * 0.5;
          depth += trilinear(data, 2, 0, resolution, gx, gy, gz) * step * lightStepWorld;
          gx += dx * step * 0.5;
          gy += dy * step * 0.5;
          gz += dz * step * 0.5;

          if (depth > 60) {
            break;
          }
        }

        depths[x + (y + z * resolution) * resolution] = depth;
      }
    }
  }

  void voxel;

  return depths;
};

// NOTE Scene of one medium and one light. lightDirection: unit world direction to the light.
// Path tracing is in voxel space (voxel side 1 on each axis). Distances in voxel space are converted to world
// length per direction for the optical depth.
export const createTraceScene = (grid, data, lightDirection, albedo) => {
  const { resolution, voxel } = grid;
  const toVoxel = (direction) => {
    const v = [direction[0] / voxel[0], direction[1] / voxel[1], direction[2] / voxel[2]];
    const length = Math.hypot(v[0], v[1], v[2]);

    // NOTE World length of one voxel-space unit along this direction
    return { direction: [v[0] / length, v[1] / length, v[2] / length], world: 1 / length };
  };
  const light = toVoxel(lightDirection);
  const scene = {
    grid,
    resolution,
    data,
    voxel,
    albedo,
    lightDirection,
    lightVoxelDirection: light.direction,
    lightStepWorld: light.world,
    majorants: buildMajorants(resolution, data),
    toVoxel,
  };

  scene.lightDepths = buildLightDepths(scene);

  return scene;
};

const henyeyGreenstein = (cosTheta, g) => {
  const g2 = g * g;

  return (1 - g2) / (4 * Math.PI * Math.pow(Math.max(1 + g2 - 2 * g * cosTheta, 1e-6), 1.5));
};

// NOTE World direction of a new scattering direction, Henyey-Greenstein around direction
const sampleHenyeyGreenstein = (direction, g, random, out) => {
  const u = random();
  let cosTheta;

  if (Math.abs(g) < 1e-3) {
    cosTheta = 1 - 2 * u;
  } else {
    const s = (1 - g * g) / (1 - g + 2 * g * u);

    cosTheta = (1 + g * g - s * s) / (2 * g);
  }

  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  const phi = 2 * Math.PI * random();
  const [x, y, z] = direction;
  // NOTE Orthonormal basis (Duff et al. 2017)
  const sign = z >= 0 ? 1 : -1;
  const a = -1 / (sign + z);
  const b = x * y * a;
  const t = [1 + sign * x * x * a, sign * b, -sign * x];
  const bt = [b, sign + y * y * a, -y];
  const cp = Math.cos(phi) * sinTheta;
  const sp = Math.sin(phi) * sinTheta;

  out[0] = t[0] * cp + bt[0] * sp + x * cosTheta;
  out[1] = t[1] * cp + bt[1] * sp + y * cosTheta;
  out[2] = t[2] * cp + bt[2] * sp + z * cosTheta;

  const length = Math.hypot(out[0], out[1], out[2]);

  out[0] /= length;
  out[1] /= length;
  out[2] /= length;

  return out;
};

const position = [0, 0, 0];

// NOTE Delta tracking from position (voxel space) along the world direction. Returns true at a real collision
// (position moves there), false when the path leaves the grid box.
const trackCollision = (scene, worldDirection, random) => {
  const { resolution, data, majorants } = scene;
  const cells = resolution + 1;
  const { direction, world } = scene.toVoxel(worldDirection);
  const [dx, dy, dz] = direction;

  for (let guard = 0; guard < 1000000; guard++) {
    const [gx, gy, gz] = position;

    if (gx < 0 || gx > resolution || gy < 0 || gy > resolution || gz < 0 || gz > resolution) {
      return false;
    }

    // NOTE Trilinear cell (between voxel centres) and the distance to its exit
    const cx = Math.floor(gx - 0.5);
    const cy = Math.floor(gy - 0.5);
    const cz = Math.floor(gz - 0.5);
    const exitAxis = (g, c, d) => (d > 0 ? (c + 1.5 - g) / d : d < 0 ? (c + 0.5 - g) / d : Infinity);
    const exit = Math.min(exitAxis(gx, cx, dx), exitAxis(gy, cy, dy), exitAxis(gz, cz, dz)) + 1e-5;
    const majorant = majorants[cx + 1 + (cy + 1 + (cz + 1) * cells) * cells] * world;

    if (majorant <= 0) {
      position[0] += dx * exit;
      position[1] += dy * exit;
      position[2] += dz * exit;
      continue;
    }

    const distance = -Math.log(1 - random()) / majorant;

    if (distance >= exit) {
      position[0] += dx * exit;
      position[1] += dy * exit;
      position[2] += dz * exit;
      continue;
    }

    position[0] += dx * distance;
    position[1] += dy * distance;
    position[2] += dz * distance;

    if (
      position[0] < 0 ||
      position[1] < 0 ||
      position[2] < 0 ||
      position[0] > resolution ||
      position[1] > resolution ||
      position[2] > resolution
    ) {
      return false;
    }

    const extinction = trilinear(data, 2, 0, resolution, position[0], position[1], position[2]) * world;

    if (random() * majorant < extinction) {
      return true;
    }
  }

  return false;
};

const pathDirection = [0, 0, 0];
const nextDirection = [0, 0, 0];

// NOTE Scattered fluence / light irradiance at a voxel-space point, from paths in uniform directions.
// Returns { mean, variance } of the estimate.
export const estimateScatteredFluence = (scene, point, paths, random, g) => {
  const { resolution, albedo, lightDirection, lightDepths } = scene;
  let sum = 0;
  let sumSquares = 0;

  for (let path = 0; path < paths; path++) {
    const cosTheta = 1 - 2 * random();
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
    const phi = 2 * Math.PI * random();

    pathDirection[0] = sinTheta * Math.cos(phi);
    pathDirection[1] = sinTheta * Math.sin(phi);
    pathDirection[2] = cosTheta;
    position[0] = point[0];
    position[1] = point[1];
    position[2] = point[2];

    let weight = 1;
    let radiance = 0;

    for (let bounce = 0; bounce < maxBounces; bounce++) {
      if (!trackCollision(scene, pathDirection, random)) {
        break;
      }

      weight *= albedo;

      // NOTE Light from the light direction, scattered at the collision toward the previous point
      const lightDepth = trilinear(lightDepths, 1, 0, resolution, position[0], position[1], position[2]);
      const cosLight =
        lightDirection[0] * pathDirection[0] + lightDirection[1] * pathDirection[1] + lightDirection[2] * pathDirection[2];

      radiance += weight * henyeyGreenstein(cosLight, g) * Math.exp(-lightDepth);

      // NOTE Russian roulette for absorbing media
      if (weight < 0.1) {
        if (random() > 0.5) {
          break;
        }

        weight *= 2;
      }

      sampleHenyeyGreenstein(pathDirection, g, random, nextDirection);
      pathDirection[0] = nextDirection[0];
      pathDirection[1] = nextDirection[1];
      pathDirection[2] = nextDirection[2];
    }

    const fluence = 4 * Math.PI * radiance;

    sum += fluence;
    sumSquares += fluence * fluence;
  }

  const mean = sum / paths;

  return { mean, variance: Math.max(sumSquares / paths - mean * mean, 0) / paths };
};

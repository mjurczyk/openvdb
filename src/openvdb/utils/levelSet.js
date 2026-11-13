import { Vector3 } from '../math/vector.js';

// NOTE Sub-samples on each axis for texels that cross the surface
const filterSamples = 4;

// NOTE Inactive voxels are only outside (+background) or inside (-background). Values clamp to the band.
const getVoxelDistance = (grid, index, background) => {
  const value = grid.getValue(index);

  if (!Number.isFinite(value)) {
    return background;
  }

  if (!grid.isActive(index)) {
    return value < 0.0 ? -background : background;
  }

  return Math.min(Math.max(value, -background), background);
};

const corner = new Vector3();

// NOTE Trilinear only near the surface. Far voxels keep the nearest value, which is faster.
const getTrilinearDistance = (grid, index, background) => {
  const nearest = getVoxelDistance(grid, index, background);

  if (Math.abs(nearest) >= background) {
    return nearest;
  }

  const x0 = Math.floor(index.x);
  const y0 = Math.floor(index.y);
  const z0 = Math.floor(index.z);
  const wx = index.x - x0;
  const wy = index.y - y0;
  const wz = index.z - z0;

  let value = 0.0;

  for (let i = 0; i < 8; i++) {
    const dx = i & 1;
    const dy = (i >> 1) & 1;
    const dz = (i >> 2) & 1;
    const weight = (dx ? wx : 1.0 - wx) * (dy ? wy : 1.0 - wy) * (dz ? wz : 1.0 - wz);

    if (weight > 0.0) {
      value += weight * getVoxelDistance(grid, corner.set(x0 + dx, y0 + dy, z0 + dz), background);
    }
  }

  return value;
};

// NOTE Signed distance of a level set grid in dense texels, -background to +background.
// min and size: world box ({ x, y, z }). dimensions: [width, height, depth]. values: Float32Array of all texels.
// The narrow band is often thinner than a texel. Then a point sample is only inside or outside, and the surface
// gets steps. Texels larger than a voxel that cross the surface (the sign changes at their corners) use the mean
// of 4x4x4 samples in the texel. Other texels use a trilinear sample at the centre.
// Yields the number of texels after each row.
export function* sampleLevelSet(grid, { min, size, dimensions: [width, height, depth] }, values) {
  const background = grid.root.background;
  const world = new Vector3();
  const index = new Vector3();

  const toIndex = (x, y, z) =>
    grid.transform.applyInverseTransformMap(
      index.set(
        min.x + (x / width) * size.x,
        min.y + (y / height) * size.y,
        min.z + (z / depth) * size.z,
      ),
    );

  // NOTE Texel size in voxels
  const texel = grid.transform.applyInverseJacobian(
    world.set(size.x / width, size.y / height, size.z / depth),
  );
  const filter = Math.max(Math.abs(texel.x), Math.abs(texel.y), Math.abs(texel.z)) > 1.0;

  // NOTE Signs at texel corners, one corner slice for each side of the texel row
  const cornersX = width + 1;
  const cornerSlice = cornersX * (height + 1);
  let lowerSigns = new Uint8Array(cornerSlice);
  let upperSigns = new Uint8Array(cornerSlice);

  const fillSigns = (signs, z) => {
    for (let y = 0; y <= height; y++) {
      for (let x = 0; x <= width; x++) {
        signs[x + y * cornersX] = grid.getValue(toIndex(x, y, z)) < 0.0 ? 1 : 0;
      }
    }
  };

  const crossesSurface = (x, y) => {
    const first = lowerSigns[x + y * cornersX];

    for (let i = 1; i < 8; i++) {
      const signs = (i >> 2) & 1 ? upperSigns : lowerSigns;

      if (signs[x + (i & 1) + (y + ((i >> 1) & 1)) * cornersX] !== first) {
        return true;
      }
    }

    return false;
  };

  if (filter) {
    fillSigns(lowerSigns, 0);
  }

  let offset = 0;

  for (let z = 0; z < depth; z++) {
    if (filter) {
      fillSigns(upperSigns, z + 1);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++, offset++) {
        if (filter && crossesSurface(x, y)) {
          let sum = 0.0;

          for (let i = 0; i < filterSamples * filterSamples * filterSamples; i++) {
            const sx = (i % filterSamples) + 0.5;
            const sy = (Math.floor(i / filterSamples) % filterSamples) + 0.5;
            const sz = Math.floor(i / (filterSamples * filterSamples)) + 0.5;

            sum += getVoxelDistance(
              grid,
              toIndex(x + sx / filterSamples, y + sy / filterSamples, z + sz / filterSamples),
              background,
            );
          }

          values[offset] = sum / (filterSamples * filterSamples * filterSamples);
        } else {
          values[offset] = getTrilinearDistance(
            grid,
            toIndex(x + 0.5, y + 0.5, z + 0.5),
            background,
          );
        }
      }

      yield width;
    }

    [lowerSigns, upperSigns] = [upperSigns, lowerSigns];
  }
}

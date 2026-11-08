import * as Three from 'three';
import { getFrameExtinctionSpectrum } from './frameSpectrum.js';

// NOTE World shadow grid code of the frame renderer that is the same for all backends. It makes no objects in each frame.

const casterBox = new Three.Box3();
const cascadeBox = new Three.Box3();
const cameraPosition = new Three.Vector3();
const extinctionSpectrum = new Three.Vector3();
const axes = ['x', 'y', 'z'];

// NOTE Signature helpers. Signatures are flat arrays of numbers, compared value by value.
export const pushVector = (values, vector) => {
  values.push(vector.x, vector.y);

  if (vector.z !== undefined) {
    values.push(vector.z);
  }

  if (vector.w !== undefined) {
    values.push(vector.w);
  }
};

export const pushColor = (values, color) => {
  values.push(color.r, color.g, color.b);
};

export const pushElements = (values, elements) => {
  for (let i = 0; i < elements.length; i++) {
    values.push(elements[i]);
  }
};

export const sameValues = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
};

// NOTE The last cascade fits all casters. Then far volumes get coarse shadows, not no shadows.
// Finer cascades are around the camera, in shadowDistance. Each one is half the size of the next.
// Power-of-two voxels and snapped bounds keep shadows stable when the camera moves.
// NOTE Writes gridMin, gridSize and gridVoxel (arrays of Vector3). Returns the cascade count, 0 with no casters.
export const updateGridCascades = (casters, camera, shadowDistance, resolution, cascades, gridMin, gridSize, gridVoxel) => {
  casterBox.makeEmpty();

  for (let i = 0; i < casters.length; i++) {
    casterBox.union(casters[i].volume.worldBox);
  }

  if (casterBox.isEmpty()) {
    return 0;
  }

  cameraPosition.setFromMatrixPosition(camera.matrixWorld);

  const fineHalfSize = Math.min(
    shadowDistance,
    0.5 *
      Math.max(
        casterBox.max.x - casterBox.min.x,
        casterBox.max.y - casterBox.min.y,
        casterBox.max.z - casterBox.min.z,
      ),
  );

  let count = 0;

  for (let cascade = 0; cascade < cascades; cascade++) {
    if (cascade === cascades - 1) {
      cascadeBox.copy(casterBox);
    } else {
      const halfSize = fineHalfSize / Math.pow(2.0, cascades - 1 - cascade);

      cascadeBox.min.copy(cameraPosition).subScalar(halfSize);
      cascadeBox.max.copy(cameraPosition).addScalar(halfSize);
      cascadeBox.intersect(casterBox);
    }

    // NOTE A fine cascade that covers all casters is the same as the last cascade
    if (cascadeBox.isEmpty() || (cascade < cascades - 1 && cascadeBox.equals(casterBox))) {
      continue;
    }

    for (let i = 0; i < 3; i++) {
      const axis = axes[i];
      const extent = Math.max(cascadeBox.max[axis] - cascadeBox.min[axis], 1e-6);
      const voxel = Math.pow(2.0, Math.ceil(Math.log2(extent / (resolution - 1))));

      gridVoxel[count][axis] = voxel;
      gridMin[count][axis] = Math.floor(cascadeBox.min[axis] / voxel) * voxel;
      gridSize[count][axis] = voxel * resolution;
    }

    count++;
  }

  return count;
};

const toCell = (value, min, voxel, resolution, round) =>
  Math.min(resolution, Math.max(0, round((value - min) / voxel)));

// NOTE Voxel rectangle (rect, Vector4) and atlas slices (first, count) of the volume in one shadow grid cascade.
// NOTE Writes target ({ rect, first, count }). Returns false when the volume is out of the cascade.
export const getGridRange = (volume, cascade, resolution, gridMin, gridVoxel, target) => {
  const origin = gridMin[cascade];
  const voxel = gridVoxel[cascade];
  const { min, max } = volume.worldBox;

  const x0 = toCell(min.x, origin.x, voxel.x, resolution, Math.floor);
  const y0 = toCell(min.y, origin.y, voxel.y, resolution, Math.floor);
  const z0 = toCell(min.z, origin.z, voxel.z, resolution, Math.floor);
  const x1 = toCell(max.x, origin.x, voxel.x, resolution, Math.ceil);
  const y1 = toCell(max.y, origin.y, voxel.y, resolution, Math.ceil);
  const z1 = toCell(max.z, origin.z, voxel.z, resolution, Math.ceil);

  if (x1 <= x0 || y1 <= y0 || z1 <= z0) {
    return false;
  }

  target.rect.set(x0, y0, x1, y1);
  target.first = cascade * resolution + z0;
  target.count = z1 - z0;

  return true;
};

// NOTE Caster items of the shadow density pass: one for each caster in each cascade from firstCascade.
// NOTE pool ({ items: [], entries: [] }) is used again in the next call. Returns pool.items.
export const getCascadeCasters = (casters, firstCascade, count, pool) => {
  const { items, entries } = pool;

  items.length = 0;

  for (let cascade = firstCascade; cascade < count; cascade++) {
    for (let i = 0; i < casters.length; i++) {
      if (items.length === entries.length) {
        entries.push({ frameVolume: null, volume: null, cascade: 0 });
      }

      const entry = entries[items.length];

      entry.frameVolume = casters[i].frameVolume;
      entry.volume = casters[i].volume;
      entry.cascade = cascade;
      items.push(entry);
    }
  }

  return items;
};

// NOTE state: the frame renderer, with gridSignature, nextGridSignature, castSignature, nextCastSignature,
// casterSignature, gridVersion and castVersion.
// NOTE gridVersion changes when the cascades, a caster transform, a caster grid or a caster shadow prop change.
// NOTE castVersion changes only for the last cascade. Returns true when castVersion changed.
// NOTE pushCasterMaps(values, volume) adds the id and version of each texture that the shadow density pass reads.
export const updateGridSignatures = (state, casters, count, resolution, spectral, gridMin, gridSize, pushCasterMaps) => {
  const casterValues = state.casterSignature;
  const castValues = state.nextCastSignature;
  const gridValues = state.nextGridSignature;

  casterValues.length = 0;

  for (let i = 0; i < casters.length; i++) {
    const { frameVolume, volume } = casters[i];

    pushElements(casterValues, volume.matrixWorld.elements);
    pushCasterMaps(casterValues, volume);
    pushColor(casterValues, frameVolume.baseColor);
    casterValues.push(frameVolume.getDensityScale(), frameVolume.densityCutoff, frameVolume.extinction);
    pushVector(casterValues, getFrameExtinctionSpectrum(frameVolume, extinctionSpectrum));
    casterValues.push(frameVolume.absorbance, frameVolume.mipmaps ? 1 : 0, frameVolume.wrap3D);
    pushVector(casterValues, frameVolume.offset3D);
  }

  // NOTE The cascade count changes the atlas layout, so a new count needs a new draw
  castValues.length = 0;
  castValues.push(casters.length, count, resolution, spectral ? 1 : 0);

  if (count > 0) {
    pushVector(castValues, gridMin[count - 1]);
    pushVector(castValues, gridSize[count - 1]);
  }

  pushElements(castValues, casterValues);

  gridValues.length = 0;
  gridValues.push(count);

  for (let i = 0; i < count; i++) {
    pushVector(gridValues, gridMin[i]);
    pushVector(gridValues, gridSize[i]);
  }

  pushElements(gridValues, castValues);

  if (!sameValues(gridValues, state.gridSignature)) {
    state.gridVersion++;
    state.nextGridSignature = state.gridSignature;
    state.gridSignature = gridValues;
  }

  const castChanged = !sameValues(castValues, state.castSignature);

  if (castChanged) {
    state.castVersion++;
    state.nextCastSignature = state.castSignature;
    state.castSignature = castValues;
  }

  return castChanged;
};

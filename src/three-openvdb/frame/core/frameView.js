import * as Three from 'three';

// NOTE View code of the frame renderer that is the same for all backends. It makes no objects in each frame.

const unitBox = new Three.Box3(new Three.Vector3(-0.5, -0.5, -0.5), new Three.Vector3(0.5, 0.5, 0.5));
const viewBox = new Three.Box3();
const frustum = new Three.Frustum();
const projectionScreenMatrix = new Three.Matrix4();
const clipMatrix = new Three.Matrix4();
const corner = new Three.Vector4();

// NOTE Finds the ready volumes of the visible FrameVolumes. volumes: in the view. casters: all, when useGrid is true.
// NOTE The entries ({ frameVolume, volume }) and the arrays are used again in the next collect().
export class FrameVolumeCollector {
  volumes = [];
  casters = [];
  // NOTE View depth range of the volumes in the view
  near = 0.0;
  far = 0.0;

  entries = [];
  usedEntries = 0;
  camera = null;
  useGrid = false;
  prepareVolume = null;

  constructor() {
    this.visitObject = (object) => {
      if (!object.isFrameVolume || !object.proxy.layers.test(this.camera.layers)) {
        return;
      }

      const { volumes } = object;

      for (let i = 0; i < volumes.length; i++) {
        this.addVolume(object, volumes[i]);
      }
    };
  }

  getEntry(frameVolume, volume) {
    if (this.usedEntries === this.entries.length) {
      this.entries.push({ frameVolume: null, volume: null });
    }

    const entry = this.entries[this.usedEntries++];

    entry.frameVolume = frameVolume;
    entry.volume = volume;

    return entry;
  }

  addVolume(frameVolume, volume) {
    if (!volume.ready) {
      return;
    }

    const { camera } = this;

    this.prepareVolume?.(frameVolume, volume);

    volume.matrixWorld.multiplyMatrices(frameVolume.matrixWorld, volume.matrix);
    volume.worldToLocal.copy(volume.matrixWorld).invert();
    volume.worldBox.copy(unitBox).applyMatrix4(volume.matrixWorld);

    const entry = this.getEntry(frameVolume, volume);

    // NOTE Volumes out of the view can still cast shadows on visible volumes
    if (this.useGrid) {
      this.casters.push(entry);
    }

    if (!frustum.intersectsBox(volume.worldBox)) {
      return;
    }

    volume.localToView.multiplyMatrices(camera.matrixWorldInverse, volume.matrixWorld);
    volume.viewToLocal.copy(volume.localToView).invert();
    viewBox.copy(unitBox).applyMatrix4(volume.localToView);

    volume.viewNear = -viewBox.max.z;
    volume.viewFar = -viewBox.min.z;

    this.near = Math.min(this.near, volume.viewNear);
    this.far = Math.max(this.far, volume.viewFar);

    this.volumes.push(entry);
  }

  // NOTE settings: near and far of frameRenderer.settings. prepareVolume(frameVolume, volume) runs before each volume.
  // NOTE Returns this. volumes is empty when no volume is in the view.
  collect(scene, camera, settings, useGrid, prepareVolume = null) {
    this.volumes.length = 0;
    this.casters.length = 0;
    this.usedEntries = 0;
    this.near = Infinity;
    this.far = 0.0;
    this.camera = camera;
    this.useGrid = useGrid;
    this.prepareVolume = prepareVolume;

    projectionScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projectionScreenMatrix);

    scene.traverseVisible(this.visitObject);

    // NOTE Fit the slices to the visible volumes. Then no slices are used for empty space.
    this.near = Math.max(this.near, settings.near, camera.near);
    this.far = Math.min(this.far, settings.far, camera.far);

    if (this.far <= this.near) {
      this.volumes.length = 0;
    }

    this.far = Math.max(this.far, this.near * 1.0001);
    this.camera = null;
    this.prepareVolume = null;

    return this;
  }

  // NOTE True when a volume in the view or a caster uses mipmaps
  hasMipmaps() {
    return hasMipmaps(this.volumes) || hasMipmaps(this.casters);
  }
}

const hasMipmaps = (items) => {
  for (let i = 0; i < items.length; i++) {
    if (items[i].frameVolume.mipmaps) {
      return true;
    }
  }

  return false;
};

// NOTE Fractional slice of a view depth. range: froxelRange (near, far). Slices are logarithmic.
export const getFroxelSlice = (viewDepth, range, depth) =>
  (depth * Math.log(Math.max(viewDepth, range.x) / range.x)) / Math.log(range.y / range.x);

// NOTE First slice and slice count of a volume. Writes target ({ first, count }) and returns it.
export const getFroxelSliceRange = (volume, range, depth, target) => {
  const first = Math.max(0, Math.floor(getFroxelSlice(volume.viewNear, range, depth)));
  const last = Math.min(depth - 1, Math.ceil(getFroxelSlice(volume.viewFar, range, depth)));

  target.first = first;
  target.count = last - first + 1;

  return target;
};

// NOTE Screen rectangle of the volume in froxel cells (x0, y0, x1, y1), with one cell of padding for the linear filter.
// NOTE Writes target (Vector4). Returns false when the volume covers no cell.
export const getFroxelRect = (volume, camera, width, height, target) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  clipMatrix.multiplyMatrices(camera.projectionMatrix, volume.localToView);

  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, i & 4 ? 0.5 : -0.5, 1.0).applyMatrix4(clipMatrix);

    // NOTE A corner behind the camera: the volume can cover all of the screen
    if (corner.w <= 1e-6) {
      target.set(0.0, 0.0, width, height);

      return true;
    }

    minX = Math.min(minX, corner.x / corner.w);
    minY = Math.min(minY, corner.y / corner.w);
    maxX = Math.max(maxX, corner.x / corner.w);
    maxY = Math.max(maxY, corner.y / corner.w);
  }

  const x0 = Math.max(0, Math.floor((minX * 0.5 + 0.5) * width) - 1);
  const y0 = Math.max(0, Math.floor((minY * 0.5 + 0.5) * height) - 1);
  const x1 = Math.min(width, Math.ceil((maxX * 0.5 + 0.5) * width) + 1);
  const y1 = Math.min(height, Math.ceil((maxY * 0.5 + 0.5) * height) + 1);

  if (x1 <= x0 || y1 <= y0) {
    return false;
  }

  target.set(x0, y0, x1, y1);

  return true;
};

const volumeRect = new Three.Vector4();
const volumeSlices = { first: 0, count: 0 };

// NOTE Froxel area of all volumes: the union of their rectangles and slices, one cell and one slice larger on each side.
// NOTE Froxels out of it stay empty in all passes: the temporal neighbor clamp reads only one cell and one slice away.
// NOTE Writes area ({ rect (Vector4, x0, y0, x1, y1), first, count }). count is 0 when no volume covers a cell.
export const getFroxelArea = (volumes, camera, width, height, range, depth, area) => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let first = Infinity;
  let last = -Infinity;

  for (let i = 0; i < volumes.length; i++) {
    const { volume } = volumes[i];

    if (!getFroxelRect(volume, camera, width, height, volumeRect)) {
      continue;
    }

    getFroxelSliceRange(volume, range, depth, volumeSlices);

    x0 = Math.min(x0, volumeRect.x);
    y0 = Math.min(y0, volumeRect.y);
    x1 = Math.max(x1, volumeRect.z);
    y1 = Math.max(y1, volumeRect.w);
    first = Math.min(first, volumeSlices.first);
    last = Math.max(last, volumeSlices.first + volumeSlices.count - 1);
  }

  if (first > last) {
    area.rect.set(0.0, 0.0, 0.0, 0.0);
    area.first = 0;
    area.count = 0;

    return area;
  }

  area.rect.set(Math.max(0, x0 - 1), Math.max(0, y0 - 1), Math.min(width, x1 + 1), Math.min(height, y1 + 1));
  area.first = Math.max(0, first - 1);
  area.count = Math.min(depth - 1, last + 1) - area.first + 1;

  return area;
};

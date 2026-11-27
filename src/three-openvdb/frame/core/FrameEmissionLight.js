import * as Three from 'three';
import { pushElements, sameValues } from './frameGrid.js';

// NOTE Directions of the emitted light of each volume, and rays on each side of the square that covers the volume
export const frameEmissionDirections = 16;
export const frameEmissionRays = 8;

// NOTE The probe atlas has the size for the largest grid and all cascades. Then settings do not make a new texture.
// NOTE Lit materials keep old texture bindings until they change, so the probe texture must stay the same.
// NOTE Z slices of all cascades are tiles of the atlas, the same layout as the shadow grid.
export const frameEmissionMaxResolution = 32;
export const frameEmissionMaxCascades = 4;
export const frameEmissionAtlasColumns = Math.ceil(
  Math.sqrt(frameEmissionMaxResolution * frameEmissionMaxCascades),
);
export const frameEmissionAtlasSize = frameEmissionMaxResolution * frameEmissionAtlasColumns;

const unitBox = new Three.Box3(
  new Three.Vector3(-0.5, -0.5, -0.5),
  new Three.Vector3(0.5, 0.5, 0.5),
);
const gridBox = new Three.Box3();
const cascadeBox = new Three.Box3();
const boxSize = new Three.Vector3();
const cameraPosition = new Three.Vector3();
const corner = new Three.Vector3();

const pushTexture = (values, map) => {
  values.push(map ? map.id : -1, map ? map.version : -1);
};

// NOTE The same fields as a volume of FrameVolume, then setVolumeUniforms reads it. View matrices are not used.
const createEmitter = () => ({
  frameVolume: null,
  volume: null,
  // NOTE Number signature of all values that change the emitted light, compared with sameValues
  signature: [],
  matrixWorld: new Three.Matrix4(),
  worldToLocal: new Three.Matrix4(),
  localToView: new Three.Matrix4(),
  viewToLocal: new Three.Matrix4(),
  worldBox: new Three.Box3(),
  center: new Three.Vector3(),
  radius: 0.0,
  get densityMap3D() {
    return this.volume.densityMap3D;
  },
  get emissiveMap3D() {
    return this.volume.emissiveMap3D;
  },
  get baseColorMap3D() {
    return this.volume.baseColorMap3D;
  },
  get maskMap3D() {
    return this.volume.maskMap3D;
  },
  get mipMaps() {
    return this.volume.mipMaps;
  },
});

// NOTE Light from the emissive grids of all visible FrameVolume objects in the scene, also instances and animations.
// NOTE 1. Each changed volume gets its emitted light and emission center. 2. Probe cascades add the light of all volumes.
// NOTE This class has the CPU side. The FrameEmissionLight of each backend runs the GPU passes and lights the materials.
export class FrameEmissionLightBase extends Three.Light {
  isFrameEmissionLight = true;

  emitters = [];
  emitterCount = 0;
  // NOTE Emitter signature of the last draw of each slot
  slotSignatures = [];
  slotCount = 0;
  // NOTE Probe signatures of the last draw and of this render. The two arrays swap.
  probeSignature = [];
  nextProbeSignature = [];
  // NOTE prepareProbes returns this array. It and its entries are used again in the next call.
  changed = [];
  changedEntries = [];

  constructor(props = {}) {
    const {
      color = 0xffffff,
      intensity = 1.0,
      // NOTE Probes on each axis of each cascade, 2 to 32
      resolution = 8,
      // NOTE Size of the last cascade, as a multiple of the box of all emitting volumes. Past it, light falls off with distance squared.
      range = 3.0,
      // NOTE 1 is one grid for all volumes. More cascades (up to 4) add finer grids around the camera.
      cascades = 1,
      // NOTE The finer cascades cover only this distance from the camera
      distance = 512,
      // NOTE Steps of each ray in a volume
      steps = 24,
    } = props;

    super(color, intensity);

    this.type = 'FrameEmissionLight';
    this.resolution = resolution;
    this.range = range;
    this.cascades = cascades;
    this.distance = distance;
    this.steps = steps;

    this.cascadeMin = Array.from({ length: frameEmissionMaxCascades }, () => new Three.Vector3());
    this.cascadeSize = Array.from(
      { length: frameEmissionMaxCascades },
      () => new Three.Vector3(1.0, 1.0, 1.0),
    );
    this.cascadeCount = 0;
    this.probeResolution = 2;
    this.probeCenter = new Three.Vector3();
  }

  getSteps() {
    return Math.max(1, Math.round(this.steps));
  }

  // NOTE Backends build the mipmaps of the volume textures here
  updateMipmaps(/* frameVolume, volume */) {}

  // NOTE Backends make new emitter targets with slotCount rows here
  resizeSlots() {}

  collectEmitters(scene) {
    let count = 0;

    scene.traverseVisible((object) => {
      if (!object.isFrameVolume) {
        return;
      }

      object.volumes.forEach((volume) => {
        if (!volume.ready || !volume.emissiveMap3D) {
          return;
        }

        this.updateMipmaps(object, volume);

        if (!this.emitters[count]) {
          this.emitters[count] = createEmitter();
        }

        const emitter = this.emitters[count++];

        emitter.frameVolume = object;
        emitter.volume = volume;
        emitter.matrixWorld.multiplyMatrices(object.matrixWorld, volume.matrix);
        emitter.worldToLocal.copy(emitter.matrixWorld).invert();
        emitter.worldBox.copy(unitBox).applyMatrix4(emitter.matrixWorld);
        emitter.center.setFromMatrixPosition(emitter.matrixWorld);
        emitter.radius = 0.0;

        for (let i = 0; i < 8; i++) {
          corner
            .set(i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, i & 4 ? 0.5 : -0.5)
            .applyMatrix4(emitter.matrixWorld);

          emitter.radius = Math.max(emitter.radius, corner.distanceTo(emitter.center));
        }

        const { signature } = emitter;
        const { mipMaps } = volume;

        signature.length = 0;
        pushTexture(signature, volume.densityMap3D);
        pushTexture(signature, volume.emissiveMap3D);
        pushTexture(signature, volume.maskMap3D);

        for (const level in mipMaps) {
          signature.push(mipMaps[level].texture.id);
        }

        signature.push(
          object.extinction,
          object.getDensityScale(),
          object.densityCutoff,
          object.absorbance,
          object.emissiveIntensity,
          object.temperatureRange.x,
          object.temperatureRange.y,
          object.emissionSpectrum,
          object.sootExponent,
          object.offset3D.x,
          object.offset3D.y,
          object.offset3D.z,
          object.wrap3D,
          object.mipmaps,
          this.getSteps(),
        );
        pushElements(signature, emitter.matrixWorld.elements);
      });
    });

    this.emitterCount = count;
  }

  // NOTE The last cascade is the box of all emitters, with a margin of (range - 1) / 2 of its longest side on each side.
  // NOTE Finer cascades are cubes around the camera, each one half the size of the next.
  // NOTE Power-of-two voxels and snapped bounds keep them stable when the camera moves.
  // NOTE Adds the values that change with the cascades to signature.
  updateProbeGrid(camera, signature) {
    const resolution = Three.MathUtils.clamp(Math.round(this.resolution), 2, frameEmissionMaxResolution);
    const cascades = Three.MathUtils.clamp(Math.round(this.cascades), 1, frameEmissionMaxCascades);

    this.probeResolution = resolution;

    gridBox.makeEmpty();

    for (let i = 0; i < this.emitterCount; i++) {
      gridBox.union(this.emitters[i].worldBox);
    }

    gridBox.getCenter(this.probeCenter);
    gridBox.getSize(boxSize);
    gridBox.expandByScalar((Math.max(boxSize.x, boxSize.y, boxSize.z) * Math.max(0.0, this.range - 1.0)) / 2.0);
    gridBox.getSize(boxSize).max(corner.set(1e-6, 1e-6, 1e-6));

    const lastSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
    const fineHalfSize = Math.min(this.distance, lastSize / 2.0);

    cameraPosition.setFromMatrixPosition(camera.matrixWorld);

    let count = 0;

    for (let cascade = 0; cascade < cascades - 1; cascade++) {
      const halfSize = fineHalfSize / Math.pow(2.0, cascades - 1 - cascade);
      const voxel = Math.pow(2.0, Math.ceil(Math.log2((halfSize * 2.0) / (resolution - 1))));
      const size = voxel * resolution;

      ['x', 'y', 'z'].forEach((axis) => {
        cascadeBox.min[axis] = Math.floor((cameraPosition[axis] - halfSize) / voxel) * voxel;
        cascadeBox.max[axis] = cascadeBox.min[axis] + size;
      });

      // NOTE A fine cascade with no emitter light in it, or not finer than the last cascade, is not used
      if (size >= lastSize || !cascadeBox.intersectsBox(gridBox)) {
        continue;
      }

      this.cascadeMin[count].copy(cascadeBox.min);
      this.cascadeSize[count].set(size, size, size);
      count++;
    }

    this.cascadeMin[count].copy(gridBox.min);
    this.cascadeSize[count].copy(boxSize);
    this.cascadeCount = count + 1;

    signature.push(resolution);

    for (let i = 0; i < this.cascadeCount; i++) {
      const min = this.cascadeMin[i];
      const size = this.cascadeSize[i];

      signature.push(min.x, min.y, min.z, size.x, size.y, size.z);
    }
  }

  // NOTE Returns the changed volumes as { emitter, slot }, or null when the probes stay the same.
  // NOTE Slots grow to the next power of two. New targets are empty, so all volumes draw again.
  prepareProbes(scene, camera) {
    this.collectEmitters(scene);

    if (this.emitterCount > this.slotCount) {
      this.slotCount = Math.pow(2, Math.ceil(Math.log2(this.emitterCount)));
      this.slotSignatures.length = 0;
      this.resizeSlots();
    }

    const { changed, changedEntries, slotSignatures } = this;

    changed.length = 0;

    for (let i = 0; i < this.emitterCount; i++) {
      const emitter = this.emitters[i];

      if (slotSignatures[i] && sameValues(slotSignatures[i], emitter.signature)) {
        continue;
      }

      if (!slotSignatures[i]) {
        slotSignatures[i] = [];
      }

      slotSignatures[i].length = 0;
      pushElements(slotSignatures[i], emitter.signature);

      if (!changedEntries[changed.length]) {
        changedEntries[changed.length] = { emitter: null, slot: 0 };
      }

      const entry = changedEntries[changed.length];

      entry.emitter = emitter;
      entry.slot = i;
      changed.push(entry);
    }

    if (this.emitterCount === 0) {
      this.probeSignature.length = 0;

      return null;
    }

    const signature = this.nextProbeSignature;

    signature.length = 0;
    signature.push(this.emitterCount);
    this.updateProbeGrid(camera, signature);

    if (changed.length === 0 && sameValues(signature, this.probeSignature)) {
      return null;
    }

    this.nextProbeSignature = this.probeSignature;
    this.probeSignature = signature;

    return changed;
  }

  dispose() {
    this.slotSignatures.length = 0;
    this.slotCount = 0;
    this.probeSignature.length = 0;
  }
}

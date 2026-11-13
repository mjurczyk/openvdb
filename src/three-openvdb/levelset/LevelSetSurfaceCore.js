import * as Three from 'three';
import { createLevelSetDistance, runInSlices } from './levelSetDistance.js';

// NOTE Shared code of LevelSetSurface (webgpu/ and webgl/). The material traces the distance texture on the GPU.
// The box of the grid is the geometry. Local space is the world space of the grid.
// material: a backend material with setDistance( texture, bbox, background ).
export class LevelSetSurfaceCore extends Three.Mesh {
  isLevelSetSurface = true;
  cancel = null;
  distanceTexture = null;

  constructor(
    source,
    material,
    {
      // NOTE GridDescriptor only: texels on the longest box side
      resolution = 200,
    } = {},
    onConverted,
  ) {
    super(new Three.BufferGeometry(), material);

    this.levelSetSource = source;
    this.resolution = resolution;
    this.onConverted = onConverted;

    this.update();
  }

  // NOTE Reads the source again. WVDBVolumeData calls it when a new LOD arrives.
  update() {
    this.cancel?.();
    this.cancel = null;

    if (!this.levelSetSource) {
      return;
    }

    const distance = createLevelSetDistance(this.levelSetSource, { resolution: this.resolution });

    // NOTE World box of the source grid
    this.bbox = distance.bbox;

    // NOTE The box is known at once. Until the texels are ready, one outside texel draws nothing.
    if (!this.distanceTexture) {
      this.setDistance({
        ...distance,
        data: new Uint8Array([255]),
        dimensions: new Three.Vector3(1, 1, 1),
      });
    }

    const onDone = () => {
      this.cancel = null;
      this.setDistance(distance);

      // NOTE The texture keeps the sampled data. Release the parsed VDB, as VDBAnimationLoader does.
      if (distance.task) {
        this.levelSetSource = null;
      }

      this.onConverted?.(this);
    };

    if (distance.task) {
      this.cancel = runInSlices(distance.task, onDone);
    } else {
      onDone();
    }
  }

  setDistance({ data, dimensions, bbox, background }) {
    const previous = this.distanceTexture;
    const { image } = previous || {};
    const resized =
      !previous ||
      image.width !== dimensions.x ||
      image.height !== dimensions.y ||
      image.depth !== dimensions.z;

    if (resized) {
      const texture = new Three.Data3DTexture(data, dimensions.x, dimensions.y, dimensions.z);

      texture.format = Three.RedFormat;
      texture.minFilter = Three.LinearFilter;
      texture.magFilter = Three.LinearFilter;
      texture.unpackAlignment = 1;
      texture.needsUpdate = true;

      this.distanceTexture = texture;
      previous?.dispose();
    } else {
      previous.image.data = data;
      previous.needsUpdate = true;
    }

    // NOTE The geometry is the box of the grid. It changes only with the box.
    if (!this.geometryBox?.equals(bbox)) {
      const size = bbox.getSize(new Three.Vector3());
      const center = bbox.getCenter(new Three.Vector3());
      const geometry = new Three.BoxGeometry(size.x, size.y, size.z).translate(
        center.x,
        center.y,
        center.z,
      );

      this.geometry.dispose();
      this.geometry.copy(geometry);
      geometry.dispose();
      this.geometryBox = bbox.clone();
    }

    this.material.setDistance(this.distanceTexture, bbox, background);
  }

  // NOTE A mesh at another place, with the same geometry, material and shadow flags
  createInstance() {
    return this.applyToInstance(new Three.Mesh());
  }

  // NOTE Makes a mesh show this surface. FrameVolume instances use it for each new frame.
  applyToInstance(instance) {
    instance.geometry = this.geometry;
    instance.material = this.material;
    instance.castShadow = this.castShadow;
    instance.receiveShadow = this.receiveShadow;

    return instance;
  }

  dispose() {
    this.cancel?.();
    this.cancel = null;
    this.geometry.dispose();
    this.material.dispose();
    this.distanceTexture?.dispose();
  }
}

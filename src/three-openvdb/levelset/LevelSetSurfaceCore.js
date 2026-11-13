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
    // NOTE Hidden until the first distance texture is ready
    this.visible = false;

    this.update();
  }

  // NOTE Reads the source again. WVDBVolumeData calls it when a new LOD arrives.
  update() {
    this.cancel?.();
    this.cancel = null;

    const distance = createLevelSetDistance(this.levelSetSource, { resolution: this.resolution });

    // NOTE World box of the source grid
    this.bbox = distance.bbox;

    const onDone = () => {
      this.cancel = null;
      this.setDistance(distance);
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

    // NOTE The geometry is the box of the grid
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

    this.material.setDistance(this.distanceTexture, bbox, background);
    this.visible = true;
  }

  // NOTE A mesh at another place, with the same geometry and material
  createInstance() {
    return new Three.Mesh(this.geometry, this.material);
  }

  dispose() {
    this.cancel?.();
    this.cancel = null;
    this.geometry.dispose();
    this.material.dispose();
    this.distanceTexture?.dispose();
  }
}

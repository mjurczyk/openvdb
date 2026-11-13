import * as Three from 'three';
import { createLevelSetDistance, runInSlices } from './levelSetDistance.js';
import { polygonize } from './marchingCubes.js';

// NOTE Surface of a level set as a triangle mesh (marching cubes). It works with all three.js materials.
// source: a level set GridDescriptor, or a level set grid of WVDBVolumeData. Then call volumeData.attach( mesh ).
export class LevelSetMesh extends Three.Mesh {
  isLevelSetMesh = true;
  cancel = null;

  constructor(
    source,
    {
      material,
      // NOTE GridDescriptor only: texels on the longest box side
      resolution = 200,
    } = {},
    onConverted,
  ) {
    super(new Three.BufferGeometry(), material || new Three.MeshStandardMaterial());

    // NOTE dispose() frees only the default material. The caller owns other materials.
    this.ownMaterial = material ? null : this.material;
    this.levelSetSource = source;
    this.resolution = resolution;
    this.onConverted = onConverted;

    this.update();
  }

  // NOTE Builds the mesh again from the source. WVDBVolumeData calls it when a new LOD arrives.
  update() {
    this.cancel?.();

    const distance = createLevelSetDistance(this.levelSetSource, { resolution: this.resolution });

    // NOTE World box of the source grid
    this.bbox = distance.bbox;

    const build = () => {
      this.cancel = runInSlices(polygonize(distance), (surface) => {
        this.cancel = null;
        this.setSurface(surface);
        this.onConverted?.(this);
      });
    };

    if (distance.task) {
      this.cancel = runInSlices(distance.task, build);
    } else {
      build();
    }
  }

  // NOTE The geometry object stays the same, so instances keep it. dispose() frees the old GPU buffers.
  setSurface({ positions, normals, indices }) {
    const { geometry } = this;

    geometry.dispose();
    geometry.setAttribute('position', new Three.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new Three.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  // NOTE A mesh at another place, with the same geometry and material
  createInstance() {
    return new Three.Mesh(this.geometry, this.material);
  }

  dispose() {
    this.cancel?.();
    this.cancel = null;
    this.geometry.dispose();
    this.ownMaterial?.dispose();
  }
}

import * as Three from 'three';
import { PrimitiveVolume } from 'openvdb';
import { MeshVolumeBVH } from './MeshVolumeBVH.js';

// NOTE Fixed, not axis-aligned directions. Grid-aligned meshes seldom put an edge or vertex on these rays.
const rayDirections = [
  new Three.Vector3(1.0, 0.3127, 0.1931).normalize(),
  new Three.Vector3(-0.2713, 1.0, 0.4119).normalize(),
  new Three.Vector3(0.1789, -0.3557, 1.0).normalize(),
];

export class MeshVolume extends PrimitiveVolume {
  mesh = new Three.Object3D();

  constructor(mesh) {
    super('MeshVolume');

    const meshClone = mesh.clone();
    const vertex = new Three.Vector3();
    const positions = [];

    meshClone.position.setScalar(0.0, 0.0, 0.0);
    meshClone.scale.setScalar(1.0);
    meshClone.quaternion.identity();
    meshClone.updateMatrixWorld(true);

    // NOTE One position-only triangle list for all meshes. Indexed, interleaved and quantized geometries can mix.
    meshClone.traverse((child) => {
      if (!child.isMesh || !child.geometry) {
        return;
      }

      const position = child.geometry.getAttribute('position');
      const index = child.geometry.getIndex();
      const count = index ? index.count : position.count;

      for (let i = 0; i < count; i++) {
        vertex
          .fromBufferAttribute(position, index ? index.getX(i) : i)
          .applyMatrix4(child.matrixWorld);

        positions.push(vertex.x, vertex.y, vertex.z);
      }
    });

    const meshGeometry = new Three.BufferGeometry();
    meshGeometry.setAttribute('position', new Three.Float32BufferAttribute(positions, 3));

    this.bvh = new MeshVolumeBVH(meshGeometry.getAttribute('position').array);

    this.mesh = new Three.Mesh(
      meshGeometry,
      new Three.MeshBasicMaterial({ side: Three.DoubleSide })
    );

    this.cacheMeshGeometry();
  }

  bbox = null;
  center = null;
  size = null;

  bvh = null;
  hitEpsilon = 0.0;
  origin = new Three.Vector3();
  distances = [];

  cacheMeshGeometry() {
    this.bbox = new Three.Box3();
    this.bbox.expandByObject(this.mesh);

    this.center = new Three.Vector3();
    this.size = new Three.Vector3();

    this.bbox.getCenter(this.center);
    this.bbox.getSize(this.size);

    const maxModelSpan = Math.max(this.size.x, this.size.y, this.size.z);
    const sizeNormalization = new Three.Vector3().copy(this.size).divideScalar(maxModelSpan);

    // NOTE Models can have various real aspect ratios - normalize the volumetric sampler to avoid model stretching
    this.size.divide(sizeNormalization);

    // NOTE Add padding to avoid edge glitches
    this.size.addScalar(0.1);

    this.hitEpsilon = maxModelSpan * 1e-6;
  }

  // NOTE Hits at the same distance are one crossing. A ray through a shared edge hits two triangles.
  isInsideAlong(direction) {
    const distances = this.bvh
      .raycast(this.origin, direction, this.distances)
      .sort((a, b) => a - b);

    let crossings = 0;
    let lastDistance = -Infinity;

    distances.forEach((distance) => {
      if (distance - lastDistance > this.hitEpsilon) {
        crossings++;
      }

      lastDistance = distance;
    });

    return crossings % 2 === 1;
  }

  // NOTE Three rays vote, so one bad parity (hole, grazing hit) does not change the result
  getValue(position) {
    this.origin.copy(position).multiply(this.size).add(this.center);

    const first = this.isInsideAlong(rayDirections[0]);
    const second = this.isInsideAlong(rayDirections[1]);

    if (first === second) {
      return first ? 1.0 : 0.0;
    }

    return this.isInsideAlong(rayDirections[2]) ? 1.0 : 0.0;
  }
}

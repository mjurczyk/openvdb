import * as Three from 'three';
import { floatType } from '../../math/memory';
import { GridDescriptor } from '../../core/GridDescriptor';
import { Vector3 } from '../../math/vector';
import { GridTransform } from '../../core/GridTransform';
import { getUuid } from '../uuid';

export class MeshVolume extends GridDescriptor {
  static halfFloatGridPrefix = GridDescriptor.halfFloatGridPrefix;

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;

  mesh = new Three.Object3D();

  constructor(mesh) {
    super();

    // NOTE Primitives don't need to use OpenVDBReader - just "read grid" right away
    this.readGrid();
    this.mesh = mesh.clone();

    this.mesh.traverse((child) => {
      if (child.material) {
        child.material = new Three.MeshBasicMaterial({ color: 0xff00ff, side: Three.DoubleSide });
      }
    });

    this.cacheMeshGeometry();
  }

  readGrid() {
    this.readGridHeader();
    this.readGridTransform();
  }

  readGridHeader() {
    this.uniqueName = `MeshVolume#${getUuid()}`;
    this.gridName = this.uniqueName.split('#')[0];
    this.gridType = 'fog volume';
  }

  readCompression() {
    /* NOTE Unnecessary */
  }

  readMetadata() {
    /* NOTE Unnecessary */
  }

  getGridValueType() {
    return floatType;
  }

  getGridClass() {
    return 'fog volume';
  }

  readGridTransform() {
    this.transform = new GridTransform();
  }

  readTopology() {
    /* NOTE Unnecessary */
  }

  getWorldBbox() {
    return this.getLocalBbox();
  }

  getLocalBbox() {
    return [new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)];
  }

  getPreciseWorldBbox() {
    return this.getWorldBbox();
  }
  
  bbox = null;
  center = null;
  size = null;

  target = new Three.Vector3(0.0, 0.0, 0.0);
  raycaster = new Three.Raycaster();
  rayDirection = new Three.Vector3(1.0, 0.0, 0.0);

  cacheMeshGeometry() {
    this.bbox = new Three.Box3();
    this.bbox.expandByObject(this.mesh);

    this.center = new Three.Vector3();
    this.size = new Three.Vector3();

    this.bbox.getCenter(this.center);
    this.bbox.getSize(this.size);
    this.size.addScalar(0.1); // NOTE Add padding to avoid edge glitches

    this.raycaster.near = -0.01;
    this.raycaster.far = 1.0; // NOTE We can assume this since the output volume is always 1x1x1
  }

  getValue(position) {
    this.target.copy(position).multiply(this.size).add(this.center);
    this.rayDirection.copy(position).normalize();
    this.raycaster.set(this.target, this.rayDirection);

    const hits = this.raycaster.intersectObject(this.mesh, true);
    
    return (hits.length === 0 || hits.length % 2 === 0) ? 0.0 : 1.0;
  }

  getLeafAt(position) {
    return null;
  }
}

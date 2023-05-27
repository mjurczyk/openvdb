import * as Three from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
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
    
    const meshClone = mesh.clone();
    const geometries = [];
    const transform = new Three.Vector3();
    const transformQuaternion = new Three.Quaternion();

    meshClone.position.setScalar(0.0, 0.0, 0.0);
    meshClone.scale.setScalar(1.0);
    meshClone.quaternion.identity();

    meshClone.updateMatrix();
    meshClone.updateMatrixWorld();
    meshClone.updateWorldMatrix();

    meshClone.traverse((child) => {
      if (child.geometry) {
        const geometry = child.geometry.clone();

        child.getWorldQuaternion(transformQuaternion);
        geometry.applyQuaternion(transformQuaternion);

        child.getWorldScale(transform);
        geometry.scale(transform.x, transform.y, transform.z);

        child.getWorldPosition(transform);
        geometry.translate(transform.x, transform.y, transform.z);

        geometry.attributes = {
          position: geometry.attributes.position,
          normal: geometry.attributes.normal,
        };

        geometries.push(geometry);
      }
    });

    // NOTE Merge all geometries into a single mesh to avoid raycasting tons of separate objects
    const meshGeometry = BufferGeometryUtils.mergeVertices(
      BufferGeometryUtils.mergeBufferGeometries(geometries, false)
    );

    this.mesh = new Three.Mesh(
      meshGeometry,
      new Three.MeshNormalMaterial({ side: Three.DoubleSide })
    );

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

    const maxModelSpan = Math.max(this.size.x, this.size.y, this.size.z);
    const sizeNormalization = new Three.Vector3().copy(this.size).divideScalar(maxModelSpan);

    // NOTE Models can have various real aspect ratios - normalize the volumetric sampler to avoid model stretching
    this.size.divide(sizeNormalization);

    // NOTE Add padding to avoid edge glitches
    this.size.addScalar(0.1);

    this.raycaster.near = -0.01;
    this.raycaster.far = 1.0; // NOTE We can assume this since the output volume is always 1x1x1
  }

  getValue(position) {
    this.target.copy(position).multiply(this.size).add(this.center);
    this.rayDirection.copy(position).normalize();
    this.raycaster.set(this.target, this.rayDirection);

    const hits = this.raycaster.intersectObjects([ this.mesh ], true);
    
    return (hits.length === 0 || hits.length % 2 === 0) ? 0.0 : 1.0;
  }

  getLeafAt(position) {
    return null;
  }
}

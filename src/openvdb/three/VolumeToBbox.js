import * as Three from 'three';
import { Bbox } from '../math/bbox';

const sampleColors = [0xff0000, 0x00ff00, 0x0000ff];

export class VolumeToBbox extends Three.Group {
  constructor(source) {
    super();

    let grids;

    if (source instanceof Array) {
      // NOTE Treat first argument as set of grids
      grids = source;
    } else if (typeof source.grids !== 'undefined') {
      // NOTE Treat first argument as VDB source
      grids = Object.values(source.grids);
    } else {
      // NOTE Hope for the best
      grids = [source];
    }

    // NOTE Convert each VDB grid to a set of instanced bounding boxes
    // REF Instancing https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_dynamic.html#L118
    const mock = new Three.Object3D();
    const bbox = new Bbox();

    Object.values(grids).forEach((grid, index) => {
      const instancedMesh = new Three.InstancedMesh(
        new Three.BoxGeometry(1.0, 1.0, 1.0),
        new Three.MeshBasicMaterial({
          wireframe: true,
          color: sampleColors[index],
          transparent: true,
          opacity: 0.1,
        }),
        grid.leavesCount
      );
      let instanceId = 0;

      const traverseVDB = (node) => {
        if (node.isLeaf()) {
          bbox.set(...grid.getWorldBbox(node));

          bbox.getCenter(mock.position);
          bbox.getSize(mock.scale);

          mock.updateMatrix();
          instancedMesh.setMatrixAt(instanceId++, mock.matrix);
        }

        if (node.childMask?.countOn() > 0) {
          node.childMask.forEachOn(({ offset }) => {
            traverseVDB(node.table[offset]);
          });
        }
      };

      grid.root.table.forEach((node) => traverseVDB(node));

      this.add(instancedMesh);
    });
  }
}

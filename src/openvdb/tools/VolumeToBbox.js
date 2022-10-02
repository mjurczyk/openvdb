import { Bbox } from '../math/bbox';

export class VolumeToBbox {
  static convert(vdb, callback) {
    Object.values(vdb.grids).forEach(grid => {
      const bbox = new Bbox();

      const traverseVDB = (node) => {
        if (node.isLeaf()) {
          bbox.set(...grid.getWorldBbox(node));

          callback(bbox);
        }

        if (node.childMask?.countOn() > 0) {
          node.childMask.forEachOn(({ offset }) => {
            traverseVDB(node.table[offset]);
          });
        }
      };

      grid.root.table.forEach(node => traverseVDB(node));
    });
  }
}

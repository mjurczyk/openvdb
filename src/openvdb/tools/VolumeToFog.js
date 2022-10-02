import { Bbox } from '../math/bbox';

export class VolumeToFog {
  static convert(vdb, callback) {
    Object.values(vdb.grids).forEach(grid => {
      const bbox = new Bbox();

      const traverseVDB = (node) => {
        if (node.isLeaf() && node.valueMask.countOn() !== 0) {
          bbox.set(...grid.getWorldBbox(node));

          callback({ bbox, data: node.values, size: node.dim });
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

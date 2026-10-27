// NOTE Node sizes of a tree. Grid types have the form Tree_<value type>_<log2 dims>, root child first, leaf last.
export class TreeLayout {
  static defaultLog2Dims = [5, 4, 3];

  static fromGridType(gridType) {
    const [, log2dims] = gridType.match(/^Tree_.+?((?:_\d+)+)$/) || [];

    return new TreeLayout(
      log2dims ? log2dims.split('_').slice(1).map(Number) : TreeLayout.defaultLog2Dims
    );
  }

  constructor(log2dims) {
    this.log2dims = log2dims;
    this.leafDepth = log2dims.length - 1;
    this.leafLog2Dim = log2dims[this.leafDepth];

    // NOTE Log2 of the node extent in voxels, for each depth
    this.totals = log2dims.map((_, depth) =>
      log2dims.slice(depth).reduce((total, next) => total + next, 0)
    );

    // NOTE Extent of a root child, also of a root tile
    this.rootChildLog2Dim = this.totals[0];
    this.rootChildDim = 1 << this.rootChildLog2Dim;
  }
}

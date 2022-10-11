export class Accessor {
  stack = [];
  grid = null;

  constructor(grid) {
    this.grid = grid;
  }

  getValue(position) {
    return this.probeValues(position);
  }

  getLeafAt(position) {
    return this.probeLeaves(position);
  }

  probeValues(position) {
    if (this.stack.length) {
      const cachedNode = this.stack.pop();

      if (cachedNode.contains(position)) {
        return cachedNode.getValue(position, this);
      }
    } else {
      return this.grid.root.getValue(position, this);
    }

    return this.probeValues(position);
  }

  probeLeaves(position) {
    if (this.stack.length) {
      const cachedNode = this.stack.pop();

      if (cachedNode.contains(position)) {
        return cachedNode.getLeafAt(position, this);
      }
    } else {
      return this.grid.root.getLeafAt(position, this);
    }

    return this.probeLeaves(position);
  }

  cache(node) {
    this.stack.push(node);
  }
}

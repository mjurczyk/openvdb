export class Accessor {
  stack = [];
  grid = null;

  constructor(grid) {
    this.grid = grid;
  }

  getValue(position) {
    return this.probe(position, 'getValue');
  }

  getLeafAt(position) {
    return this.probe(position, 'getLeafAt');
  }

  isActive(position) {
    return this.probe(position, 'isActive');
  }

  probe(position, method) {
    if (this.stack.length) {
      const cachedNode = this.stack.pop();

      if (cachedNode.contains(position)) {
        return cachedNode[method](position, this);
      }
    } else {
      return this.grid.root[method](position, this);
    }

    return this.probe(position, method);
  }

  cache(node) {
    this.stack.push(node);
  }
}

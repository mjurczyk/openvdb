export class Accessor {
  stack = [];
  grid = null;

  constructor(grid) {
    this.grid = grid;
  }

  getValue(position) {
    const positionKey = JSON.stringify(position);

    return this.probeValues(positionKey, position);
  }

  probeValues(positionKey, position) {
    if (this.stack.length) {
      const cachedNode = this.stack.pop();

      if (cachedNode.contains(position)) {
        return cachedNode.getValue(positionKey, position, this);
      }
    } else {
      return this.grid.root.getValue(positionKey, position, this);
    }

    return this.probeValues(positionKey, position);
  }

  cache(node) {
    this.stack.push(node);
  }
}

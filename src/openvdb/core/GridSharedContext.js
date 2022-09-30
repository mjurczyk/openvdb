export class GridSharedContext {
  // NOTE Buffer
  bufferIterator = null;

  // NOTE GridCompression
  compression = null;

  // NOTE GridVersion
  version = null;

  // NOTE Grid value settings
  valueType = null;
  useHalf = null;

  static tagContext(target, context) {
    target.sharedContext = context;
  }

  static passContext(from, to) {
    to.sharedContext = from.sharedContext;
  }

  static cleanContext(target) {
    delete target.sharedContext;
  }

  static getContext(target) {
    return target.sharedContext;
  }

  static assert(target) {
    if (!target.sharedContext) {
      console.error('GridSharedContext', 'assert', 'expected GridSharedContext to exist', { target });
      throw 0;
    }
  }
}

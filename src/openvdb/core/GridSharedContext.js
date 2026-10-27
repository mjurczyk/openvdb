export class GridSharedContext {
  // NOTE Buffer
  bufferIterator = null;

  // NOTE GridCompression
  compression = null;

  // NOTE GridVersion
  version = null;

  // NOTE Files without grid offsets must be read in order
  hasGridOffsets = null;

  // NOTE Read only grid headers, metadata and transforms. Trees are not read.
  metadataOnly = false;

  // NOTE Grid value settings
  valueType = null;
  useHalf = null;
  treeLayout = null;

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
      console.error('GridSharedContext', 'assert', 'expected GridSharedContext to exist', {
        target,
      });
      throw 0;
    }
  }
}

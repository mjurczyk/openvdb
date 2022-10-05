import { Zlib, Blosc } from '../dependencies';

class CompressionClass {
  blosc = null;
  zlib = null;

  async prepareModules() {
    // NOTE Run BLOSC on empty array to preemtively compile async modules
    this.blosc = new Blosc();
    await this.blosc.prepare();

    this.zlib = new Zlib();
  }
}

export const Compression = new CompressionClass();

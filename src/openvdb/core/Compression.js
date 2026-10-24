import { Zlib, Blosc } from '../dependencies';

// NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/io/Compression.h
export const compressionMetadata = {
  noMaskOrInactiveVals: 0,
  noMaskAndMinusBg: 1,
  noMaskAndOneInactiveVal: 2,
  maskAndNoInactiveVals: 3,
  maskAndOneInactiveVal: 4,
  maskAndTwoInactiveVals: 5,
  noMaskAndAllVals: 6,
};

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

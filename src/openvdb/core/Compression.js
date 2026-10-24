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

export const compressionFlags = {
  none: 0x0,
  zip: 0x1,
  activeMask: 0x2,
  blosc: 0x4,
};

export const parseCompressionFlags = (flags) => ({
  none: flags === compressionFlags.none,
  zip: (flags & compressionFlags.zip) !== 0,
  activeMask: (flags & compressionFlags.activeMask) !== 0,
  blosc: (flags & compressionFlags.blosc) !== 0,
});

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

import { Zlib, Blosc } from '../dependencies.js';

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
  modulesReady = null;

  // NOTE Make modules one time. Later and concurrent reads use the same promise. On failure, clear the promise so the next read tries again.
  prepareModules() {
    if (!this.modulesReady) {
      this.modulesReady = (async () => {
        const blosc = new Blosc();
        await blosc.prepare();

        this.blosc = blosc;
        this.zlib = new Zlib();
      })().catch((error) => {
        this.modulesReady = null;

        throw error;
      });
    }

    return this.modulesReady;
  }
}

export const Compression = new CompressionClass();

# OpenVDB

This project indirectly ports OpenVDB file format and tools to JavaScript, TypeScript, and Node.
Specific 3D library implementations can be found in sub-directories.

## What is OpenVDB

VDB is a volumetric data format originally implemented in C++ ([AcademySoftwareFoundation/openvdb](https://github.com/AcademySoftwareFoundation/openvdb).) It allows to efficiently store voxel structures of this like smoke, fire, and fluid simulations - as well as normal 3D models converted to voxels.

Keep in mind that, due to memory-access and multithreading limitations of JS, this repo may be more similar to a read-only [NanoVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb/nanovdb), instead of the original OpenVDB. Code is nevertheless based on original [OpenVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb).

## Usage

### With three.js

// TODO

### With Babylon.js

// TODO

### Without library

## Credits

To avoid re-coding same things over again, parts of the library may be based / taken directly from the following:

* [gkjohnson/three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh): BVH implementation
* [nodeca/pako](https://github.com/issues): ZIP compression

Be sure to ⭐️ those!

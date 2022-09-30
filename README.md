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

## Current Feature Support

Based on files hosted on [https://www.openvdb.org/download/](https://www.openvdb.org/download/).
  
| Model | Support | Notes |
| - | - | - |
| armadillo.vdb | ✅ Yes  | |
| buddha.vdb | ✅ Yes | |
| bunny.vdb | ✅ Yes | |
| bunny_cloud.vdb | ✅ Yes | |
| crawler.vdb | ❓ Partial | Loads ok, fails to render (Three.js) due to array memory limits |
| cube.vdb | ✅ Yes | |
| dragon.vdb | ✅ Yes | Long loading time |
| emu.vdb | ❓ Partial | Loads ok, fails to render (Three.js) due to array memory limits |
| explosion.vdb | ❌ No | Multi-grid VDB |
| fire.vdb | ❌ No | Multi-grid VDB |
| icosahedron.vdb | ✅ Yes | |
| iss.vdb | ❓ Partial | Loads ok, fails to render (Three.js) due to array memory limits |
| smoke1.vdb | ❓ Partial | Fog volume not implemented yet |
| smoke2.vdb | ❌ No | Multi-grid VDB |
| space.vdb | ❌ No | Failed to fetch due to file size, requires streaming |
| sphere.vdb | ✅ Yes | |
| torus.vdb | ✅ Yes | |
| torus_knot.vdb | ✅ Yes | |
| utahteapot.vdb | ✅ Yes | |
| venusstatue.vdb | ✅ Yes | |
| boat_points.vdb | ❌ No | Failed to fetch due to file size, requires streaming |
| bunny_points.vdb | ❌ No | Failed to fetch due to file size, requires streaming |
| sphere_points.vdb | ❌ No | Unsupported value type ptdataidx32 |
| waterfall_points.vdb | ❌ No | Unsupported value type ptdataidx32 |

## Credits

To avoid re-coding same things over again, parts of the library may be based / taken directly from the following:

* [gkjohnson/three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh): BVH implementation
* [nodeca/pako](https://github.com/issues): ZIP compression

Be sure to ⭐️ those!

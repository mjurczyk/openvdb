<a href="https://mjurczyk.github.io/openvdb/" target="_blank">
  <img width="100%" src="https://github.com/user-attachments/assets/169a5c74-8e46-4008-a28a-fa615befd5f7" title="OpenVDB - Web implementation of volumetric grids" />
</a>



# OpenVDB

> [!NOTE]
> WVDB (`.wvdb`) is a live proposal. The format can change. See the [WebVDB format specification](src/docs/wvdb/README.md).

> [!TIP]
> Convert `.vdb` files to `.wvdb` before you use them on the web: `npx webvdb explosion.vdb` (or `npm install -g webvdb`, then `wvdb explosion.vdb`). A `.wvdb` file is much smaller.

This project ports the OpenVDB file format and tools to JavaScript and Node.

VDB is a volumetric data format, originally in C++ ([AcademySoftwareFoundation/openvdb](https://github.com/AcademySoftwareFoundation/openvdb)). It stores voxel data, for example smoke, fire and fluid simulations, or 3D models converted to voxels. Because of the memory and multithreading limits of JavaScript, this repository is closer to a read-only [NanoVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb/nanovdb). The code is based on [OpenVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb).

## Docs

- [`openvdb`](src/openvdb/README.md) - VDB reader, grids and helpers. No renderer.
- [`three-openvdb`](src/three-openvdb/README.md) - renderer setup, usage, `VDBLoader`, `VDBAnimationLoader`.
  - [Rendering frame](src/three-openvdb/frame/README.md) - `FrameVolume`, `FrameVolumeAnimation`, instances, medium presets, `frameRenderer.settings`, volume shadows, `FrameEmissionLight`.
  - [WVDB loaders](src/three-openvdb/wvdb/README.md) - `WVDBLoader`, `WVDBAnimationLoader`, `WVDBReader`.
  - [Level sets](src/three-openvdb/levelset/README.md) - `LevelSetMesh`, `LevelSetSurface`.
  - [Points](src/three-openvdb/points/README.md) - `VDBPoints`.
- [`webvdb`](src/wvdb/README.md) - `wvdb` CLI: converts `.vdb` files, folders and ZIP files into `.wvdb` files.
- [WebVDB format specification](src/docs/wvdb/README.md)
- [Examples](src/docs/examples/README.md) - build and deploy of the examples site.

## Current Feature Support

Based on files hosted on [https://www.openvdb.org/download/](https://www.openvdb.org/download/).

| Model                | Support    | Notes                                                         |
| -------------------- | ---------- | ------------------------------------------------------------- |
| armadillo.vdb        | ✅ Yes     |                                                               |
| buddha.vdb           | ✅ Yes     |                                                               |
| bunny.vdb            | ✅ Yes     |                                                               |
| bunny_cloud.vdb      | ✅ Yes     |                                                               |
| crawler.vdb          | ✅ Yes     |                                                               |
| cube.vdb             | ✅ Yes     |                                                               |
| dragon.vdb           | ✅ Yes     |                                                               |
| emu.vdb              | ✅ Yes     |                                                               |
| explosion.vdb        | ✅ Yes     |                                                               |
| fire.vdb             | ✅ Yes     |                                                               |
| icosahedron.vdb      | ✅ Yes     |                                                               |
| iss.vdb              | ✅ Yes     |                                                               |
| smoke1.vdb           | ✅ Yes     |                                                               |
| smoke2.vdb           | ✅ Yes     |                                                               |
| space.vdb            | ✅ Yes     |                                                               |
| sphere.vdb           | ✅ Yes     |                                                               |
| torus.vdb            | ✅ Yes     |                                                               |
| torus_knot.vdb       | ✅ Yes     |                                                               |
| utahteapot.vdb       | ✅ Yes     |                                                               |
| venusstatue.vdb      | ✅ Yes     |                                                               |
| boat_points.vdb      | ✅ Yes     |                                                               |
| bunny_points.vdb     | ✅ Yes     |                                                               |
| sphere_points.vdb    | ✅ Yes     |                                                               |
| waterfall_points.vdb | ✅ Yes     |                                                               |

## Development

```
git clone https://github.com/mjurczyk/openvdb
cd ./openvdb
npm install
npm run build
npm run dev
```

## Credits

To avoid re-coding same things over again, parts of the library may be based / taken directly from the following:

- [gkjohnson/three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh): BVH implementation
- [manzt/numcodecs.js](https://github.com/manzt/numcodecs.js/): BLOSC & ZLIB compression
  - [nodeca/pako](https://github.com/nodeca/pako): ZLIB compression

Be sure to ⭐️ those!

Example sequence: Ground Explosion by [JangaFX](https://jangafx.com) ([EmberGen](https://jangafx.com/software/embergen/)), CC0. More free VDBs: [jangafx.com](https://jangafx.com/software/embergen/download/free-vdb-animations/).

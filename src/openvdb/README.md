# openvdb

OpenVDB file reader and volume math in JavaScript. No dependencies, no renderer.

- `loadVDB( url )`, `OpenVDBReader` - read `.vdb` files. Grids have `getValue( position )` and `isActive( position )`. `reader.read( bytes, { metadataOnly: true } )` reads only grid metadata and transforms, not the trees. `reader.read( bytes, { topologyOnly: true } )` also reads the tree topology (active voxels), but not the leaf values. `grid.evalActiveVoxelBoundingBox()` gives the index box of the active voxels from the tree (`null` when no voxel is active). `grid.getPreciseWorldBbox()` uses it when the tree is read, and the `file_bbox_min` / `file_bbox_max` metadata only without a tree.
- `perlin3Noise`, `simplex3Noise`, `worley3Noise` - noise helpers.
- WVDB format helpers (`readWVDBHeader`, `encodeWVDBPage`, `decodeWVDBPage`, ...) - see `src/docs/wvdb/README.md`.

Rendering with three.js: `three-openvdb`. Streamed `.wvdb` files: `wvdb` (CLI, npm package `webvdb`) and the `.wvdb` loaders of `three-openvdb`.

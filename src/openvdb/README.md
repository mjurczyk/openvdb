# openvdb

OpenVDB file reader and volume math in JavaScript. No dependencies, no renderer.

- `loadVDB( url )`, `OpenVDBReader` - read `.vdb` files. Grids have `getValue( position )` and `isActive( position )`. `reader.read( bytes, { metadataOnly: true } )` reads only grid metadata and transforms (for example world boxes), not the trees.
- `CubeVolume`, `SphereVolume`, `CloudVolume`, `ParametricVolume` - procedural volumes with the same grid API.
- `perlin3Noise`, `simplex3Noise`, `worley3Noise` - noise helpers.
- WVDB format helpers (`readWVDBHeader`, `encodeWVDBPage`, `decodeWVDBPage`, ...) - see `src/docs/wvdb/README.md`.

Rendering with three.js: `three-openvdb`. Streamed `.wvdb` files: `wvdb` (CLI, npm package `webvdb`) and the `.wvdb` loaders of `three-openvdb`.

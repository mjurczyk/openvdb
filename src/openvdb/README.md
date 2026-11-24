# openvdb

OpenVDB file reader and volume math in JavaScript. No dependencies, no renderer.

```js
import * as OpenVDB from 'openvdb';

const reader = await OpenVDB.loadVDB('./assets/bunny.vdb');

Object.values(reader.grids).forEach((grid) => {
  const value = grid.getValue({ x: 0.0, y: 0.0, z: 1.0 });
});
```

## loadVDB

- `loadVDB( url ): Promise<OpenVDBReader>`

Loads a `.vdb` file and reads its grids. `reader.grids` is an object of `GridDescriptor`, keyed by `grid.uniqueName`. The promise rejects on network errors, HTTP errors (for example 404) and parse errors.

## OpenVDBReader

- `reader.read( bytes: Uint8Array, { metadataOnly, topologyOnly } ): Promise`
  - `metadataOnly: true` - only grid metadata and transforms, no trees.
  - `topologyOnly: true` - also the tree topology (active voxels), no leaf values.

## GridDescriptor

- `grid.getValue( position: { x, y, z } )` - voxel value: density for fog volumes, signed distance for level sets.
- `grid.isActive( position: { x, y, z } ): boolean`
- `grid.isLevelSet(): boolean`, `grid.isPointData(): boolean`
- `grid.evalActiveVoxelBoundingBox()` - index box of the active voxels, or `null` when no voxel is active.
- `grid.getPreciseWorldBbox()` - world box. From the tree when it is read, else from the `file_bbox_min` / `file_bbox_max` metadata.

## Helpers

- `perlin3Noise`, `simplex3Noise`, `worley3Noise` - noise.
- `sampleLevelSet( grid, { min, size, dimensions }, values )` - generator. Writes the dense signed distance of a level set to `values`. Texels that cross the surface use the mean of 4 × 4 × 4 samples.
- `getPointCount( grid )`, `createPointData( grid, { maxPoints } )` - points of a point data grid. `createPointData` returns `{ positions, colors, count, totalCount, stride, spacing, task }`. `positions` and `colors` are `Float32Array` (`colors` is `null` without `Cd`). They are full when the generator `task` is done.
- WVDB format helpers (`readWVDBHeader`, `encodeWVDBPage`, `decodeWVDBPage`, ...) - see the [WebVDB format specification](https://github.com/mjurczyk/openvdb/blob/main/src/docs/wvdb/README.md).

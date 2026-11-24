# Points

- `new VDBPoints( grid, { maxPoints, size, ...materialProps }, onConverted: ( points ) => void ): Three.Sprite | Three.Points`

A point data grid (`grid.isPointData()`) stores particles. `VDBPoints` shows them as round points. Positions come from the `P` attribute, colors from `Cd` (multiplied by `color`). Codecs: `null`, `trnc`, `fxpt8`, `fxpt16`, `ufxpt8` and `ufxpt16`. Other attributes are not read. The points are not lit and cast no shadows.

- `maxPoints: number` - (default: `4000000`) above it, every n-th point is used, and the points are larger by the cube root of n.
- `size: number` - point diameter in world units. Default: half the mean distance of the points. Never smaller than 1 pixel.
- `materialProps` - props of the material, for example `color` and `opacity`.

The decode runs in 12 ms steps, so the page does not freeze. `points.pointCount` is the number of points shown. `points.createInstance()` shows the same points at another place. `points.dispose()` frees the geometry and the material.

`three-openvdb` draws a `Three.Sprite` with one instance for each point (`PointsNodeMaterial`), because WebGPU points are 1 pixel. `three-openvdb/webgl` draws `Three.Points` (`PointsMaterial`).

A points grid of `WVDBVolumeData` (`grid.isPoints`) has the points of the LODs that are in.

```js
new OpenVDB.WVDBLoader().load('./assets/sphere_points.wvdb', (volumeData) => {
  const grid = Object.values(volumeData.grids).find(({ isPoints }) => isPoints);

  scene.add(volumeData.attach(new OpenVDB.VDBPoints(grid)));
});
```

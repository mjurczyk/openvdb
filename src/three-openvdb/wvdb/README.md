# WVDB loaders

A `.wvdb` file streams in LODs: a coarse LOD shows first, and each finer LOD replaces it while the download continues. Make `.wvdb` files with the [`wvdb` CLI](../../wvdb/README.md). Format: [WebVDB format specification](../../docs/wvdb/README.md).

## WVDBLoader

- `new WVDBLoader( manager: Three.LoadingManager )`
- `setMaxLod( lod: number ): WVDBLoader` - the download stops after this LOD.
- `setGridScales( scales: { [gridName]: number } ): WVDBLoader` - grid values divide by the scale before they become density, for example `{ flames: 6.0 }`.
- `load( url, onLoad, onProgress, onError ): WVDBVolumeData`

`onLoad( volumeData )` is called when all grids show LOD 0. `onProgress({ lod, lods, lodComplete, done, bytesLoaded, bytesTotal })` is called after each update.

`WVDBVolumeData`:

- `grids[name]` - the grids of the newest LOD:
  - `data: Uint8Array` - texels: density, or RGBA when `isColor`.
  - `dimensions: [x, y, z]`, `resolution` (texels on the longest side), `bbox: Three.Box3`, `lod`.
  - `isLevelSet`, `isColor`. Level sets also have `distance: Uint8Array` (signed distance texels) and `background` (band width).
  - Points grids have `isPoints`, `positions`, `colors`, `count` and `spacing` instead.
- `attach( object )` - the object follows each new LOD: `FrameVolume` (textures), `LevelSetMesh` (build), `LevelSetSurface` or `VDBPoints`. Returns the object.
- `detach( object )` - the object stops following new LODs.
- `dispose()` - stops the download.

Use `data` and `dimensions` as `FrameVolume` raw data, also for `emissiveGrid` and `baseColorGrid`.

## WVDBAnimationLoader

- `new WVDBAnimationLoader( manager: Three.LoadingManager )`
- `setOptions( props ): WVDBAnimationLoader` - `FrameVolume` props of all frames. `emissiveGrid`, `baseColorGrid` and `maskGrid` are grid names. `emissiveScale` also scales the emission grid.
- `setMaxLod( lod: number ): WVDBAnimationLoader` - the downloads stop after this LOD.
- `setConcurrency( files: number ): WVDBAnimationLoader` - files that load at the same time in each pass. Default: all.
- `load( urls, onLoad, onProgress, onError ): FrameVolumeAnimation`

Loads a sequence (one `.wvdb` file per frame) as a [FrameVolumeAnimation](../frame/README.md#framevolumeanimation). LOD 0 of all frames loads first, then `onLoad( animation )` is called and the animation can play. Then LOD 1 of all frames, and so on. Each pass requests the start of each file up to the end of that LOD (`Range: bytes=0-N`). `onProgress({ lod, loadedFrames, totalFrames })` is called when a frame gets a LOD. Points grids are `VDBPoints` children of their frame.

```js
const animation = new OpenVDB.WVDBAnimationLoader()
  .setOptions({ emissiveGrid: 'flames', emissiveScale: 6.0 })
  .load(frameUrls, () => animation.play());

scene.add(animation);

// NOTE In the render loop
animation.update(clock.getDelta());
```

## WVDBReader

- `new WVDBReader({ maxLod }).load( url, { onHeader, onUpdate } )`

Reads the same `Uint8Array` data as `WVDBLoader`, without three.js objects. Other engines can read the format with the WVDB helpers of [`openvdb`](../../openvdb/README.md).

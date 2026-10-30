# three-openvdb

three.js rendering of OpenVDB volumes, built on `openvdb`: `VDBLoader`, `VDBAnimationLoader` and `FrameVolume`.

`three-openvdb` renders `FrameVolume` with `WebGPURenderer` from `three/webgpu` (three.js r186 or newer), with WebGPU or the WebGL2 fallback (`forceWebGL: true`). For `WebGLRenderer`, import the same API from `three-openvdb/webgl`. That entry point is for backwards compatibility and will be removed in a later version.

Streamed `.wvdb` files, made from `.vdb` files with the `wvdb` CLI (npm package `webvdb`):

```js
import { FrameVolume, WVDBLoader, WVDBAnimationLoader } from 'three-openvdb';

// NOTE One file. LOD 0 shows at once, each next LOD replaces it while the download continues.
new WVDBLoader().load('./explosion.wvdb', (volumeData) => {
  const grid = volumeData.grids.density;
  const volume = new FrameVolume(grid.data, { resolution: grid.resolution, bbox: grid.bbox });

  volumeData.attach(volume);
  scene.add(volume);
});

// NOTE A sequence. LOD 0 of all frames loads first, so the animation plays early.
const animation = new WVDBAnimationLoader()
  .setOptions({ emissiveGrid: 'flames', emissiveScale: 6.0 })
  .load(urls, () => animation.play());

scene.add(animation);
```

See the main README of the repository for the API, and `src/docs/wvdb/README.md` for the format.

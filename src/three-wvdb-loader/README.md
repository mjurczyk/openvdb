# three-wvdb-loader

three.js loader for `.wvdb` files (made from `.vdb` files with the `wvdb` CLI). The file streams: the first LOD shows at once, each next LOD replaces it while the download continues.

```js
import { FrameVolume } from 'three-openvdb';
import { WVDBLoader } from 'three-wvdb-loader';

new WVDBLoader().load('./explosion.wvdb', (volumeData) => {
  const grid = volumeData.grids.density;
  const volume = new FrameVolume(grid.data, { resolution: grid.resolution, bbox: grid.bbox });

  volumeData.attach(volume);
  scene.add(volume);
});
```

Emission grids: `new WVDBLoader().setGridScales({ flames: 6.0 })`, then use `volumeData.grids.flames.data` as `emissiveGrid`. Vector grids load as RGBA (`isColor`) for `baseColorGrid`.

Format and kernel: `src/docs/wvdb/README.md` in the repository.

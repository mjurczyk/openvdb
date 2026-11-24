# three-openvdb

three.js rendering of OpenVDB volumes, built on [`openvdb`](https://github.com/mjurczyk/openvdb/blob/main/src/openvdb/README.md).

## Renderer

| Entry point | Renderer | three.js |
| -- | -- | -- |
| `three-openvdb` | `WebGPURenderer` (`three/webgpu`), WebGPU or WebGL2 (`forceWebGL: true`) | r187 or newer |
| `three-openvdb/webgl` | `WebGLRenderer` | r162 or newer |

Both entry points have the same API. `three-openvdb/webgl` is for backwards compatibility and will be removed in a later version. Import from one entry point only.

## Usage

```js
import * as Three from 'three';
import { WebGPURenderer } from 'three/webgpu';
import * as OpenVDB from 'three-openvdb';

const renderer = new WebGPURenderer({ antialias: true });
const scene = new Three.Scene();

new OpenVDB.WVDBLoader().load('./assets/bunny_cloud.wvdb', (volumeData) => {
  const grid = volumeData.grids.density;
  const volume = new OpenVDB.FrameVolume(grid.data, {
    dimensions: grid.dimensions,
    bbox: grid.bbox,
    baseColor: 0xff00ff,
  });

  volumeData.attach(volume);
  scene.add(volume);
});

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
```

### .vdb files

`.vdb` files load directly too. The browser then downloads the full file and converts it.

```js
new OpenVDB.VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
  scene.add(new OpenVDB.FrameVolume(vdb, { progressive: true }));
});
```

### react-three-fiber

```jsx
import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';

export const VDBComponent = () => {
  const [model, setModel] = useState(new Three.Object3D());

  useEffect(() => {
    let volume;

    const volumeData = new OpenVDB.WVDBLoader().load('./assets/bunny_cloud.wvdb', (loaded) => {
      const grid = loaded.grids.density;

      volume = loaded.attach(
        new OpenVDB.FrameVolume(grid.data, { dimensions: grid.dimensions, bbox: grid.bbox })
      );

      setModel(volume);
    });

    return () => {
      volumeData.dispose();
      volume?.dispose();
    };
  }, []);

  return <primitive object={model} />;
};
```

## VDBLoader

- `new VDBLoader( manager: Three.LoadingManager )`
- `load( url, onLoad, onProgress, onError ): void`

`onLoad( reader: OpenVDBReader )` is called when the file is loaded and parsed. `onProgress` is not used.

## VDBAnimationLoader

- `new VDBAnimationLoader( manager: Three.LoadingManager )`
- `setOptions( props ): VDBAnimationLoader` - `FrameVolume` props of all frames. `emissiveGrid`, `baseColorGrid` and `maskGrid` are grid names.
- `load( urls, onLoad, onProgress, onError ): FrameVolumeAnimation`

Loads a `.vdb` sequence (one file per frame). `onProgress({ loadedFrames, totalFrames })` is called when a frame is converted. `onLoad( animation )` is called when all frames are converted.

## Docs

- [Rendering frame](https://github.com/mjurczyk/openvdb/blob/main/src/three-openvdb/frame/README.md) - `FrameVolume`, `FrameVolumeAnimation`, instances, medium presets, `frameRenderer.settings`, volume shadows, `FrameEmissionLight`.
- [WVDB loaders](https://github.com/mjurczyk/openvdb/blob/main/src/three-openvdb/wvdb/README.md) - `WVDBLoader`, `WVDBAnimationLoader`, `WVDBReader`.
- [Level sets](https://github.com/mjurczyk/openvdb/blob/main/src/three-openvdb/levelset/README.md) - `LevelSetMesh`, `LevelSetSurface`.
- [Points](https://github.com/mjurczyk/openvdb/blob/main/src/three-openvdb/points/README.md) - `VDBPoints`.

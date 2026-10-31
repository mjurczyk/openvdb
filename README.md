<a href="https://mjurczyk.github.io/openvdb/" target="_blank">
  <img width="100%" src="https://github.com/mjurczyk/openvdb/assets/9549760/fb7a04c1-9c69-44c9-addb-f6969b3017c6" title="OpenVDB - Web implementation of volumetric grids" />
</a>

# OpenVDB

> [!NOTE]
> WVDB (`.wvdb`) is a live proposal. The format can change. See the [WebVDB format specification](src/docs/wvdb/README.md).

> [!TIP]
> Convert `.vdb` files to `.wvdb` before you use them on the web: `npx webvdb explosion.vdb` (or `npm install -g webvdb`, then `wvdb explosion.vdb`). A `.wvdb` file is much smaller, and it shows a coarse LOD first. The examples below use `.wvdb`. `.vdb` files also load directly, see [Loading .vdb files](#loading-vdb-files).

This project indirectly ports OpenVDB file format and tools to JavaScript, TypeScript, and Node.

Packages (each in its own folder of `src/`):

| Package | Folder | Use |
| --- | --- | --- |
| `openvdb` | `src/openvdb` | Reads VDB files. Grid lookup, volume math, noise, WVDB format helpers. No renderer. |
| `three-openvdb` | `src/three-openvdb` | three.js rendering: `.vdb` and `.wvdb` loaders, `FrameVolume`. |
| `webvdb` | `src/wvdb` | `wvdb` CLI: converts VDB files, folders and ZIP files into `.wvdb` files. |

## What is OpenVDB

VDB is a volumetric data format originally implemented in C++ ([AcademySoftwareFoundation/openvdb](https://github.com/AcademySoftwareFoundation/openvdb).) It allows to efficiently store voxel structures of this like smoke, fire, and fluid simulations - as well as normal 3D models converted to voxels.

Keep in mind that, due to memory-access and multithreading limitations of JS, this repo may be more similar to a read-only [NanoVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb/nanovdb), instead of the original OpenVDB. Code is nevertheless based on original [OpenVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb).

## Usage

### With `three.js`:

> [!IMPORTANT]
> `three-openvdb` renders `FrameVolume` with `WebGPURenderer` (`three/webgpu`, three.js r187 or newer). It uses WebGPU, or WebGL2 with `forceWebGL: true`.
> For `WebGLRenderer`, import from `three-openvdb/webgl` instead. It has the same API (GLSL shaders). It is for backwards compatibility and will be removed in a later version. Import from one of the two entry points only.

```js
import * as Three from 'three';
import { WebGPURenderer } from 'three/webgpu';
import * as OpenVDB from 'three-openvdb';

const renderer = new WebGPURenderer({ antialias: true });
const scene = new Three.Scene();

// NOTE Load a .wvdb file. LOD 0 shows at once. Each finer LOD replaces it while the download continues.
new OpenVDB.WVDBLoader().load('./assets/bunny_cloud.wvdb', (volumeData) => {
  const grid = volumeData.grids.density;
  const volume = new OpenVDB.FrameVolume(grid.data, {
    resolution: grid.resolution,
    bbox: grid.bbox,
    absorbance: 1.0,
    baseColor: 0xff00ff,
  });

  // NOTE The textures of the volume follow the new LODs
  volumeData.attach(volume);
  scene.add(volume);
});

// NOTE Load a .wvdb sequence (one file per frame) as an animation. It plays after LOD 0 of all frames.
const animation = new OpenVDB.WVDBAnimationLoader()
  .setOptions({ emissiveGrid: 'flames', emissiveScale: 6.0 })
  .load(frameUrls, () => animation.play());

scene.add(animation);

const clock = new Three.Clock();

renderer.setAnimationLoop(() => {
  animation.update(clock.getDelta());
  renderer.render(scene, camera);
});
```

#### Loading .vdb files

`.vdb` files load directly too. The browser then downloads the full file and converts it.

```js
new OpenVDB.VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
  const volume = new OpenVDB.FrameVolume(vdb, {
    resolution: 100,
    progressive: true,
    absorbance: 1.0,
    baseColor: 0xff00ff,
  });

  scene.add(volume);
});

// NOTE VDB sequences: new OpenVDB.VDBAnimationLoader().setOptions(props).load(frameUrls, onLoad)
```

### With `react-three-fiber`:

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
        new OpenVDB.FrameVolume(grid.data, {
          resolution: grid.resolution,
          bbox: grid.bbox,
          absorbance: 1.0,
          baseColor: 0xff00ff,
        })
      );

      setModel(volume);
    });

    return () => {
      // NOTE Stops the download
      volumeData.dispose();
      volume?.dispose();
    };
  }, []);

  return <primitive object={model} />;
};
```

### Without library:

```js
import * as OpenVDB from 'openvdb';

const vdbReader = await OpenVDB.loadVDB('./assets/bunny.vdb');

vdbReader.grids.forEach(function (grid) {
  const voxelValue = grid.getValue({ x: 0.0, y: 0.0, z: 1.0 });
});
```

## Docs

### loadVDB

- `loadVDB( url ): Promise<OpenVDB.OpenVDBReader>`

Loads OpenVDB file and parses its grids. Grids can be accessed via `.grids` property of the value returned from the Promise. The Promise rejects on network errors, HTTP errors (for example 404), and parse errors.

Each grid has a `.getValue( position: { x, y, z } ): float` method, which returns the voxel value saved in the file for the given position (density for fog volumes, signed distance for level sets). The `.isActive( position: { x, y, z } ): boolean` method returns `true` if the voxel at the given position is active. See `src/three-openvdb/frame/FrameVolume.js` for an example of VDB file parsing.

---

### VDBLoader

- `VDBLoader( manager: Three.LoadingManager )`

- `VDBLoader.load( url, onLoad, onProgress, onError ): void`

Loads VDB model. onLoad is called when VDB is loaded and parsed. onError is called when error happens. onProgress is currently not used.

---

### WVDBLoader

- `WVDBLoader( manager: Three.LoadingManager )`

- `WVDBLoader.setMaxLod( lod: number ): WVDBLoader`

- `WVDBLoader.load( url, onLoad, onProgress, onError ): WVDBVolumeData`

Loads a `.wvdb` file (see [WVDB files](#wvdb-files)) as a stream. `onLoad( volumeData )` is called when all grids show LOD 0. Each next LOD replaces the previous one while the download continues. Each LOD has its own texture size (for example 32³, 64³, 128³). `onProgress({ lod, lods, lodComplete, done, bytesLoaded, bytesTotal })` is called after each update. With `setMaxLod( lod )`, the download stops after that LOD.

`volumeData.grids[name]` has `data: Uint8Array` (`resolution`³ texels of the newest LOD: density, or RGBA when `isColor`), `resolution`, `bbox: Three.Box3`, `isLevelSet` and `isColor`. Use `data` as raw data of `FrameVolume`, also for `emissiveGrid` and `baseColorGrid`. With `setGridScales({ flames: 6.0 })`, grid values divide by the scale before they become density. Use the `emissiveScale` of the volume for emission grids. Call `volumeData.attach( volume )`, so the textures of the volume update (and resize) when a new LOD arrives. `volumeData.dispose()` stops the download.

- `WVDBAnimationLoader( manager ).setOptions( props ).load( urls, onLoad, onProgress, onError ): FrameVolumeAnimation`

Loads a `.wvdb` sequence (one file per frame) as a `FrameVolumeAnimation`. LOD 0 of all frames loads first, then `onLoad( animation )` is called and the animation can play. Then LOD 1 of all frames, and so on. Each pass requests only the first bytes of each file, up to the end of that LOD (`Range: bytes=0-N`). This also works when the host compresses responses. Each pass reads the earlier LODs again. `props` are `FrameVolume` props for all frames. `emissiveGrid`, `baseColorGrid` and `maskGrid` are grid names, `emissiveScale` also scales the emission grid. `onProgress({ lod, loadedFrames, totalFrames })` is called when a frame gets a LOD. Also `setMaxLod( lod )` (the downloads stop after that LOD) and `setConcurrency( files )` (files that load at the same time in each pass, default: all).

```js
new OpenVDB.WVDBLoader().load('./assets/bunny_cloud.wvdb', (volumeData) => {
  const grid = volumeData.grids.density;
  const volume = new OpenVDB.FrameVolume(grid.data, { resolution: grid.resolution, bbox: grid.bbox });

  volumeData.attach(volume);
  scene.add(volume);
});
```

`WVDBReader` (same package) gives the same `Uint8Array` data without the three.js wrapper: `new WVDBReader({ maxLod }).load( url, { onHeader, onUpdate } )`. Other engines can read the format with the `openvdb` format helpers.

---

### FrameVolume

- `FrameVolume( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor>, { resolution, progressive, ... }, onConverted: () => void, onProgress: ({ convertedVoxels, totalVoxels, convertedGrids, totalGrids }) => void ): Three.Object3D`

Converts the given `OpenVDBReader` to a volumetric `Three.Object3D`. `onConverted` and `onProgress` are called as the VDB is converted. For each frame, all visible `FrameVolume` objects are written into one frustum-aligned voxel grid (froxels). Then one fullscreen pass marches that grid. Overlapping volumes mix correctly. It works with a normal `renderer.render(scene, camera)` call of `WebGPURenderer`. The march stops at the depth buffer of that render, so a render target must have a depth buffer.

* `resolution: number` - (default: `100`) resolution of the 3D texture of each grid.
* `progressive: boolean` - set to `true` to render the volume while it is converted.
* `extinction: number` - (default: `100.0`) extinction of density `1.0` for each unit of the volume box (the largest side).
* `absorbance: number` - (default: `1.0`) scales the self-shadowing. `0.0` gives no shadows.
* `densityScale: number` - (default: `1.0`) scales density of the entire grid.
* `densityCutoff: number` - (default: `0.0`) density at or below this value is empty. Defines sharpness of the shape.
* `opacity: number` - (default: `1.0`) opacity of the volume from the camera (doesn't affect light calculations.)
* `baseColor: Three.Color | string | number` - (default: `0xffffff`) albedo color of the volume.
* `scatterColor: Three.Color | string | number` - (default: `0x000000`) lowest color of the lit volume.
* `offset3D: Three.Vector3`, `wrap3D` - UV offset and wrapping (`Three.ClampToEdgeWrapping`, `Three.RepeatWrapping`, `Three.MirroredRepeatWrapping`) of the 3D textures.
* `emissiveGrid` - VDB emission grid. `emissiveIntensity` (default: `1.0`) scales the emission.
* `baseColorGrid` - VDB grid equivalent of `baseColor`.
* `maskGrid` - static VDB grid mask applied to each voxel. Not affected by UV offset.
* `lights` - bitmask of light types (`frameLights.useAmbientLights | frameLights.useDirectionalLights | frameLights.usePointLights | frameLights.useSpotLights | frameLights.useHemisphereLights | frameLights.useEnvironment`). Default: all light types.
* `shadowSteps: number` - (default: `32`) steps of the shadow march toward each light, inside the volume.
* `mipmaps: boolean` - (default: `true`) mipmaps of the 3D textures, made on the CPU (three.js WebGPU does not make 3D mipmaps). Far volumes and coarse shadow cascades sample a lower mip level. Without them, far volumes and shadows become noisy and blotchy. Cost: +25% memory for each grid, a CPU build of about 11 ms for a 128³ grid (one time, also for each new `.wvdb` LOD), and a second texture sample for each density sample.

All properties can be changed after creation, for example `frameVolume.extinction = 50.0` or `frameVolume.baseColor.set(0xff00ff)`.

#### Instances

- `frameVolume.createInstance( props ): FrameVolume`
- `animation.createInstance( props ): FrameVolumeAnimationInstance`

An instance shows the same volume or sequence at another place, with no new 3D textures. GPU memory does not grow with the number of instances. Each instance has its own transform and its own props. The props start from the props of the source, and `props` overrides them. LOD updates of a `.wvdb` source (`volumeData.attach( volume )`) show on all instances. `new FrameVolume( frameVolume, props )` also makes an instance.

An animation instance plays the frames of the source animation with its own `frame`, `fps`, `loop`, `play()`, `pause()`, `stop()` and `update( delta )`. Volume props (for example `extinction` or `baseColor`) apply only to the instance. It renders one `FrameVolume` instance, which shows the textures of the current frame. Call `animation.createInstance()` in `onLoad`, when the animation has frames. Frames that load later are used too.

Props that build the textures stay the same as the source: `resolution`, `bbox`, `emissiveGrid`, `baseColorGrid`, `maskGrid`, and `emissiveScale` of `.wvdb` and converted data. For other voxel data, load the volume again.

`instance.dispose()` frees only the instance. Dispose the source after its instances. The source does not have to be in the scene.

```js
new OpenVDB.WVDBAnimationLoader()
  .setOptions({ emissiveGrid: 'flames' })
  .load(urls, (animation) => {
    for (let i = 0; i < 8; i++) {
      const explosion = animation.createInstance({ extinction: 300.0 });

      explosion.position.x = i * 10.0;
      explosion.frame = i * 10;
      explosion.play();
      scene.add(explosion);

      // NOTE Call explosion.update( delta ) in the render loop
    }
  });
```

Froxel grid settings are global, in `frameRenderer.settings`:

* `width`, `height` - (default: `512`, `512`) froxels on the screen axes.
* `depth` - (default: `24`) depth slices. Slices are exponential: thin near the camera, thick far away. Slices fit the visible volumes.
* `subSteps` - (default: `32`) density samples along the view ray in each slice. Each froxel is lit at the visibility-weighted mean position of its samples, then stored as slice color and alpha.
* `near`, `far` - (default: `0.1`, `512.0`) limits of the slice range in view depth.
* `jitter` - (default: `false`) moves sub-steps and shadow samples by a small random amount each frame. Banding becomes fine noise.
* `temporal` - (default: `true`) blends each frame with the reprojected froxels of the previous frames. This removes the jitter noise. The history is clamped to the current froxels to limit ghosting.
* `temporalBlend` - (default: `0.2`) weight of the new frame. Lower values are smoother, higher values react faster to motion.
* `lighting` - (default: `'frame'`) lighting model:
  * `'frame'` - all volumes are written into the froxels first (density and material only). World-space shadow grid cascades hold the extinction of all volumes, also volumes out of the view. Transmittance to each light is calculated one time in the grid. Then each froxel is lit one time. Volumes shadow each other, and the number of render calls does not grow with the number of volumes. Good for many overlapping volumes, for example cloud fields.
  * `'volume'` - each volume is lit alone. Shadows come only from the same volume. Good for a small number of dense volumes with sharp edges.
* `shadowResolution` - (default: `64`) voxels on each axis of each shadow grid cascade (`'frame'` lighting only).
* `shadowCascades` - (default: `3`, max `4`) shadow grid cascades. The last cascade fits all volumes. Each finer cascade is half the size, around the camera. Shadows are dense near the camera and sparse far away (`'frame'` lighting only).
* `shadowDistance` - (default: `512`) the finer shadow grid cascades cover only this distance from the camera. The last cascade covers all volumes, with coarser voxels (`'frame'` lighting only).
* `srgbBlending` - (default: `true`) blends the volumes over the scene in sRGB, the same as `WebGLRenderer` did. `false` blends in linear space, the default of `WebGPURenderer`. Linear blending makes thin fog brighter.

With `mipmaps`, large froxels far away sample a lower mip level, so small details fade to transparent.

With `'frame'` lighting, the first directional, point and spot lights (6 in total) cast shadows. Hemisphere lights and light probes use the shadow grid in the up and down directions. The environment (`scene.environment`) lights each volume along its outward direction, the same as `'volume'` lighting. Its shadow is between the up and down shadows of the grid. Ambient light has no shadow. `lights` and `shadowSteps` are not used, `scatterColor` is added as emission, and `absorbance` scales the shadow of each volume.

Limits: with `'volume'` lighting, volumes do not shadow other volumes, and point and spot lights have no distance falloff. The first 16 directional, point and spot lights light the volumes. With `'volume'` lighting, the first 4 hemisphere lights are used. Logarithmic depth buffers are not supported.

---

## WVDB files

VDB files are large (10-500 MB), so they are slow on the web. The VDB file stays the source of truth. The `wvdb` CLI (npm package `webvdb`) makes a small `.wvdb` file from it. It needs only Node.js (no three.js, no browser). The web page loads only the `.wvdb` file.

```sh
npm install -g webvdb           # or run once: npx webvdb <input>

wvdb bunny_cloud.vdb
# bunny_cloud.vdb (80.17 MB) -> bunny_cloud.wvdb (405.1 KB)
wvdb ./explosion_VDB        # folder of .vdb files -> ./explosion_VDB_wvdb/
wvdb ./explosion_VDB.zip    # ZIP of .vdb files -> ./explosion_VDB_wvdb/
```

Options: `--output`, `--grids <a,b>`, `--resolution` (default `128`, texels per side of the finest LOD), `--lods` (default `3`), `--bits` (`8` or `16`, default `8`), `--layout` (`sparse` or `dense`, default `sparse`), `--page-bricks` (default `1024`), `--jobs` (files converted at the same time, default: CPU core count).

Each `.vdb` file gives one `.wvdb` file, also empty frames. All grids of a file use one box. All frames of a folder or ZIP use one box, so voxels do not move between frames.

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
  - [nodeca/pako](https://github.com/issues): ZLIB compression

Be sure to ⭐️ those!

Example sequence: Ground Explosion by [JangaFX](https://jangafx.com) ([EmberGen](https://jangafx.com/software/embergen/)), CC0. More free VDBs: [jangafx.com](https://jangafx.com/software/embergen/download/free-vdb-animations/).

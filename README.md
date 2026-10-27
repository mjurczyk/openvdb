<a href="https://mjurczyk.github.io/openvdb/" target="_blank">
  <img width="100%" src="https://github.com/mjurczyk/openvdb/assets/9549760/fb7a04c1-9c69-44c9-addb-f6969b3017c6" title="OpenVDB - Web implementation of volumetric grids" />
</a>

# OpenVDB

This project indirectly ports OpenVDB file format and tools to JavaScript, TypeScript, and Node.

Packages (each in its own folder of `src/`):

| Package | Folder | Depends on | Use |
| --- | --- | --- | --- |
| `openvdb` | `src/openvdb` | nothing | Reads VDB files. Grid lookup, volume math, primitives, noise, WVDB format helpers. No renderer. |
| `three-openvdb` | `src/three-openvdb` | `openvdb`, `three` | three.js rendering: `.vdb` and `.wvdb` loaders, `FrameVolume`, `FogVolume`, materials. |
| `wvdb` | `src/wvdb` | `openvdb` (bundled), Node.js | CLI: converts VDB files, folders and ZIP files into `.wvdb` files. |

Examples (gh-pages) are in `src/docs/examples`. The WVDB format is described in `src/docs/wvdb/README.md`.

## What is OpenVDB

VDB is a volumetric data format originally implemented in C++ ([AcademySoftwareFoundation/openvdb](https://github.com/AcademySoftwareFoundation/openvdb).) It allows to efficiently store voxel structures of this like smoke, fire, and fluid simulations - as well as normal 3D models converted to voxels.

Keep in mind that, due to memory-access and multithreading limitations of JS, this repo may be more similar to a read-only [NanoVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb/nanovdb), instead of the original OpenVDB. Code is nevertheless based on original [OpenVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb).

## Usage

### With `three.js`:

```js
import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';

const scene = new Three.Scene();

// NOTE To load an existing VDB model - use VDBLoader:
new OpenVDB.VDBLoader().load('./assets/bunny.vdb', function (vdb) {
  const volume = new OpenVDB.FrameVolume(vdb, {
    resolution: 100,
    progressive: true,
    absorbance: 1.0,
    baseColor: 0xff00ff,
  });

  scene.add(volume);
});

// NOTE To create a primitive volumetric shape - use volume converters directly:
const primitiveVolume = new OpenVDB.SphereVolume();
const primitive = new OpenVDB.FrameVolume(primitiveVolume, {
  resolution: 50,
  absorbance: 0.5,
  baseColor: 0xff00ff,
});

scene.add(primitive);

// NOTE FogVolume ray marches each volume on its own. It takes the same sources:
const fogPrimitive = new OpenVDB.FogVolume(primitiveVolume, {
  resolution: 50,
  steps: 50,
  absorbance: 0.5,
  baseColor: 0xff00ff,
});
```

### With `react-three-fiber`:

```jsx
import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';

export const VDBComponent = () => {
  const [model, setModel] = useState(new Three.Object3D());

  useEffect(() => {
    let volume;

    new OpenVDB.VDBLoader().load('./assets/bunny.vdb', function (vdb) {
      volume = new OpenVDB.FrameVolume(vdb, {
        resolution: 100,
        progressive: true,
        absorbance: 1.0,
        baseColor: 0xff00ff,
      });

      setModel(volume);
    });

    return () => {
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

Loads OpenVDB file and parses its grids. Grids can be accessed via `.grids` property of the value returned from the Promise.

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

`volumeData.grids[name]` has `data: Uint8Array` (`resolution`³ texels of the newest LOD: density, or RGBA when `isColor`), `resolution`, `bbox: Three.Box3`, `isLevelSet` and `isColor`. Use `data` as raw data of `FrameVolume` or `VolumeToFog`, also for `emissiveGrid` and `baseColorGrid`. With `setGridScales({ flames: 6.0 })`, grid values divide by the scale before they become density. Use the `emissiveScale` of the volume for emission grids. Call `volumeData.attach( volume )`, so the textures of the volume update (and resize) when a new LOD arrives. `volumeData.dispose()` stops the download.

- `WVDBAnimationLoader( manager ).setOptions( props ).load( urls, onLoad, onProgress, onError ): FrameVolumeAnimation`

Loads a `.wvdb` sequence (one file per frame) as a `FrameVolumeAnimation`. LOD 0 of all frames loads first, then `onLoad( animation )` is called and the animation can play. Then LOD 1 of all frames, and so on. Finer LODs request only their own bytes (HTTP Range). `props` are `FrameVolume` props for all frames. `emissiveGrid`, `baseColorGrid` and `maskGrid` are grid names, `emissiveScale` also scales the emission grid. `onProgress({ lod, loadedFrames, totalFrames })` is called when a frame gets a LOD. Also `setMaxLod( lod )` and `setConcurrency( files )` (default `6`).

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

Converts the given `OpenVDBReader` to a volumetric `Three.Object3D`. `onConverted` and `onProgress` are called as the VDB is converted. For each frame, all visible `FrameVolume` objects are written into one frustum-aligned voxel grid (froxels). Then one fullscreen pass marches that grid. Overlapping volumes mix correctly. It works with a normal `renderer.render(scene, camera)` call.

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
* `lights` - bitmask of light types (`frameLights.useAmbientLights | frameLights.useDirectionalLights | frameLights.usePointLights | frameLights.useSpotLights | frameLights.useHemisphereLights | frameLights.useEnvironment`). Bit values are the same as `lights`.
* `shadowSteps: number` - (default: `32`) steps of the shadow march toward each light, inside the volume.

All properties can be changed after creation, for example `frameVolume.extinction = 50.0` or `frameVolume.baseColor.set(0xff00ff)`.

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

3D textures of `FrameVolume` have mipmaps. Large froxels far away sample a lower mip level, so small details fade to transparent.

With `'frame'` lighting, the first directional, point and spot lights (6 in total) cast shadows. Hemisphere lights, light probes and the environment use the shadow grid in the up and down directions. Ambient light has no shadow. `lights` and `shadowSteps` are not used, `scatterColor` is added as emission, and `absorbance` scales the shadow of each volume.

Limits: with `'volume'` lighting, volumes do not shadow other volumes. Point and spot lights have no distance falloff (same as `VolumeToFog`). Logarithmic depth buffers are not supported.

---

### VolumeToBbox

- `VolumeToBbox( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor> ): Three.Object3D`

Converts given `OpenVDBReader` to `Three.Object3D`. Resulting object consists of wireframe bounding boxes of all internal nodes within the given VDB. If multiple grids are given - each grid is drawn in a different wireframe color.

---

### VolumeToFog

- `VolumeToFog( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor>, { resolution, steps, progressive, absorbance, opacity, radius, baseColor }, onConverted: () => void, onProgress: ({ convertedVoxels, totalVoxels, convertedGrids, totalGrids }) => void ): Three.Object3D`

Converts given `OpenVDBReader` to a volumetric `Three.Object3D`. Each volume has its own mesh and material, and is ray marched on its own. `onConverted` and `onProgress` are called as the VDB is converted to a fog. Most importantly:

* `resolution: number` - (required) resolution of the resulting 3D texture. Keep in mind this will be risen to the power of 3 - so resolution 200 results in 8 million voxels.
* `steps: number` - (default: 100) detail of the resulting fog volume. High amount of steps combined with large amount of lights in the scene may decrease performance significantly.
* `progressive: boolean` - set to `true` to render the fog on-the-go as it is being parsed, while preserving 60fps.
* `absorbance: number` - (default: `1.0`) `1.0` means fog absorbs all the light going through it, lower values all light to partially traverse through the fog.
* `densityScale: number` - scales density of the entire grid.
* `densityCutoff: number` - defines sharpness of the shape.
* `opacity: number` - alpha opacity of the fog (doesn't affect light calculations.)
* `baseColor: Three.Color | string | number` - (default: `0x000000`) albedo color of the fog volume.
* `emissiveGrid` - VDB emission grid.
* `baseColorGrid` - VDB grid equivalent of `baseColor`.
* `maskGrid` - static VDB grid mask applied to each voxel. Not affected by UV offset.
* `lights` - bitmask of light types affecting the volume (`lights.useDirectionalLights | lights.usePointLights | lights.useSpotLights | lights.useHemisphereLights | lights.useEnvironment`)
* `textureBuild: 'sample' | 'leaves'` - (default: `'sample'`) `'sample'` reads the grid `resolution³` times. `'leaves'` reads leaves and tiles one time, in a Web Worker when available. `'leaves'` needs VDB grids with scalar values; primitives and `baseColorGrid` grids use `'sample'`. With `'leaves'`, `radius` applies to the density texture only.
* `textureFilter: 'nearest' | 'trilinear' | 'max'` - (default: `'nearest'`) texel value for `textureBuild: 'leaves'`. `'nearest'` gives the same result as `'sample'`. `'trilinear'` interpolates voxels at the texel center. `'max'` keeps the largest voxel in the texel, so thin shapes stay visible at low resolutions.
* `textureType: 'uint8' | 'half' | 'float'` - (default: `'uint8'`) data type of the density, emissive, and mask textures. `'float'` needs `OES_texture_float_linear` for linear filtering.

---

### VolumeToLevelSet

- `VolumeToLevelSet( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor>, onConverted: () => void, onProgress: () => void ): Three.Object3D`

Not yet finished. Converts the given `OpenVDBReader` to a 3D mesh using marching cubes.

---

### CubeVolume

- `CubeVolume(): OpenVDB.GridDescriptor`

Generates a 1x1x1 volumetric cube.

---

### SphereVolume

- `SphereVolume(): OpenVDB.GridDescriptor`

Generates a 1x1x1 volumetric sphere.

---

### CloudVolume


- `CloudVolume( { height: number, density: number } ): OpenVDB.GridDescriptor`

Generates a 1x1x1 volumetric clouds based on noise inputs.

---

### ParametricVolume

- `ParametricVolume( valueFunction(position: Three.Vector3) => number ): OpenVDB.GridDescriptor`

Generates a 1x1x1 volume with values defined using a `valueFunction`. `valueFunction` is called with position of each voxel within the volumetric bounding cube - and expects a value between `0.0` and `1.0` to be returned (`0.0` meaning given voxel is fully transparent, `1.0` meaning given voxel is fully opaque.)

---

## WVDB files

VDB files are large (10-500 MB), so they are slow on the web. The VDB file stays the source of truth. The `wvdb` CLI makes a small `.wvdb` file from it. It needs only Node.js (no three.js, no browser). The web page loads only the `.wvdb` file.

```sh
npx wvdb bunny_cloud.vdb
# bunny_cloud.vdb (80.17 MB) -> bunny_cloud.wvdb (405.1 KB)
npx wvdb ./explosion_VDB        # folder of .vdb files -> ./explosion_VDB_wvdb/
npx wvdb ./explosion_VDB.zip    # ZIP of .vdb files -> ./explosion_VDB_wvdb/
```

Options: `--output`, `--grids <a,b>`, `--resolution` (default `128`, texels per side of the finest LOD), `--lods` (default `3`), `--bits` (`8` or `16`, default `8`), `--layout` (`sparse` or `dense`, default `sparse`), `--page-bricks` (default `1024`), `--jobs` (files converted at the same time, default: CPU core count).

Each `.vdb` file gives one `.wvdb` file, also empty frames. All grids of a file use one box. All frames of a folder or ZIP use one box, so voxels do not move between frames.

Format, results and the three.js kernel: `src/docs/wvdb/README.md`. The `.vdb` loaders do not change.

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

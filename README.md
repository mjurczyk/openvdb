<a href="https://mjurczyk.github.io/openvdb/" target="_blank">
  <img width="100%" src="https://github.com/user-attachments/assets/169a5c74-8e46-4008-a28a-fa615befd5f7" title="OpenVDB - Web implementation of volumetric grids" />
</a>



# OpenVDB

> [!NOTE]
> WVDB (`.wvdb`) is a live proposal. The format can change. See the [WebVDB format specification](src/docs/wvdb/README.md).

> [!TIP]
> Convert `.vdb` files to `.wvdb` before you use them on the web: `npx webvdb explosion.vdb` (or `npm install -g webvdb`, then `wvdb explosion.vdb`). A `.wvdb` file is much smaller, and it shows a coarse LOD first. The examples below use `.wvdb`. `.vdb` files also load directly, see [Loading .vdb files](#loading-vdb-files).

This project indirectly ports OpenVDB file format and tools to JavaScript and Node.

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
    dimensions: grid.dimensions,
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
          dimensions: grid.dimensions,
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

`volumeData.grids[name]` has `data: Uint8Array` (texels of the newest LOD: density, or RGBA when `isColor`), `dimensions: [x, y, z]` (texels of the newest LOD), `resolution` (texels on the longest side), `bbox: Three.Box3`, `isLevelSet` and `isColor`. Level set grids also have `distance: Uint8Array` (signed distance texels of the newest LOD, see [LevelSetMesh](#levelsetmesh)) and `background` (the band width). Use `data` as raw data of `FrameVolume` with `dimensions`, also for `emissiveGrid` and `baseColorGrid`. With `setGridScales({ flames: 6.0 })`, grid values divide by the scale before they become density. Use the `emissiveScale` of the volume for emission grids. Call `volumeData.attach( volume )`, so the textures of the volume update (and resize) when a new LOD arrives. `volumeData.attach( levelSetMesh )` builds the mesh again when a new LOD arrives. `volumeData.dispose()` stops the download.

- `WVDBAnimationLoader( manager ).setOptions( props ).load( urls, onLoad, onProgress, onError ): FrameVolumeAnimation`

Loads a `.wvdb` sequence (one file per frame) as a `FrameVolumeAnimation`. LOD 0 of all frames loads first, then `onLoad( animation )` is called and the animation can play. Then LOD 1 of all frames, and so on. Each pass requests only the first bytes of each file, up to the end of that LOD (`Range: bytes=0-N`). This also works when the host compresses responses. Each pass reads the earlier LODs again. `props` are `FrameVolume` props for all frames. `emissiveGrid`, `baseColorGrid` and `maskGrid` are grid names, `emissiveScale` also scales the emission grid. `onProgress({ lod, loadedFrames, totalFrames })` is called when a frame gets a LOD. Also `setMaxLod( lod )` (the downloads stop after that LOD) and `setConcurrency( files )` (files that load at the same time in each pass, default: all).

```js
new OpenVDB.WVDBLoader().load('./assets/bunny_cloud.wvdb', (volumeData) => {
  const grid = volumeData.grids.density;
  const volume = new OpenVDB.FrameVolume(grid.data, { dimensions: grid.dimensions, bbox: grid.bbox });

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
* `dimensions: [x, y, z]` - raw data only: texels of the 3D texture on each axis, for example `grid.dimensions` of `.wvdb` data. Default: `resolution` on each axis.
* `progressive: boolean` - set to `true` to render the volume while it is converted.
* `extinction: number` - (default: `100.0`) extinction for each unit of the volume box (the largest side): of the mean density with `normalizeDensity` (the optical depth of the box at the mean density), of density `1.0` without it.
* `angstromExponent: string | number` - (default: `'cloud'`) Ångström exponent (Ångström 1929) of the medium, with `frameRenderer.settings.spectral` only. It comes from the size of the particles: small particles block blue light more than red light. Extinction of each channel is `extinction * (wavelength / 550 nm)^-angstromExponent` (red 650 nm, green 550 nm, blue 450 nm). A preset of `frameAngstromExponents` (measured values) or a number:
  * `'cloud'` - `0`: cloud droplets, fog and ice. Grey, the same for all channels.
  * `'dust'` - `0.3`: desert dust (Dubovik et al. 2002).
  * `'smoke'` - `1.8`: biomass smoke and haze (Dubovik et al. 2002).
  * `'air'` - `4.09`: air molecules, Rayleigh scattering (Bodhaine et al. 1999).
* `extinctionScale: Three.Vector3 | [r, g, b]` - (default: `[1, 1, 1]`) extinction multiplier of each channel (linear), with `frameRenderer.settings.spectral` only. For media that the Ångström exponent does not describe.
* `phase: string` - (default: `'henyey-greenstein'`) phase function of directional, point and spot lights. It changes the light with the angle between the view ray and the light. Ambient, hemisphere, light probe and environment light stay isotropic. Used by `'volume'` lighting. `'frame'` lighting lights all volumes with one phase, from `frameRenderer.settings.phase`:
  * `'isotropic'` - the same light in all directions.
  * `'henyey-greenstein'` - one Henyey-Greenstein lobe with `phaseG`. Positive values scatter forward: a volume in front of the light gets bright edges (silver lining).
  * `'dual-lobe'` - a forward lobe (`phaseG`) and a back lobe (`phaseBackG`), mixed by `phaseBackWeight`.
  * `'lorenz-mie'` - tabulated Lorenz-Mie phase function of cumulus cloud droplets (550 nm, mean radius approximately 5 µm). A very strong, narrow forward peak (approximately 2700× isotropic), a wide forward lobe, the fogbow at approximately 143° and the glory at 180°. The table is made by `scripts/mie-phase-table.mjs`. `phaseG`, `phaseBackG` and `phaseBackWeight` are not used.
  * `'lorenz-mie-rgb'` (experimental) - the same droplets, with one Lorenz-Mie table for each color channel: red 650 nm, green 550 nm, blue 450 nm, with the refractive index of water at each wavelength. The droplets are larger relative to the shorter wavelengths, so the forward peak is narrower and higher: approximately 2000× (red), 2700× (green) and 4100× (blue) isotropic. Only the direct light of directional, point and spot lights changes: a red edge near the light (corona, silver lining), a blue fogbow and a red glory. The indirect light (multiple scattering) is the same as `'lorenz-mie'`, since `g` of the channels is less than 1% different. Works with `'frame'` and `'volume'` lighting, with `spectral` on or off. The tables are made by `scripts/mie-phase-table.mjs`. `phaseG`, `phaseBackG` and `phaseBackWeight` are not used.
* `phaseG: number` - (default: `0.8`, `-0.99` to `0.99`) forward lobe of `'henyey-greenstein'` and `'dual-lobe'`. `0.0` is isotropic. The light is relative to isotropic: with the view ray toward the light, `0.8` gives approximately 45× the light, with the light behind the camera approximately 0.06×.
* `phaseBackG: number` - (default: `-0.3`, `-0.99` to `0.99`) back lobe of `'dual-lobe'`.
* `phaseBackWeight: number` - (default: `0.2`, `0.0` to `1.0`) weight of the back lobe of `'dual-lobe'`.
* `phaseGExponent: number` - (default: `0.0`) experimental. `g` of each color channel for `'henyey-greenstein'` and `'dual-lobe'`: `g * (wavelength / 550 nm)^-phaseGExponent` (red 650 nm, green 550 nm, blue 450 nm), for `phaseG` and `phaseBackG`. Small particles scatter blue light more forward than red light: a blue glow toward the light, warmer light from the side. `0.0` is the same phase for all channels. Measured values (from `g` at 450 nm and 650 nm): cloud `0.02`, Saharan dust `0.08`, boreal smoke `0.34`, urban haze `0.39`, savanna smoke `0.51` (Dubovik et al. 2002). Only the direct light of directional, point and spot lights changes. The indirect light (multiple scattering) uses `g`. Works with `'frame'` and `'volume'` lighting, with `spectral` on or off.
* `absorbance: number` - (default: `1.0`) scales the self-shadowing. `0.0` gives no shadows.
* `densityScale: number` - (default: `1.0`) scales density of the entire grid.
* `normalizeDensity: boolean` - (default: `true`) density is divided by the mean density of the non-zero voxels, so `1.0` is the mean density (Kallweit et al. 2017, §4.2: 1 unit = 1 mean free path at the mean density). Then `extinction * densityScale` is the optical depth of the longest box side at the mean density. The same settings give about the same opacity for each VDB, also for VDBs with different density values. For example the Bunny Cloud (mean `0.30`) with `extinction: 100` looks the same as with `extinction: 350` and `false`. Use `normalizeDensity: false` and `extinction: 350` for the look of earlier versions. The mean is calculated one time, when the 3D texture is made. A `FrameVolumeAnimation` uses one mean for all frames (not a mean for each frame, which makes thin frames as dense as thick frames, so the brightness changes from frame to frame). `.wvdb` files keep the mean of the finest LOD in the header, so the mean does not change when the next LOD arrives. For `.wvdb` files with no mean (baked before this version), the mean comes from the data of each LOD.
* `densityCutoff: number` - (default: `0.0`) density at or below this value is empty. Defines sharpness of the shape.
* `opacity: number` - (default: `1.0`) opacity of the volume from the camera (doesn't affect light calculations.)
* `baseColor: Three.Color | string | number` - (default: `0xffffff`) albedo color of the volume.
* `scatterColor: Three.Color | string | number` - (default: `0x000000`) lowest color of the lit volume.
* `offset3D: Three.Vector3`, `wrap3D` - UV offset and wrapping (`Three.ClampToEdgeWrapping`, `Three.RepeatWrapping`, `Three.MirroredRepeatWrapping`) of the 3D textures.
* `emissiveGrid` - VDB emission grid. `emissiveIntensity` (default: `1.0`) scales the emission.
* `emissionSpectrum: string` - (default: `'approximate'`) color of the emission for each temperature (`temperatureRange`). Only the color changes. The brightness (temperature⁴, `emissiveIntensity`) stays the same.
  * `'approximate'` - Planck's law at 3 wavelengths (757, 505 and 379 nm). Flames look red.
  * `'planck'` (experimental) - Planck's law integrated with the CIE 1931 colour matching functions, converted to linear sRGB. A blackbody at 2000 K is orange, at 6500 K white. A table, made one time on the CPU.
  * `'soot'` (experimental) - `'planck'` with the emissivity of soot, `λ^-sootExponent`. Soot emits more blue than a blackbody, so flames look whiter and hotter.
* `sootExponent: number` - (default: `1.39`, `0.0` to `3.0`) emissivity exponent of `'soot'` (Hottel & Broughton 1932). `0.0` is the same as `'planck'`.
* `baseColorGrid` - VDB grid equivalent of `baseColor`.
* `maskGrid` - static VDB grid mask applied to each voxel. Not affected by UV offset.
* `lights` - bitmask of light types (`frameLights.useAmbientLights | frameLights.useDirectionalLights | frameLights.usePointLights | frameLights.useSpotLights | frameLights.useHemisphereLights | frameLights.useEnvironment`). Default: all light types.
* `shadowSteps: number` - (default: `32`) steps of the shadow march toward each light, inside the volume.
* `mipmaps: boolean` - (default: `true`) mipmaps of the 3D textures, made on the CPU (three.js WebGPU does not make 3D mipmaps). Far volumes and coarse shadow cascades sample a lower mip level. Without them, far volumes and shadows become noisy and blotchy. Cost: +25% memory for each grid, a CPU build of about 11 ms for a 128³ grid (one time, also for each new `.wvdb` LOD), and a second texture sample for each density sample.

All properties can be changed after creation, for example `frameVolume.extinction = 50.0` or `frameVolume.baseColor.set(0xff00ff)`.

#### Medium presets

`getFrameMediumProps( name )` gives `FrameVolume` props of a measured medium: `baseColor` (albedo, linear), `extinctionScale` (`[1, 1, 1]`), `angstromExponent`, `phase`, `phaseG` and `phaseGExponent`. Use them as constructor props, or assign them to a `FrameVolume` or `FrameVolumeAnimation`. Unknown names give `null`. The data is in `frameMediumPresets`.

```js
const volume = new OpenVDB.FrameVolume(vdb, { ...OpenVDB.getFrameMediumProps('dust'), extinction: 50.0 });

OpenVDB.frameRenderer.settings.spectral = true;
```

* `extinction` is not in a preset. It depends on the scale of the scene. A preset sets only the spectral shape of the extinction, the albedo and the phase.
* The Ångström exponent and the albedo of each channel need `frameRenderer.settings.spectral`. Without it, extinction is grey and multiple scattering uses the luminance of the albedo.
* `'frame'` lighting uses one phase for all volumes, from `frameRenderer.settings`. Assign the phase props to it too: `Object.assign(frameRenderer.settings, { phase, phaseG, phaseGExponent })`.
* Values are at 450, 550 and 650 nm (blue, green, red). A measured range gives its midpoint. A green albedo that is not measured is the mean of red and blue. `phaseG` is `g` at 550 nm (measured, or from the fit), `phaseGExponent` fits `g` at 450 and 650 nm.

| Name | Medium | Ångström exponent | Albedo R / G / B | Phase | Source |
| -- | -- | -- | -- | -- | -- |
| `'cloud'` | Cloud droplets | `0` | `1` / `1` / `1` | `'lorenz-mie-rgb'` (`g` 0.850 / 0.853 / 0.857) | Mie, Pope & Fry 1997 |
| `'fog'` | Fog | `0` | `1` / `1` / `1` | HG `g` `0.866` | Hess et al. 1998 (OPAC) |
| `'ice'` | Ice, cirrus | `0` | `1` / `1` / `1` | HG `g` `0.77` (0.76 to 0.78) | OPAC, Baran 2012 |
| `'soot'` | Fresh soot (black carbon) | `1.0` | `0.25` (0.20 to 0.30, flat) | HG `g` `0.35` (0.3 to 0.4, estimate) | Bond & Bergstrom 2006 |
| `'white-smoke'` | Boreal forest smoke | `1.65` (1.0 to 2.3) | `0.935` / `0.9375` / `0.94` | HG `g` `0.645`, exponent `0.335` | Dubovik et al. 2002 |
| `'dark-smoke'` | Savanna smoke | `1.8` (1.4 to 2.2) | `0.84` / `0.86` / `0.88` | HG `g` `0.577`, exponent `0.513` | Dubovik et al. 2002 |
| `'haze'` | Urban haze | `1.85` (1.2 to 2.5) | `0.97` / `0.975` / `0.98` | HG `g` `0.629`, exponent `0.386` | Dubovik et al. 2002 |
| `'dust'` | Saharan dust | `0.3` (-0.1 to 0.7) | `0.98` / `0.944` / `0.93` | HG `g` `0.752`, exponent `0.076` | Dubovik et al. 2002, Kim et al. 2011 |

#### Instances

- `frameVolume.createInstance( props ): FrameVolume`
- `animation.createInstance( props ): FrameVolumeAnimationInstance`

An instance shows the same volume or sequence at another place, with no new 3D textures. GPU memory does not grow with the number of instances. Each instance has its own transform and its own props. The props start from the props of the source, and `props` overrides them. LOD updates of a `.wvdb` source (`volumeData.attach( volume )`) show on all instances. `new FrameVolume( frameVolume, props )` also makes an instance.

An animation instance plays the frames of the source animation with its own `frame`, `fps`, `loop`, `play()`, `pause()`, `stop()` and `update( delta )`. Volume props (for example `extinction` or `baseColor`) apply only to the instance. It renders one `FrameVolume` instance, which shows the textures of the current frame. Call `animation.createInstance()` in `onLoad`, when the animation has frames. Frames that load later are used too.

Props that build the textures stay the same as the source: `resolution`, `dimensions`, `bbox`, `emissiveGrid`, `baseColorGrid`, `maskGrid`, and `emissiveScale` of `.wvdb` and converted data. For other voxel data, load the volume again.

`instance.dispose()` frees only the instance. Dispose the source after its instances. The source does not have to be in the scene.

```js
new OpenVDB.WVDBAnimationLoader()
  .setOptions({ emissiveGrid: 'flames' })
  .load(urls, (animation) => {
    for (let i = 0; i < 8; i++) {
      const explosion = animation.createInstance({ extinction: 100.0 });

      explosion.position.x = i * 10.0;
      explosion.frame = i * 10;
      explosion.play();
      scene.add(explosion);

      // NOTE Call explosion.update( delta ) in the render loop
    }
  });
```

#### Emission light

- `FrameEmissionLight( { color, intensity, resolution, range, cascades, distance, steps } ): Three.Light`

Lights the scene meshes with the emissive grids of all visible `FrameVolume` objects in the scene, also instances and animation frames. Add one to the scene. three.js lit materials get the light as diffuse irradiance.

1. Each volume that changes (new animation frame, other props, new transform) gets its emitted light. Rays go through the volume in 16 directions and add the emission, with the transmittance of the volume. Smoke in front of the flames blocks their light.
2. A probe grid around all emitting volumes adds their light. Each volume is a point light at the center of its visible emission.
3. Each lit pixel reads 6 texels (12 near the side of a cascade). This does not change with the number of volumes.

The passes run before the first lit mesh of each render, and only when a volume changes. In `three-openvdb` (`WebGPURenderer`, WebGPU and WebGL2) the light is a light node, and the passes run in its `updateBefore`, the same as shadow maps. In `three-openvdb/webgl` (`WebGLRenderer`) the lit materials of the scene get a shader patch (`onBeforeCompile`, after their own `onBeforeCompile`), and a child mesh of the light that draws nothing runs the passes first in the render list.

* `color`, `intensity` - (default: `0xffffff`, `1.0`) multiply the light.
* `resolution` - (default: `16`, `2` to `32`) probes on each axis of each cascade. The probe texture has the size for `32`, so changes do not make a new texture.
* `range` - (default: `3.0`) size of the probe grid, as a multiple of the box of all emitting volumes. Past the grid, the light falls off with distance squared.
* `cascades` - (default: `1`, max `4`) probe grid cascades. `1` is one grid for all volumes. More cascades add finer grids around the camera, each one half the size of the next. Use them when volumes are far apart. The probes are calculated again when the camera moves to a new grid cell.
* `distance` - (default: `512`) the finer cascades cover only this distance from the camera.
* `steps` - (default: `24`) emission samples on each ray, in a volume.

The light is physically scaled: a surface near a fireball gets a part of the fireball brightness. Increase `intensity` for a stronger light. `absorbance` of a volume scales its shadow, the same as for scene lights.

Limits: no specular light, no shadows of meshes, and the smoke of one volume does not block the light of another volume. Each volume sends the same light in all directions.

Froxel grid settings are global, in `frameRenderer.settings`:

* `width`, `height` - (default: `512`, `512`) froxels on the screen axes. Not more than the pixels of the canvas (drawing buffer) on each axis.
* `pixelsPerFroxel` - (default: `0`) with `N` above `0`, at most one froxel for each `N` × `N` canvas pixels (CSS pixels, `renderer.getSize`), for small screens. Each pass costs per froxel, and a phone canvas (for example 392 × 740) gets many more froxels for each pixel than a desktop one. `0` keeps only the drawing buffer limit. A canvas that changes by less than 15% (the address bar of a mobile browser) keeps its grid, because a new grid drops the temporal history.
* `depth` - (default: `24`) depth slices. Slices are exponential: thin near the camera, thick far away. Slices fit the visible volumes.
* `subSteps` - (default: `32`) density samples along the view ray in each slice. Each froxel is lit at the visibility-weighted mean position of its samples, then stored as slice color and alpha.
* `near`, `far` - (default: `0.1`, `512.0`) limits of the slice range in view depth.
* `fadeRadius` - (default: `Infinity`) view distance where the volume density is `0`. Density fades from the camera to this distance, as `FogExp2`: `exp(-4 x²)` with `x = distance / fadeRadius`, scaled to `1` at the camera and `0` at the radius. Shadows and lights do not change. `Infinity` or `0`: no fade.
* `jitter` - (default: `false`) moves sub-steps and shadow samples by a small random amount each frame. Banding becomes fine noise.
* `temporal` - (default: `true`) blends each frame with the reprojected froxels of the previous frames. This removes the jitter noise. The history is clamped to the current froxels to limit ghosting.
* `temporalBlend` - (default: `0.2`) weight of the new frame. Lower values are smoother, higher values react faster to motion.
* `lighting` - (default: `'frame'`) lighting model:
  * `'frame'` - all volumes are written into the froxels first (density and material only). World-space shadow grid cascades hold the extinction of all volumes, also volumes out of the view. Transmittance to each light is calculated one time in the grid. Then each froxel is lit one time. Volumes shadow each other, and the number of render calls does not grow with the number of volumes. Good for many overlapping volumes, for example cloud fields.
  * `'volume'` - each volume is lit alone. Shadows come only from the same volume. Good for a small number of dense volumes with sharp edges.
* `shadowResolution` - (default: `64`) voxels on each axis of each shadow grid cascade (`'frame'` lighting only).
* `shadowCascades` - (default: `1`, max `4`) shadow grid cascades. The last cascade fits all volumes. Each finer cascade is half the size, around the camera. Shadows are dense near the camera and sparse far away (`'frame'` lighting only). Finer cascades follow the camera, so near volumes draw the shadow grid again on each camera move. They cost much GPU time.
* `shadowDistance` - (default: `512`) the finer shadow grid cascades cover only this distance from the camera. The last cascade covers all volumes, with coarser voxels (`'frame'` lighting only).
* `phase`, `phaseG`, `phaseBackG`, `phaseBackWeight`, `phaseGExponent` - (default: `'henyey-greenstein'`, `0.8`, `-0.3`, `0.2`, `0.0`) one phase function for all volumes with `'frame'` lighting. The values are the same as the `FrameVolume` phase props. `'volume'` lighting uses the phase props of each `FrameVolume`.
* `environmentLighting` - (default: `'directional'`) environment light (`scene.environment`) of the volumes, with self-shadowing:
  * `'outward'` - one environment sample along the outward direction from the volume center. Its shadow is one march along that direction (`'volume'` lighting), or the blend of the sky up and sky down shadows of the grid (`'frame'` lighting). Light from the horizon or from a sun in the environment gets no matching shadow.
  * `'directional'` - the environment as `environmentSamples` directional lights (Disney "Deep Scattering", §4.4). The first light is at the brightest part of the environment (for example a sun). The other lights are at the zenith, the nadir and on the horizon. Each part of the environment goes to the nearest light, and each light gets the energy of its part, at its energy-weighted center. Each light has its own shadow march.
  * `'spherical-harmonics'` - the environment as spherical harmonics (`environmentShOrder` `1` or `2`), with SH-projected transmittance (§7). The transmittance is marched along 6 (L1) or 12 (L2) fixed directions, projected to SH and multiplied with the environment SH. Soft light, no sharp sun shadow, no shadow slot. SH can ring: with a strong sun, a voxel that is shadowed from the side opposite the sun can get a bit more light than an unshadowed voxel.
* `environmentSamples` - (default: `8`, `1` to `8`) directional lights of `'directional'`.
* `environmentShOrder` - (default: `1`) SH order of `'spherical-harmonics'`: `1` (4 coefficients, 6 directions) or `2` (9 coefficients, 12 directions).
* `multipleScattering` - (default: `'neural'`) multiple scattering. Modes: `false` (off, single scattering), `true` (1D diffusion, below), `'two-sided'` (2D diffusion), `'octaves'` and `'neural'`. `true`: in the shadows of all lights (scene lights, hemisphere lights, light probes and the environment), with `'frame'` and `'volume'` lighting. Light that scatters again inside the volume goes deep into it, so white volumes (for example clouds) are white inside, not grey. Diffusion approximation: the total transmittance is `exp(-effective) / (1 + 0.75 * reduced)`, never less than the direct transmittance `exp(-opticalDepth)`. `reduced` is the scattering optical depth multiplied by `1 - g` (asymmetry `g` of the phase function: `'frame'` lighting `frameRenderer.settings`, `'volume'` lighting each `FrameVolume`, Lorenz-Mie `g = 0.8526`). `effective` comes from the absorption `1 - albedo` (linear luminance of `baseColor` and `baseColorGrid`). Dark volumes (for example smoke) absorb the scattered light, so they keep sharp shadows. Only the direct light gets the phase function. The scattered light is isotropic. `false` is single scattering (the earlier look).
  * `'octaves'` (experimental) - direct and indirect light are separate. The direct light is the same as `false`: `phase * exp(-opticalDepth)`. The indirect light is `scatteringOctaves` octaves. Octave `n` (`1` to `N`) has the extinction multiplied by `a^n`, the light multiplied by `b^n` and the phase `g` multiplied by `c^n` (Lorenz-Mie: Henyey-Greenstein with `g = 0.8526 * c^n`). Higher orders of scattering are smooth, so a flatter phase and less extinction are a good approximation. Light goes deep into dense volumes, and back-lit volumes keep the silver lining of the direct light. Isotropic lights (hemisphere lights, light probes, the environment) get `exp(-opticalDepth)` and the octaves with no phase. Octaves use the optical depth of the shadow march, there is no march for each octave. But the march stops later (when `opticalDepth * a^N` is more than the limit), so more octaves and a smaller `a` cost more. Volumes with no shadow also get the octave light, `1 + b + ... + b^N` of the light. Absorption (`baseColor`) does not change the octaves.
  * `'two-sided'` - 2D diffusion: the shadows of directional, point and spot lights also march away from the light. Diffusion with a collimated source in the volume between the light side and the far side: front reduced depth `f` (toward the light), back reduced depth `b` (away from the light), `L = f + b`. Light also leaves at the sides: the volume is as wide as it is deep, so `phi'' - k^2 phi = -3 exp(-x)` with `k^2 = 2 (PI / (L + 2 z0))^2`, Robin boundaries, `z0 = 2/3`. Total: `(phi + exp(-f)) * exp(-effective front)`, never less than the direct light. Light that scatters back out of the volume is not lost, as it is with `true`, so lit sides are brighter. Isotropic lights are the same as `true`. Cost: one more shadow march for each scene light. Path tracer, held-out scenes: mean error 59%, bias +10%. `'frame'` and `'volume'` lighting, spectral
  * `'neural'` (default, experimental) - the scattered light of the scene lights (directional, point and spot, and the dominant environment light) comes from a small neural network, trained on a path tracer. Only grey `'frame'` lighting: with `'volume'` lighting, with `spectral: true` and for the other isotropic lights (sky, hemisphere, environment grid) it is the same as `true`. The direct light is the same as `true`. At each world shadow grid voxel, the network reads the extinction of 6 mip levels of the last grid cascade (at the voxel, and at 1 to 32 voxels toward and away from the light), the direct optical depth of the shadow march and the albedo. Network: 20 inputs, 2 hidden layers of 32, about 1.7k multiply-adds for each voxel and light, weights are constants in the shader (`core/frameNeuralIndirect.js`). It runs only when the shadow grid is drawn again (a light or a volume changes). Extra memory: 5 small mip targets of the grid. Training phase: Henyey-Greenstein `g = 0.8` (the default `phase`). On held-out path-traced scenes, the mean error of the scattered light is 37% (bias +2%), `true` 65% (bias -51%), `'two-sided'` 59% (bias +10%), `'octaves'` 127% (bias +48%), with 25% of each from the noise of the path tracer (`scripts/neural-indirect/compare.mjs`). Dense white volumes get more light inside than with `true`. The training scripts are in `scripts/neural-indirect` (`dataset.mjs`, then `train.mjs`, Node only).
* `scatteringOctaves` - (default: `4`, `1` to `8`) number `N` of indirect light octaves of `multipleScattering: 'octaves'`.
* `scatteringOctaveExtinction` - (default: `0.5`, `0` to `1`) extinction multiplier `a` of each octave.
* `scatteringOctaveContribution` - (default: `0.5`, `0` to `1`) light multiplier `b` of each octave.
* `scatteringOctavePhase` - (default: `0.5`, `0` to `1`) phase `g` multiplier `c` of each octave. `0` makes the octaves isotropic.
* `spectral` - (default: `false`) extinction and multiple scattering of each color channel. Extinction of each channel comes from `angstromExponent` and `extinctionScale` of each `FrameVolume`. View transmittance, self-shadows, the shadow grid, multiple scattering and volume shadow maps (`castShadows`) are calculated for each channel. Multiple scattering uses the albedo (`baseColor`, `baseColorGrid`) of each channel, not its luminance: in the diffusion approximation (`multipleScattering: true`) as the absorption of each channel, and with `'octaves'` octave `n` gets `albedo^n`. Thin smoke looks blue, and light through smoke turns orange and red. Thick dust becomes orange. Grey volumes (`angstromExponent: 'cloud'`, scale `[1, 1, 1]`, grey `baseColor`) look the same as with `false` (with `'octaves'`, a non-white `baseColor` makes the octaves darker). `false` has no extra cost. Cost and memory with `true`:
  * `'frame'` lighting: the shadow grid has two RGBA targets (extinction and absorption of each channel). The light slots are in groups: group 0 has the sky (up and down) and the first light, and each next group has 2 more lights (at most 4 groups). The transmittance pass runs one time for each group in use, into 3 targets for each group. Each direction is marched one time, the same as with `false`, with the depths of each channel. The lighting pass samples only the targets of the groups in use (3 for the sky and one light). Light slots are sampled at the visible position of all volumes in a froxel, not of each volume. The density pass has 3 targets (not 4).
  * Both lightings: the froxel atlas and the 2 temporal history targets get one more RG half float target (red and blue alpha). With 512 × 512 × 24 froxels, approximately +75 MB.
  * `castShadows`: each light has a second shadow map, and each map piece is drawn two times. `ShadowMaterial` gets the mean of the channels.
  * The volume is composited over the scene with the transmittance of each channel: `three-openvdb` reads the scene color (also with `srgbBlending: false`), `three-openvdb/webgl` has one more fullscreen pass.
* `srgbBlending` - (default: `true`) blends the volumes over the scene in sRGB, the same as `WebGLRenderer` did. `false` blends in linear space, the default of `WebGPURenderer`. Linear blending makes thin fog brighter. With tone mapping, `three-openvdb` blends the HDR colors without a clamp, because `WebGPURenderer` tone maps after the blend.
* `castShadows` - (default: `false`) volumes cast shadows on meshes, for directional, point and spot lights with `castShadow` (see Volume shadows).
* `castShadowMapSize` - (default: `512`) texels on each side of a volume shadow map (of each cascade tile and cube face).
* `castShadowCascades` - (default: `1`, max `4`) cascades of the volume shadow map of a directional light.
* `castShadowDistance` - (default: `4000`) the largest view distance of the cascades.
* `castShadowSteps` - (default: `32`) grid samples on each light ray of a volume shadow map.
* `castShadowUpdatesPerFrame` - (default: `1`) volume shadow map pieces made again in one render (a cascade tile or a spot map counts 1, a cube map 6). Pieces that wait are older for some frames.
* `castShadowCoarse` - (default: `false`) 64-texel maps and 8 samples: soft blob shadows at almost no cost.

With `mipmaps`, large froxels far away sample a lower mip level, so small details fade to transparent.

With `'frame'` lighting, the first directional, point and spot lights (6 in total) cast shadows. Hemisphere lights and light probes use the shadow grid in the up and down directions. The environment (`scene.environment`) lights each volume along its outward direction, the same as `'volume'` lighting. Its shadow is between the up and down shadows of the grid. Ambient light has no shadow. `lights` and `shadowSteps` are not used, `scatterColor` is added as emission, and `absorbance` scales the shadow of each volume.

Environment lights and shadow slots (`'frame'` lighting): scene lights always get the first of the 6 shadow slots. With `'directional'`, only the dominant environment light (the brightest, for example a sun) takes the next free slot, so its shadow has the detail of all cascades. All other environment lights (the sky and horizon lights, all `'spherical-harmonics'` directions, and the dominant light when no slot is free) go to the environment grid: the environment light of each voxel of the last cascade, marched in the last cascade only, in one more render target. The last cascade fits all volumes and does not follow the camera, so this grid is calculated again only when a volume or the environment lights change (transform, `extinction`, `densityScale`, `normalizeDensity`, `densityCutoff`, `absorbance`, `offset3D`, `wrap3D`, `mipmaps`, a new animation frame or texture data). Its shadows are as coarse as the last cascade. With `'volume'` lighting, each environment light is marched in the volume (no slots, no grid). The `useEnvironment` bit of `lights` turns the environment on or off for each volume.

The environment is read one time into a small 64×32 map on the GPU (blurred PMREM, then an asynchronous readback), when `scene.environment`, its `version` or `scene.environmentRotation` change. Until the map is ready, and with no `scene.environment`, `'outward'` is used. `scene.environmentIntensity` changes need no new map. Environment lights are isotropic: the phase function is not used.

Limits: with `'volume'` lighting, volumes do not shadow other volumes, and point and spot lights have no distance falloff. The first 16 directional, point and spot lights light the volumes. With `'volume'` lighting, the first 4 hemisphere lights are used. Logarithmic depth buffers are not supported.

#### Volume shadows

```js
renderer.shadowMap.enabled = true;
OpenVDB.frameRenderer.settings.castShadows = true;

light.castShadow = true;
mesh.receiveShadow = true;
```

With `castShadows`, each directional, point and spot light with `castShadow` gets a volume shadow map (a Beer shadow map). The map is made from the world shadow grid of the frame renderer (the extinction of all volumes, the same grid as `'frame'` lighting): each texel samples its light ray `castShadowSteps` times in the last grid cascade (the cascade that covers all volumes), and keeps the optical depth and the depths where the density starts and ends. A mesh that receives shadows multiplies the three.js shadow with the volume transmittance at its depth. Mesh shadows and volume shadows add up, also for meshes in a volume. Volumes out of the view cast shadows too.

Directional lights use cascades of the view, the same as three.js `CSMShadowNode`: near the camera the shadows are fine, far away coarse. The cascades end behind the volumes (the far corner of the volume box plus one box diagonal), up to `castShadowDistance`. Spot lights use the light shadow camera, point lights a cube map.

Cost: the number of volumes and the camera do not change the cost of a map piece (a fixed number of samples for each texel). A piece is made again only when its camera, the volumes or the grid change, and at most `castShadowUpdatesPerFrame` pieces in a render, the oldest first. A static scene has no volume shadow passes. With `'volume'` lighting, `castShadows` makes only the last grid cascade, and only when it changes. Each lit pixel reads one texel for each shadow light.

`three-openvdb` (`WebGPURenderer`): the volume shadow uses `light.shadow.filterNode`. A filter set before is kept and multiplied. Lights with a shadow from before `castShadows` get a new shadow node, so their materials compile again one time.

`three-openvdb/webgl` (`WebGLRenderer`): lit materials (`MeshStandardMaterial`, `MeshPhysicalMaterial`, `MeshLambertMaterial`, `MeshPhongMaterial`, `MeshToonMaterial`) and `ShadowMaterial` get a shader patch (`onBeforeCompile`, after their own `onBeforeCompile`). After the three.js shadow of each light, it multiplies the volume transmittance. A child mesh of each shadow light that draws nothing makes the maps first in the render list. The first 4 shadow lights of each type get volume shadows. Point lights need the `PCFShadowMap` or `BasicShadowMap` shadow type.

Limits: three.js applies the volume shadow only in the light shadow camera, the same as mesh shadows. Shadow detail is set by the voxels of the last grid cascade (`shadowResolution`). One start and one end depth for each texel, so two volumes on one light ray give one smooth shadow between them. Volumes out of the light shadow camera cast no shadow, the same as meshes.

---

### LevelSetMesh

- `LevelSetMesh( grid: OpenVDB.GridDescriptor | WVDBVolumeData grid, { material, resolution }, onConverted: ( mesh ) => void ): Three.Mesh`

A level set stores the signed distance to a surface. `FrameVolume` shows a level set as fog (density `1.0` in the narrow band). `LevelSetMesh` shows the surface as triangles (marching cubes, normals from the distance gradient). It works with all three.js materials, lights and shadows. Default material: `MeshStandardMaterial`.

A `GridDescriptor` is sampled on the CPU at `resolution` texels on the longest box side (default `200`). The narrow band is often thinner than a texel, so texels that cross the surface use the mean of 4x4x4 samples (`sampleLevelSet` of `openvdb`, also used by the `wvdb` CLI). A level set grid of `WVDBVolumeData` uses the texels of its newest LOD. Call `volumeData.attach( mesh )`, so the mesh builds again when a new LOD arrives. The build runs in 12 ms steps, so the page does not freeze. `mesh.bbox` is the world box of the grid. `mesh.createInstance()` gives a `Three.Mesh` with the same geometry and material. `mesh.dispose()` frees the geometry, and the default material.

```js
new OpenVDB.WVDBLoader().load('./assets/venusstatue.wvdb', (volumeData) => {
  const mesh = new OpenVDB.LevelSetMesh(Object.values(volumeData.grids)[0]);

  volumeData.attach(mesh);
  scene.add(mesh);
});
```

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

Options: `--output`, `--grids <a,b>`, `--resolution` (default `128`, texels on the longest box side of the finest LOD, texels are cubes), `--lods` (default `3`), `--bits` (`8` or `16`, default `8`), `--layout` (`sparse` or `dense`, default `sparse`), `--page-bricks` (default `1024`), `--jobs` (files converted at the same time, default: CPU core count).

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

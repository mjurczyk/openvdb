# Rendering frame

In each frame, all visible `FrameVolume` objects are written into one frustum-aligned voxel grid (froxels). One fullscreen pass marches that grid, so overlapping volumes mix correctly. Use a normal `renderer.render(scene, camera)` call. The march stops at the depth buffer of that render, so a render target must have a depth buffer.

Differences of `three-openvdb/webgl` (`WebGLRenderer`, three.js below r187) are marked **WebGPU only** and **`three-openvdb/webgl`**.

## FrameVolume

- `new FrameVolume( source, props, onConverted, onProgress ): Three.Group`

`source` is one of:

- `OpenVDBReader`: all grids of the file.
- `GridDescriptor` or `Array<GridDescriptor>`.
- `Uint8Array`: raw density texels, with `dimensions`.
- `FrameVolume`: an instance of that volume. See [Instances](#instances).

`onConverted()` is called when all grids are converted. `onProgress({ convertedVoxels, totalVoxels, convertedGrids, totalGrids })` is called during the conversion.

### Build props

These props make the 3D textures. Set them in the constructor. Changes after creation have no effect.

- `resolution: number` - (default: `200`) texels on the longest box side of each grid.
- `dimensions: [x, y, z]` - raw data only: texels on each axis. Default: `resolution` on each axis.
- `bbox: Three.Box3` - world box of all grids. Default: the box of each grid. Frames of a sequence share one box, so voxels do not move.
- `progressive: boolean` - (default: `false`) show the volume while it converts.
- `emissiveGrid: GridDescriptor | Uint8Array` - emission grid.
- `emissiveScale: number` - (default: `1.0`) emission grid value that maps to the top of `temperatureRange`.
- `baseColorGrid: GridDescriptor | Uint8Array` - albedo grid (vector grid, or RGBA texels). Replaces `baseColor`.
- `maskGrid: GridDescriptor | Uint8Array` - static mask of each voxel. `offset3D` does not move it.
- `levelSets: 'surface' | 'fog' | 'surfaceOnly'` - (default: `'surface'`) level set grids (`class` metadata of the grid). See [LevelSetSurface](../levelset/README.md#levelsetsurface).
  - `'surface'` - each level set grid is a `LevelSetSurface` child. Other grids are fog.
  - `'fog'` - density `1.0` in the narrow band.
  - `'surfaceOnly'` - only the level set surfaces show.
- `points: 'points' | 'fog'` - (default: `'points'`) point data grids. See [VDBPoints](../points/README.md).
  - `'points'` - each point data grid is a `VDBPoints` child. Other grids are fog.
  - `'fog'` - density from the points in each voxel.

Level set and points children are in `frameVolume.surfaces`.

### Density

- `extinction: number` - (default: `100.0`) optical depth of the longest box side. With `normalizeDensity`, at the mean density. Without it, at density `1.0`.
- `densityScale: number` - (default: `1.0`) multiplies the density.
- `normalizeDensity: boolean` - (default: `true`) divides the density by the mean density of the non-zero voxels. The same props then give about the same opacity for each VDB. Use `false` and `extinction: 350` for the look of earlier versions. A `FrameVolumeAnimation` uses one mean for all frames. `.wvdb` files keep the mean of the finest LOD, so it does not change when a new LOD arrives.
- `densityCutoff: number` - (default: `0.0`) density at or below this value is empty.
- `opacity: number` - (default: `1.0`) opacity of the volume from the camera. Lighting does not change.
- `absorbance: number` - (default: `1.0`) multiplies the self-shadowing. `0.0` gives no shadows.
- `offset3D: Three.Vector3` - (default: `(0, 0, 0)`) UV offset of the 3D textures.
- `wrap3D: number` - (default: `Three.ClampToEdgeWrapping`) wrapping of the 3D textures: `Three.ClampToEdgeWrapping`, `Three.RepeatWrapping` or `Three.MirroredRepeatWrapping`.

### Color and lights

- `baseColor: Three.Color | string | number` - (default: `0xffffff`) albedo.
- `scatterColor: Three.Color | string | number` - (default: `0x000000`) lowest color of the lit volume. With `'frame'` lighting it is added as emission.
- `lights: number` - (default: all) bitmask of `frameLights`: `useAmbientLights`, `useDirectionalLights`, `usePointLights`, `useSpotLights`, `useHemisphereLights`, `useEnvironment`. With `'frame'` lighting only `useEnvironment` is used.
- `shadowSteps: number` - (default: `32`) shadow march steps toward each light. `'volume'` lighting only.
- `mipmaps: boolean` - (default: `true`) mip levels of the 3D textures, made on the CPU. Far volumes and coarse shadow cascades read a lower level, so they are not noisy. Cost: +25% memory for each grid.
  - An instance can have its own value. A volume and its instances share their mip levels: the first one with `mipmaps` makes them, and they stay. Volumes without `mipmaps` read level 0.
- `mipmapFilter: 'box' | 'gaussian'` - (default: `'box'`) filter of the mip levels.
  - `'box'` - mean of 2 × 2 × 2 texels.
  - `'gaussian'` - Gaussian with sigma = 2^i voxels at level i. Less shimmer on far volumes and in motion. Built on the CPU in 12 ms steps after the conversion, box levels show until then (about 80 ms for 128³, 530 ms for 256³).
  - A volume and its instances share their mip levels. Give them the same filter. **`three-openvdb/webgl`**: a CPU copy of the Gaussian levels stays in memory (about 1/7 of the grid).

### Phase

The phase function changes the light of directional, point and spot lights with the angle between the view ray and the light. Other lights are isotropic. `'volume'` lighting only.

- `phase: string` - (default: `'dual-lobe'`):
  - `'isotropic'` - the same light in all directions.
  - `'henyey-greenstein'` - one lobe with `phaseG`.
  - `'dual-lobe'` - a forward lobe (`phaseG`) and a back lobe (`phaseBackG`), mixed by `phaseBackWeight`.
  - `'lorenz-mie'` - tabulated Lorenz-Mie phase of cloud droplets (550 nm, mean radius approximately 5 µm). Strong forward peak, fogbow and glory. The `phaseG` props are not used.
  - `'lorenz-mie-rgb'` (experimental) - `'lorenz-mie'` with one table for each color channel (650, 550 and 450 nm). Adds a red corona, a blue fogbow and a red glory to the direct light.
- `phaseG: number` - (default: `0.8`, `-0.99` to `0.99`) forward lobe. Positive values scatter forward. `0.0` is isotropic.
- `phaseBackG: number` - (default: `-0.3`, `-0.99` to `0.99`) back lobe of `'dual-lobe'`.
- `phaseBackWeight: number` - (default: `0.2`, `0.0` to `1.0`) weight of the back lobe of `'dual-lobe'`.
- `phaseGExponent: number` - (default: `0.0`) experimental. `g` of each channel for `'henyey-greenstein'` and `'dual-lobe'`: `g * (wavelength / 550 nm)^-phaseGExponent`. `0.0` is the same `g` for all channels. Only the direct light changes.

### Spectral

These props need `frameRenderer.settings.spectral`.

- `angstromExponent: string | number` - (default: `'cloud'`) Ångström exponent of the medium. Extinction of each channel is `extinction * (wavelength / 550 nm)^-angstromExponent`. A number, or a preset of `frameAngstromExponents`:
  - `'cloud'` - `0`: droplets, fog and ice. Grey.
  - `'dust'` - `0.3`: desert dust.
  - `'smoke'` - `1.8`: smoke and haze.
  - `'air'` - `4.09`: air molecules (Rayleigh).
- `extinctionScale: Three.Vector3 | [r, g, b]` - (default: `[1, 1, 1]`) extinction multiplier of each channel.

### Emission

- `emissiveIntensity: number` - (default: `1.0`) multiplies the emission.
- `temperatureRange: [min, max] | Three.Vector2` - (default: `[0, 6500]`) temperature in Kelvin for emission grid value `0` and `emissiveScale`.
- `emissionSpectrum: string` - (default: `'approximate'`) color of each temperature. The brightness does not change.
  - `'approximate'` - Planck's law at 3 wavelengths. Flames look red.
  - `'planck'` (experimental) - Planck's law with the CIE 1931 color matching functions. 2000 K is orange, 6500 K is white.
  - `'soot'` (experimental) - `'planck'` with the emissivity of soot (`λ^-sootExponent`). Flames look whiter.
- `sootExponent: number` - (default: `1.39`, `0.0` to `3.0`) emissivity exponent of `'soot'`. `0.0` is the same as `'planck'`.

### Medium presets

`getFrameMediumProps( name )` gives the props of a measured medium: `baseColor`, `extinctionScale`, `angstromExponent`, `phase`, `phaseG` and `phaseGExponent`. Unknown names give `null`. The data is in `frameMediumPresets`. `extinction` is not in a preset, because it depends on the scale of the scene.

```js
const volume = new OpenVDB.FrameVolume(vdb, { ...OpenVDB.getFrameMediumProps('dust'), extinction: 50.0 });

const { phase, phaseG, phaseGExponent } = OpenVDB.getFrameMediumProps('dust');
Object.assign(OpenVDB.frameRenderer.settings, { phase, phaseG, phaseGExponent });
```

| Name | Medium | Ångström exponent | Albedo R / G / B | Phase | Source |
| -- | -- | -- | -- | -- | -- |
| `'cloud'` | Cloud droplets | `0` | `1` / `1` / `1` | `'lorenz-mie-rgb'` | Mie, Pope & Fry 1997 |
| `'fog'` | Fog | `0` | `1` / `1` / `1` | HG `g` `0.866` | Hess et al. 1998 (OPAC) |
| `'ice'` | Ice, cirrus | `0` | `1` / `1` / `1` | HG `g` `0.77` | OPAC, Baran 2012 |
| `'soot'` | Fresh soot (black carbon) | `1.0` | `0.25` | HG `g` `0.35` | Bond & Bergstrom 2006 |
| `'white-smoke'` | Boreal forest smoke | `1.65` | `0.935` / `0.9375` / `0.94` | HG `g` `0.645`, exponent `0.335` | Dubovik et al. 2002 |
| `'dark-smoke'` | Savanna smoke | `1.8` | `0.84` / `0.86` / `0.88` | HG `g` `0.577`, exponent `0.513` | Dubovik et al. 2002 |
| `'haze'` | Urban haze | `1.85` | `0.97` / `0.975` / `0.98` | HG `g` `0.629`, exponent `0.386` | Dubovik et al. 2002 |
| `'dust'` | Saharan dust | `0.3` | `0.98` / `0.944` / `0.93` | HG `g` `0.752`, exponent `0.076` | Dubovik et al. 2002, Kim et al. 2011 |

## FrameVolumeAnimation

A `FrameVolumeAnimation` is a `Three.Group` that shows one `FrameVolume` of `frames` at a time.

- `play()`, `pause()`, `stop()`, `update( delta )` - call `update` in the render loop, with the time in seconds since the last call.
- `frame` - (number) index of the current frame.
- `fps` - (default: `24`), `loop` - (default: `true`).
- `frames`, `loadedFrames`, `totalFrames`, `bbox`.
- `FrameVolume` props (for example `extinction` or `baseColor`) set on the animation apply to all frames, also frames that load later.
- `dispose()` stops the downloads and frees all frames.

## Instances

- `frameVolume.createInstance( props ): FrameVolume`
- `animation.createInstance( props ): FrameVolumeAnimationInstance`

An instance shows the same volume or sequence at another place. It has no new 3D textures, so GPU memory does not grow. Each instance has its own transform and props. The props start from the source, and `props` overrides them. Build props stay the same as the source. `new FrameVolume( frameVolume, props )` also makes an instance.

An animation instance has its own `frame`, `fps`, `loop`, `play()`, `pause()`, `stop()` and `update( delta )`. Call `animation.createInstance()` in `onLoad`.

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

## frameRenderer.settings

Global settings of all volumes: `OpenVDB.frameRenderer.settings`.

### Froxel grid

- `width`, `height: number` - (default: `512`, `512`) froxels on the screen axes. Not more than the canvas pixels.
- `pixelsPerFroxel: number` - (default: `0`) above `0`: at most one froxel for each `N` × `N` CSS pixels. Use it on small screens. `0`: no limit.
- `depth: number` - (default: `24`) depth slices. Thin near the camera, thick far away.
- `subSteps: number` - (default: `32`) density samples along the view ray in each slice.
- `near`, `far: number` - (default: `0.1`, `Infinity`) limits of the slices in view depth.
- `fadeRadius: number` - (default: `Infinity`) view distance where the density fades to `0` (as `FogExp2`). `Infinity` or `0`: no fade.
- `temporal: boolean` - (default: `true`) blends each frame with the reprojected froxels of the previous frames.
- `temporalBlend: number` - (default: `0.2`) weight of the new frame. Lower values are smoother, but react slower to motion.

### Lighting

- `lighting: 'frame' | 'volume'` - (default: `'frame'`):
  - `'frame'` - all volumes share world-space shadow grid cascades. Volumes shadow each other, also volumes out of the view. The cost does not grow much with the number of volumes. Good for many overlapping volumes, for example cloud fields.
  - `'volume'` - each volume is lit alone, with its own shadow march. Good for a few dense volumes with sharp edges.
- `shadowResolution: number` - (default: `64`) voxels on each axis of each shadow grid cascade. `'frame'` lighting.
- `shadowCascades: number` - (default: `1`, max `4`) shadow grid cascades. The last cascade fits all volumes. Each finer cascade is half the size, around the camera. Finer cascades are drawn again when the camera moves, so they cost much GPU time. `'frame'` lighting.
- `shadowDistance: number` - (default: `512`) view distance of the finer shadow cascades. `'frame'` lighting.
- `phase`, `phaseG`, `phaseBackG`, `phaseBackWeight`, `phaseGExponent` - (default: `'dual-lobe'`, `0.8`, `-0.3`, `0.2`, `0.0`) phase of all volumes with `'frame'` lighting. The values are the same as the [FrameVolume phase props](#phase).
- `environmentLighting: string` - (default: `'directional'`) light of `scene.environment`:
  - `'directional'` - the environment as `environmentSamples` directional lights, each with its own shadow. The first light is at the brightest part (for example a sun).
  - `'spherical-harmonics'` - the environment as spherical harmonics (`environmentShOrder`). Soft light, no sharp sun shadow. A strong sun can give a small ringing error.
  - `'outward'` - one environment sample along the outward direction from the volume center. Low cost. Light from the horizon or a sun gets no matching shadow.
- `environmentSamples: number` - (default: `8`, `1` to `8`) lights of `'directional'`.
- `environmentShOrder: number` - (default: `1`) `1` (4 coefficients) or `2` (9 coefficients).

With `'frame'` lighting, the first 6 directional, point and spot lights cast shadows. With `'directional'` environment light, the brightest environment light uses a free slot of the 6. The other environment lights use the last cascade only.

### Multiple scattering

Light that scatters again inside the volume. White volumes (for example clouds) stay white inside. Dark volumes (for example smoke) absorb it and keep sharp shadows.

- `multipleScattering` - (default: `'neural'`):
  - `'neural'` (experimental) - the scattered light of the scene lights comes from a small neural network, trained on a path tracer (Henyey-Greenstein `g = 0.8`). It runs only with grey `'frame'` lighting: with `spectral: true` or `'volume'` lighting it is the same as `true`. Extra memory: 5 small mip targets of the grid.
  - `true` - 1D diffusion approximation toward the light.
  - `'two-sided'` - 2D diffusion: toward and away from the light. Lit sides are brighter. Cost: one more shadow march for each scene light.
  - `'multi-scale'` (experimental) - the scattered light comes from the density mip levels toward the light, with no network. Light goes around small dense parts. Only grey `'frame'` lighting, else the same as `true`. Cost: `5 * multiScaleLevels` grid samples for each voxel and light.
  - `'octaves'` (experimental) - the indirect light is a sum of octaves with less extinction, less light and a flatter phase. Back-lit volumes keep the silver lining.
  - `false` - single scattering.
- `multiScaleLevels: number` - (default: `6`, `1` to `6`) mip levels of `'multi-scale'`. Fewer levels cost less and reach less far.
- `scatteringOctaves: number` - (default: `4`, `1` to `8`) octaves `N` of `'octaves'`.
- `scatteringOctaveExtinction: number` - (default: `0.5`, `0` to `1`) extinction multiplier `a` of octave `n` (`a^n`).
- `scatteringOctaveContribution: number` - (default: `0.5`, `0` to `1`) light multiplier `b` of octave `n` (`b^n`).
- `scatteringOctavePhase: number` - (default: `0.5`, `0` to `1`) phase `g` multiplier `c` of octave `n` (`c^n`). `0` is isotropic.

### Spectral

- `spectral: boolean` - (default: `true`) extinction and multiple scattering of each color channel, with the albedo of each channel. Thin smoke looks blue, and light through smoke turns orange. Grey volumes look the same as with `false`. Cost: more render targets and passes, approximately +75 MB with 512 × 512 × 24 froxels.

### Blending

- `srgbBlending: boolean` - (default: `true`) **WebGPU only**. Blends the volumes over the scene in sRGB, the same as `WebGLRenderer`. `false` blends in linear space, so thin fog is brighter. `three-openvdb/webgl` always blends in sRGB.

### Volume shadows

Volumes cast shadows on meshes, for directional, point and spot lights with `castShadow`.

```js
renderer.shadowMap.enabled = true;
OpenVDB.frameRenderer.settings.castShadows = true;

light.castShadow = true;
mesh.receiveShadow = true;
```

- `castShadows: boolean` - (default: `false`) volume shadows on meshes.
- `castShadowMapSize: number` - (default: `512`) texels on each side of a volume shadow map (each cascade tile and cube face).
- `castShadowCascades: number` - (default: `1`, max `4`) cascades of a directional light.
- `castShadowDistance: number` - (default: `4000`) largest view distance of the cascades.
- `castShadowSteps: number` - (default: `32`) samples on each light ray.
- `castShadowUpdatesPerFrame: number` - (default: `1`) shadow map pieces drawn again in one render. A cascade tile or a spot map is 1, a cube map is 6.
- `castShadowCoarse: boolean` - (default: `false`) 64-texel maps and 8 samples: soft blob shadows at almost no cost.

A map is drawn again only when its camera or the volumes change. Shadow detail comes from the last shadow grid cascade (`shadowResolution`). Two volumes on one light ray give one smooth shadow between them.

**`three-openvdb/webgl`**: `MeshStandardMaterial`, `MeshPhysicalMaterial`, `MeshLambertMaterial`, `MeshPhongMaterial`, `MeshToonMaterial` and `ShadowMaterial` receive volume shadows. The first 4 shadow lights of each type cast them. Point lights need `PCFShadowMap` or `BasicShadowMap`.

### Limits

- `'volume'` lighting: volumes do not shadow other volumes, and point and spot lights have no distance falloff. The first 4 hemisphere lights are used.
- The first 16 directional, point and spot lights light the volumes.
- Logarithmic depth buffers are not supported.

## FrameEmissionLight

- `new FrameEmissionLight( props ): Three.Light`

Lights the scene meshes with the emission grids of all visible `FrameVolume` objects (also instances and animation frames). Add one to the scene. Lit three.js materials get the light as diffuse irradiance. The light is calculated again only when a volume changes. Smoke in front of the flames blocks their light.

- `color: Three.Color | string | number` - (default: `0xffffff`), `intensity: number` - (default: `1.0`) multiply the light.
- `resolution: number` - (default: `8`, `2` to `32`) probes on each axis of each cascade.
- `range: number` - (default: `3.0`) size of the probe grid, as a multiple of the box of all emitting volumes. Out of the grid, the light falls off with distance squared.
- `cascades: number` - (default: `1`, max `4`) probe grid cascades. More cascades add finer grids around the camera. Use them when volumes are far apart.
- `distance: number` - (default: `512`) view distance of the finer cascades.
- `steps: number` - (default: `24`) emission samples on each ray in a volume.

`absorbance` of a volume scales its shadow. Limits: no specular light, no mesh shadows, and the smoke of one volume does not block the light of another volume.

**`three-openvdb/webgl`**: lit materials of the scene get a shader patch (`onBeforeCompile`, after their own `onBeforeCompile`).

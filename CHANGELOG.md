# Unreleased

- `LevelSetMesh`: the surface of a level set grid as a three.js mesh (marching cubes). Source: a level set `GridDescriptor` (`resolution`, default `200`) or a level set grid of `WVDBVolumeData` (`volumeData.attach( mesh )` builds it again for each LOD). Normals come from a Sobel gradient of the distance, then 2 passes of smoothing on the mesh. Any three.js material. Both `three-openvdb` and `three-openvdb/webgl`
- Experimental `LevelSetSurface`: the surface of a level set, traced on the GPU in the box of the grid (`MeshStandardNodeMaterial`, lights, environment, shadows and depth at the traced point). Same sources as `LevelSetMesh`. Both `three-openvdb` and `three-openvdb/webgl`
- `FrameVolume` prop `levelSets`: `'fog'` (default), `'surface'` (level set grids are `LevelSetSurface` children, other grids stay fog) or `'surfaceOnly'`. `VDBAnimationLoader` and `WVDBAnimationLoader` take it in `setOptions()`. Instances and animation instances show the surfaces of their frame. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: Custom VDB has a Render field: Auto (default: level set grids are surfaces, other grids fog), Fog or Level Set
- `WVDBVolumeData` level set grids have `distance` (signed distance texels) and `background`
- `sampleLevelSet( grid, { min, size, dimensions }, values )` (`openvdb`): dense signed distance of a level set. The narrow band is often thinner than a texel, so texels that cross the surface use the mean of 4x4x4 samples. `LevelSetMesh` uses it for `GridDescriptor` sources
- `wvdb` CLI: level sets use `sampleLevelSet`, so surfaces have no steps. The level set fog has no holes. The examples `venusstatue.wvdb` and `utahteapot.wvdb` are baked again
- Examples: Level Set demo (`?demo=levelset`): Venus Statue and Utah Teapot as a mesh, a GPU surface or fog, from `.wvdb` or `.vdb`. Mesh color and roughness
- Experimental medium presets from measured values: `getFrameMediumProps( name )` gives `FrameVolume` props (`baseColor` albedo, `extinctionScale`, `angstromExponent`, `phase`, `phaseG`, `phaseGExponent`) for `'cloud'`, `'fog'`, `'ice'`, `'soot'`, `'white-smoke'`, `'dark-smoke'`, `'haze'` and `'dust'`. Data and sources in `frameMediumPresets`. Extinction stays a user value. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: the Spectral folder of Rendering Frame and Custom VDB has a Medium preset field (it turns Spectral on, sets Base Color, the Ångström exponent and the phase) and an Ångström Exponent field (a number)
- Fix: `openvdb` throws `Error` instances with messages, not `0` or strings (`GridSharedContext.assert`, `BufferIterator`, `OpenVDBReader.read`, `loadVDB`). `loadVDB` keeps the parse error as `cause`
- `frameRenderer.settings.fadeRadius` (default `Infinity`, no fade): volume density in the view fades from the camera to `0` at this distance, as `FogExp2` (`exp(-4 x²)`, `x = distance / fadeRadius`). Both `three-openvdb` and `three-openvdb/webgl`
- Examples: Rendering Frame (Render Cascades folder) and Sky have a Fade Radius field. `0` is no fade. Sky starts with `4500`
- Breaking: `frameRenderer.settings.multipleScattering` default is `'neural'` (was `true`)
- `frameRenderer.settings.multipleScattering: 'two-sided'` (2D diffusion): the shadows of scene lights also march away from the light, diffusion of the volume between the light side and the far side, with light that leaves at the sides. Light that scatters back out is not lost, so lit sides are brighter. Path tracer, held-out scenes: mean error 59%, bias +10%. Cost: one more shadow march for each scene light. `'frame'` and `'volume'` lighting, spectral. Both `three-openvdb` and `three-openvdb/webgl`
- Experimental neural multiple scattering: `frameRenderer.settings.multipleScattering: 'neural'`. A small network (20 inputs, 2 hidden layers of 32) gives the scattered light of the scene lights at each world shadow grid voxel, from 6 mip levels of the grid, the direct optical depth and the albedo. Trained on a path tracer (`scripts/neural-indirect`). On held-out scenes the mean error of the scattered light is 37% (`true` 65%, `'two-sided'` 59%, `'octaves'` 127%, `scripts/neural-indirect/compare.mjs`). Grey `'frame'` lighting only, other cases use `true`. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: the Multiple Scattering field of Rendering Frame and Custom VDB has the options Off, 1D, 2D, OCT and N (default)
- Density normalization: `FrameVolume` `normalizeDensity` (default `true`). Density is divided by the mean density of the non-zero voxels, so `extinction * densityScale` is the optical depth of the longest box side at the mean density. The same settings give about the same opacity for each VDB. The mean is calculated one time, when the 3D texture is made. A `FrameVolumeAnimation` uses one mean for all frames. Both `three-openvdb` and `three-openvdb/webgl`
- `FrameVolume` default `extinction` is `100.0` (was `350.0`). With `normalizeDensity` the Bunny Cloud looks the same. Volumes with other densities change. For the earlier look, set `normalizeDensity: false` and `extinction: 350`
- `wvdb` writes `meanDensity` and `nonZeroVoxels` of the finest LOD to each scalar grid of the header. Then the mean does not change between LODs. `WVDBLoader` and `WVDBAnimationLoader` use them. Files with no mean use the data of each LOD
- Examples: the `.wvdb` assets have `meanDensity` and `nonZeroVoxels` in the header. The data did not change. Rendering Frame has a Normalize Density field (Volume folder), on by default. On: extinction 100, off: 350. Streaming WVDB and Custom VDB use extinction 100. Mesh Volume keeps 350 (mesh density is 0 or 1)
- Experimental RGB Lorenz-Mie phase: `FrameVolume` `phase` and `frameRenderer.settings.phase` `'lorenz-mie-rgb'`. Lorenz-Mie tables at 650 / 550 / 450 nm for the direct light of each color channel (red edge near the light, blue fogbow, red glory). Indirect light is the same as `'lorenz-mie'`. `'lorenz-mie'` does not change. Both `three-openvdb` and `three-openvdb/webgl`
- Experimental phase of each color channel for `'henyey-greenstein'` and `'dual-lobe'`: `FrameVolume` `phaseGExponent` and `frameRenderer.settings.phaseGExponent` (default `0.0`). `g` of each channel is `g * (wavelength / 550 nm)^-phaseGExponent`, for the direct light. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: the Combined Phase Function field has a MIE RGB option. Phase fields have a Phase G Exponent field

- Performance: the density clear, lighting, temporal and per-volume inject passes draw only the froxel area of the volumes (their rectangles and slices), not the full froxel atlas. The integrate pass draws only the screen rectangle of that area and marches only its slices. The image does not change. Both `three-openvdb` and `three-openvdb/webgl`
- Performance: the froxel grid is not larger than the canvas pixels (`settings.width` and `settings.height` are upper limits). Both `three-openvdb` and `three-openvdb/webgl`
- Performance: `three-openvdb` reads the mask, base color and emissive grids only when a volume has them (the placeholder textures were also sampled). `three-openvdb/webgl` already did this
- Performance: the frame renderer makes no new objects in each frame (volumes, froxel rectangles, shadow grid ranges, signatures, lights). Shared CPU code of both backends is in `frame/core` (`frameView.js`, `frameGrid.js`, `frameLayout.js`)
- Examples: shadow maps are drawn again only when a shadow light or a shadow mesh changes. Phones: no MSAA, environment shadow maps 512² and a maximum of 2
- Performance: `frameRenderer.settings.shadowCascades` default is `1` (was `3`). Near or in a volume, the fine cascades decreased the FPS by more than 50%, with no visible change. Both `three-openvdb` and `three-openvdb/webgl`
- Fix: with tone mapping, volume edges in front of a bright light had a hard, discoloured edge. `srgbBlending` clamped the HDR scene color before the `WebGPURenderer` tone mapping. Now the clamp applies only without tone mapping. `three-openvdb` only
- Spectral media: `frameRenderer.settings.spectral` (default `false`). Extinction of each color channel (`FrameVolume` `angstromExponent`: a preset of `frameAngstromExponents` (`'cloud'` (default), `'dust'`, `'smoke'`, `'air'`) or a number, and `extinctionScale`) and multiple scattering with the albedo of each channel (diffusion and `'octaves'`). View transmittance, self-shadows, the shadow grid of `'frame'` lighting and volume shadow maps are calculated for each channel. Grey volumes look the same as with `false`. `'frame'` and `'volume'` lighting. Both `three-openvdb` and `three-openvdb/webgl`. With diffusion multiple scattering, the two-sided environment, sky and hemisphere light (see the energy loss fix) is calculated for each channel
- Examples: Rendering Frame has a Smoke source (measured savanna smoke: albedo and the `'smoke'` Ångström exponent) and a Spectral folder (Spectral, Medium). Custom VDB has the same Spectral folder
- Fix: with diffusion multiple scattering (`frameRenderer.settings.multipleScattering: true`, the default), environment, sky and hemisphere light lost energy in dense volumes, so white volumes were grey and took the color of the sun. Now this isotropic light uses a two-sided diffusion total: light that the volume scatters and does not absorb is not lost. A white volume in a uniform environment has the radiance of the environment (white furnace test), and the light of each direction stays on the side of the volume that it comes from. The environment light directions are in opposite pairs, and with `'frame'` lighting all of them use the environment grid. `'frame'` and `'volume'` lighting. Both `three-openvdb` and `three-openvdb/webgl`. Cost: the environment grid and `'volume'` lighting march each environment and hemisphere direction both ways
- Examples: EnvMap Furnace (test), a uniform environment with radiance 0.5. The console shows the volume radiance at the screen center divided by 0.5 (`[Furnace]`). A white volume with Diffusion gives approximately 1
- Experimental emission spectra: `FrameVolume` `emissionSpectrum` `'planck'` (Planck's law integrated with the CIE 1931 colour matching functions, linear sRGB) and `'soot'` (Planck with the soot emissivity `λ^-sootExponent`, default `1.39`). Flames are orange and yellow, not red, and 6500 K is white. Only the color changes. `'approximate'` (the earlier color) stays the default. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: Rendering Frame has Emission Spectrum and Soot Exponent fields (Volume folder, Emissive folder). With the explosion, Planck and Soot set flame temperatures (0 K to 3000 K) and a lower Emissive Intensity (15 and 13)
- `frameRenderer.settings.castShadows` (default `false`): volumes cast shadows on meshes, for directional, point and spot lights with `castShadow`. Each light gets a volume shadow map (Beer shadow map) made from the world shadow grid of the frame renderer. Directional lights use view cascades (`castShadowCascades`, `castShadowDistance`), point lights a cube map. Settings for cost: `castShadowMapSize`, `castShadowSteps`, `castShadowUpdatesPerFrame`, `castShadowCoarse`. Both `three-openvdb` and `three-openvdb/webgl` (a shader patch of the lit materials)
- Examples: Rendering Frame has a Shadow Casting folder (Cast Shadows, Volume Shadow Map, Shadow Samples, Updates / Frame, Sun Cascades, Coarse Shadows)
- Examples: the demo floor shows only shadows (`ShadowMaterial`). Rendering Frame: pillars and spheres are in Show Obstacle, nearer to the center. Volumes stand on the environment ground. Rendering and Volume fields are in subfolders. No Rotate Second Bunny field
- Experimental multiple scattering octaves: `frameRenderer.settings.multipleScattering: 'octaves'`. Direct light (with the phase function) and indirect light are separate. The indirect light is `scatteringOctaves` (default `4`) octaves with less extinction (`scatteringOctaveExtinction`), less light (`scatteringOctaveContribution`) and a flatter phase (`scatteringOctavePhase`), each multiplied again for each octave. The octaves use the optical depth of the shadow march, with no new march. `true` (diffusion approximation) stays the default. `'frame'` and `'volume'` lighting. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: the Multiple Scattering field of Rendering Frame and Custom VDB is a list (Off, Diffusion, Octaves), with Octaves, Octave Extinction, Octave Contribution and Octave Phase fields
- Fix: `wvdb` baked a `resolution`³ cube for each box, so volumes with a long box side were blurred along that side. Now texels are cubes: the longest box side has `resolution` texels. `FrameVolume` `dimensions` prop for raw data (`grid.dimensions` of `.wvdb` data)
- Examples: Venus Statue `.wvdb` baked again with cube-shaped texels
- Fix: dense white volumes (for example clouds) were grey, never white. Shadows had single scattering only. `frameRenderer.settings.multipleScattering` (default `true`) adds multiple scattering to the shadows of all lights (diffusion approximation). The albedo (`baseColor`, `baseColorGrid`) limits it, so dark smoke keeps sharp shadows. Only direct light gets the phase function, scattered light is isotropic. `false` is the earlier look. `'frame'` and `'volume'` lighting. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: Rendering Frame and Custom VDB have a Multiple Scattering field (Rendering folder)
- `FrameVolume` default `extinction` is `350.0` (was `100.0`). With multiple scattering, dense volumes need more extinction for visible shading
- Examples: all demos use extinction 350. Rendering Frame: the Ground + Props field is Show Floor in the Scene folder, after Show Obstacle
- Examples: new UltraHDR environments (Desert, Grassland, Shore, Town Square, Sky Cloudy, Sky Dusk, Sky Midday, Sky Night). Desert is the default. The EnvMap field is in the General folder of all demos. Fiery Sky, Magic Forest and Night Realistic are removed
- Examples: Desert, Grassland, Shore and Town Square show their lower half as a flat ground (GroundedSkybox). The camera starts lower
- Examples: Custom VDB volumes stand on the ground. `.vdb` files convert at resolution 200 (was 100)
- Examples: the Streaming WVDB Ground Explosion uses the volume values of the Rendering Frame explosion (base color #555555, extinction 350, Emissive Intensity 25, temperature range 600 K to 7000 K)
- Multi-directional environment light with self-shadowing: `frameRenderer.settings.environmentLighting` `'directional'` (default, `environmentSamples` (default `8`) directional lights from the environment: the brightest direction, then zenith, nadir and horizon), `'spherical-harmonics'` (`environmentShOrder` L1 (default) or L2, SH-projected transmittance) or `'outward'` (the earlier environment light). `'frame'` and `'volume'` lighting. With `'frame'` lighting, the dominant directional environment light takes the next free shadow slot after the scene lights. The other environment lights use a cached grid of the last shadow cascade, calculated again only when a volume or the environment lights change. Both `three-openvdb` and `three-openvdb/webgl`
- Examples: Rendering Frame has Environment Light (Outward, Directional Samples) and Environment Samples fields (Rendering folder)
- Phase functions of directional, point and spot lights: Henyey-Greenstein (default), dual-lobe and tabulated Lorenz-Mie (`'lorenz-mie'`), with `phase`, `phaseG`, `phaseBackG` and `phaseBackWeight`. Back-lit volumes get a silver lining. `FrameVolume` props for `'volume'` lighting, `frameRenderer.settings` for `'frame'` lighting (one phase for all volumes). Both `three-openvdb` and `three-openvdb/webgl`
- `scripts/mie-phase-table.mjs` makes the Lorenz-Mie table (cumulus droplets, 550 nm)
- Examples: Rendering Frame and Custom VDB have Phase G, Phase Back G and Phase Back Weight fields (Volume folder, Per-volume lighting) and Combined Phase fields (Rendering folder and Scene folder, Combined lighting)
- Fix: `MeshVolume` scaled the meshes after their rotation, so rotated meshes with non-uniform scale had a wrong shape. Now each mesh uses its world matrix
- Fix: `MeshVolume` had a zero ray direction at the origin, and one parity ray failed on shared edges and on meshes with holes. Now three fixed rays vote, and hits at the same distance are one crossing
- Fix: `MeshVolume` failed when the meshes mixed indexed and non-indexed geometries, or had different attributes. Now it reads only the positions. Points and lines are ignored
- `MeshVolume` raycasts use a small internal BVH. A torus knot with 16k triangles at 48³ takes 0.2 s, before approximately 60 s
- Examples: Mesh Volume demo. GLB models next to their volume. Edge Noise and Edge Samples fields (demo code only) make soft edges
- `FrameEmissionLight`: the emissive grids of all visible volumes light the scene meshes. Volumes get their light on the GPU only when they change, with their own transmittance. A probe grid adds the light of all volumes, so lit pixels read 6 texels for any number of volumes. `three-openvdb`: a light node. `three-openvdb/webgl`: a shader patch of the lit materials
- `FrameEmissionLight` `cascades` (default `1`) and `distance`: finer probe grids around the camera, for volumes that are far apart
- Examples: Rendering Frame has an Explosion (Emissive) source (the Ground Explosion sequence) and a Light Emission folder. The explosion turns on Emission Light (intensity 25, 32³ probes) and an Emissive Intensity of 25 (new Volume field). The floor stays off. Source is in the General folder. The Scene, Rendering and Light Emission folders start collapsed
- Examples: Custom VDB has a Light Emission folder (Emission Light, Light Intensity, Probes, Cascades, Copies, Ground + Props). The Light Emission, Animation and Volume folders start collapsed
- Three.js r187 compatibility (PMREM cube map environment in `three-openvdb/webgl`). Three.js r187 or later is now required
- Fix: `GridDescriptor.getLocalBbox()` padded the `file_bbox_min` / `file_bbox_max` box by 4095 voxels and changed the metadata at each call. Now it gives the metadata box. Without the metadata, it uses the tree, or gives `null`. `getWorldBbox()` gives `null` then
- Fix: `loadVDB` did not reject on network errors or HTTP errors (for example 404). Now it rejects, and `VDBLoader` calls `onError`
- Fix: with `'frame'` (combined) lighting, point and spot lights had no distance falloff. Now they use `distance` and `decay`, the same as three.js lit materials. Both `three-openvdb` and `three-openvdb/webgl`
- Fix: with `'frame'` (combined) lighting, the environment lit volumes only from the sky up and down directions, so an HDRI gave a flat, grey light. Now each volume samples the environment along its outward direction, the same as `'volume'` lighting. Both `three-openvdb` and `three-openvdb/webgl`
- `three-openvdb/webgl`: `FrameVolume` for `WebGLRenderer`, with the GLSL froxel renderer of v0.7.0. The same API as `three-openvdb`. For backwards compatibility, it will be removed in a later version. Mipmaps are GPU mipmaps, no `srgbBlending` setting (WebGLRenderer blends on the sRGB canvas), no light limit
- `three-openvdb` code: `frame/core` (shared), `frame/webgpu` and `frame/webgl`. The two renderer folders do not import each other
- Examples: `npm run dev:webgl` runs the examples with `WebGLRenderer`
- Breaking: `three-openvdb` renders `FrameVolume` with `WebGPURenderer` (`three/webgpu`, three.js r186 or newer). WebGPU, or WebGL2 with `forceWebGL: true`. For `WebGLRenderer`, use `three-openvdb/webgl`. The froxel passes are TSL node materials
- The froxel march stops at the depth buffer of the current render (`viewportDepthTexture`). The extra scene depth render is removed
- Lights are own uniforms in world space: up to 16 directional, point and spot lights, and 4 hemisphere lights (`'volume'` lighting)
- `FrameVolume` prop `mipmaps` (default `true`): CPU mipmaps of the 3D textures. three.js WebGPU does not make 3D mipmaps. +25% memory for each grid
- `frameRenderer.settings.srgbBlending` (default `true`): blends the volumes in sRGB, the same as `WebGLRenderer`. `false` blends in linear space
- Breaking: removed the deprecated `FogVolume` (`VolumeToFog`), `LevelSet`, `Points`, `Bbox`, `VolumeBasicMaterial`, `VolumeNormalMaterial` and `lights` exports. `FrameVolume` is the only volume renderer. The primitive volumes and noise helpers stay
- `WVDBLoader.attach()` takes only `FrameVolume` objects
- Examples: removed the hidden FogVolume demos (bbox, bunny, clouds, gltf)
- Examples use `WebGPURenderer`. `?webgl` in the URL uses the WebGL2 fallback
- `frame` example: 100 Bunnies uses one volume and 99 instances. Mipmaps and sRGB Blending fields
- `FrameVolume.createInstance( props )` and `FrameVolumeAnimation.createInstance( props )`: show one loaded volume or sequence at many places. Instances share the 3D textures of the source, so GPU memory does not grow with them. Each instance has its own transform and props. Animation instances have their own playback. `FrameVolumeAnimationInstance` is exported
- `new FrameVolume( frameVolume, props )` makes an instance. `FrameVolume.dispose()` of an instance keeps the textures of the source
- `wvdb` example: Instances field (1, 2, 4, 8) and Textures readout (`renderer.info.memory.textures`)
- Fix `wvdb` sequences with a wrong `file_bbox_min` in some frames (EmberGen). All frames baked empty. Boxes now come from the active voxels of the tree, not from the `file_bbox_*` metadata. Other files give the same `.wvdb` bytes
- `GridDescriptor.evalActiveVoxelBoundingBox()`. `getPreciseWorldBbox()` uses the tree when it is read
- `OpenVDBReader.read( bytes, { topologyOnly: true } )`: tree topology without leaf values
- Fix `.wvdb` LOD 1 and LOD 2 on hosts that compress responses (for example GitHub Pages). `WVDBLoader` reads each file in one request, and decodes the LODs from its bytes
- `WVDBAnimationLoader` loads LOD 0 of all frames first, then LOD 1, then LOD 2. Each pass requests only the first bytes of each file (`Range: bytes=0-N`), up to the end of that LOD. This also works when the host compresses responses. Each pass reads the earlier LODs again
- `WVDBAnimationLoader.setConcurrency`: default is all files of a pass at the same time
- `wvdb` example: only the Asset field and the Status line
- `wvdb` example starts with Bunny Cloud
- `frame` example: Format field (WVDB or VDB, default WVDB) for the bunny sources
- `frame` example: remove the Clouds and Cloud Field sources
- README: notes about the WVDB proposal and `.vdb` to `.wvdb` conversion. Examples use `.wvdb` first. The primitive volumes, `VolumeToBbox`, `VolumeToFog` and `VolumeToLevelSet` are not in the docs (they are still exported)
- Release GitHub Action (manual run): minor bump of packages already on npm, sync of package dependencies, npm publish, GitHub Release with tag `v<openvdb version>`. Option `dry_run`

# v0.5.1

- The npm package of the `wvdb` CLI is `webvdb` (`npm install -g webvdb`, or `npx webvdb`). npm does not allow the package name `wvdb`. The command, the folder `src/wvdb` and the file format `.wvdb` stay the same
- All packages are 0.5.1. `three-openvdb` needs `openvdb` 0.5.1

# v0.5.x

Breaking: the library is split into 3 packages, each in its own folder of `src/`.

- `openvdb` (`src/openvdb`): VDB reader, grid lookup, volume math, primitives, noise. No dependencies. `Vector3`, `Matrix3` and `Matrix4` are own classes with the same fields as three.js
- `three-openvdb` (`src/three-openvdb`): all three.js code. Replaces `openvdb/three`. Also `WVDBLoader` and `WVDBReader`: load `.wvdb` files as a stream, each LOD replaces the previous one
- `wvdb` (`src/wvdb`): CLI. Converts a `.vdb` file, a folder or a ZIP of `.vdb` files into `.wvdb` files. Needs only Node.js
- Add `.wvdb` files: small, streamed files made from VDB files. Quantized 8³ bricks, sparse layout, progressive LODs, scalar and vector grids. Format helpers in `openvdb`, spec in `src/docs/wvdb/README.md`
- `wvdb` keeps empty grids and frames, so sequences keep their frame numbers. One box for all grids of a file, and for all frames of a folder or ZIP
- `WVDBLoader.setGridScales`: emission grids keep their range, same as `emissiveScale`. Vector grids load as RGBA for `baseColorGrid`
- `wvdb` converts files in parallel on worker threads (`--jobs`)
- Add `WVDBAnimationLoader`: `.wvdb` sequences in LOD passes (LOD 0 of all frames first, then finer LODs)
- `.wvdb` textures grow per LOD (32³, 64³, 128³) instead of the final size from the start. All readers share up to 4 workers
- `OpenVDBReader.read( bytes, { metadataOnly: true } )`: grid metadata and transforms only, no trees

Build:

- npm workspaces. `npm run build` builds all packages into `build/<package>`. `npm run release` publishes them
- `npm run bake:examples` makes the `.wvdb` example assets

Examples:

- Examples moved to `src/docs/examples`. gh-pages: `git subtree push --prefix src/docs/examples/dist origin gh-pages`
- Add `wvdb` example: streams `.wvdb` files, compares with `.vdb`, shows LOD times
- `vdb` example plays `.wvdb` sequences (folder or ZIP) with `WVDBAnimationLoader`
- `wvdb` example is the default. It has the Ground Explosion sequence by JangaFX (EmberGen, CC0) as 200 `.wvdb` files

# v0.4.x

Core:

- Add `VDBAnimationLoader`: loads a VDB sequence as a `FrameVolumeAnimation`. All frames use the same props and one shared box
- Add `FrameVolumeAnimation`: `play`, `pause`, `stop`, `frame`, `fps`, `loop`, `update(delta)`. Volume props apply to all frames
- Add `bbox`, `emissiveScale` and `temperatureRange` props to `FrameVolume`
- `FrameVolume` texture size follows the box shape. Texels are cubes. `resolution` is the texel count of the longest side
- Fix `FrameVolume` emission: temperature in Kelvin, emitted power increases with temperature^4
- Fix volumes past `shadowDistance` with no shadows in `'frame'` lighting. The last shadow cascade covers all volumes
- Fix lit streaks between overlapping volumes in `'frame'` lighting. Each volume samples shadows at its own visible position

Build:

- `npm run release` builds and publishes `build/`. The repo root is private, so `npm publish` in the root fails
- The published package has no `.tgz` file, no scripts and no dev dependencies

Examples:

- `vdb` example uses `FrameVolume` and plays VDB sequences from a ZIP or a folder
- Add Up Axis and Emissive Grid fields to the `vdb` example

# v0.3.x

Core:

- Add `FrameVolume` and `frameRenderer`: all volumes of a frame in one froxel grid, marched once. `FogVolume` does not change
- Add `frameRenderer.settings.lighting = 'frame'`: combined density, world-space shadow grid cascades for all volumes, one lighting pass
- Add jitter and temporal accumulation of froxels (`jitter`, `temporal`, `temporalBlend`) against banding
- Read VDB files without grid offsets (files written as streams), multi-buffer trees, and trees other than 5_4_3
- Instance grids share the tree of the parent grid
- Read bool, mask, point index and point data grids. Point attribute values are not read
- Three.js r186 compatibility (`opaque_fragment`, `colorspace_fragment`, `mergeGeometries`). Three.js r186 or later is now required
- Three.js r153 color spaces compatibility
- Three.js r151 UV channels compatibility

Examples:

- Add `frame` example to compare `FrameVolume` and `FogVolume`

# v0.2.x

Core:

- Add MeshVolume
- Add GLTF-to-Mesh
- Add environment lighting
- Add volume roundness (`radius` prop) for MeshGeneration
- Remove GPU `noise` prop
- Move wrapping calculations to compile-time instead of checking each sample on the GPU
- Add `useDirectionalLights`, `useHemisphereLights`, `usePointLights`, `useSpotLights` and `useEnvironment` setters to limit the amount of lights affecting the volume
- Improve material caching (cache material key based on properties)
- Add `baseColorMap` property to volume fogs and `baseColorMap3D` to VolumeBasicMaterial

Examples:

- Add `gltf` example

# v0.1.4

Core:

- Add temperature / emissive texture support
- Fix volume banding
- Remodel light calculations
- Add support for following material properties: `emissiveMap3D`, `offset3D`, `wrap3D`, `densityScale`, `noiseScale`
- Add Clouds primitive as an example of generative clouds
- Rename `volumeMap` -> `densityMap3D`
- Rename `color` -> `baseColor`
- Add texture tiling and wrapping
- Remove second (material) argument from `FogVolume` constructor (assume `VolumeBasicMaterial`)
- Set default volume color to `#ffffff`
- Set default volume scatter color to `#000000`

Examples:

- Move examples from `react-three-fiber` to vanilla `three`
- Add `bbox` example
- Add `bunny` example with various light configurations
- Add `clouds` example with generative clouds
- Add `vdb` example for custom drag-and-drop VDB preview

# v0.1.3

Core:

- Add support for `LevelSet` VDB grids
- Add support for `Points` VDB grids

Bugfix:

- Fix randomly appearing "cuts" on VDB objects, when the `position` vector contained floating-point values

<img width="1230" alt="kot" src="https://user-images.githubusercontent.com/9549760/201450565-cb368a13-da04-4436-90de-0a4fb1a5de56.png">

# v0.1.2

Core:

- Initial public version
- Add support for `FogVolume` VDB grids
- Add support for `FogMaterial`
- Add three.js scene lights support for volumetric fog elements
- Add support for `Bbox` VDB grids

# Unreleased

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

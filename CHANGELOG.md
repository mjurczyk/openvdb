# v0.5.x

Breaking: the library is split into 4 packages, each in its own folder of `src/`.

- `openvdb` (`src/openvdb`): VDB reader, grid lookup, volume math, primitives, noise. No dependencies. `Vector3`, `Matrix3` and `Matrix4` are own classes with the same fields as three.js
- `three-openvdb` (`src/three-openvdb`): all three.js code. Replaces `openvdb/three`
- `three-wvdb-loader` (`src/three-wvdb-loader`): `WVDBLoader` and `WVDBReader`. Load `.wvdb` files as a stream, each LOD replaces the previous one
- `wvdb` (`src/wvdb`): CLI. Converts a `.vdb` file, a folder or a ZIP of `.vdb` files into `.wvdb` files. Needs only Node.js
- Add `.wvdb` files: small, streamed files made from VDB files. Quantized 8³ bricks, sparse layout, progressive LODs, scalar and vector grids. Format helpers in `openvdb`, spec in `src/docs/wvdb/README.md`
- `wvdb` keeps empty grids and frames, so sequences keep their frame numbers. One box for all grids of a file, and for all frames of a folder or ZIP
- `WVDBLoader.setGridScales`: emission grids keep their range, same as `emissiveScale`. Vector grids load as RGBA for `baseColorGrid`
- `wvdb` converts files in parallel on worker threads (`--jobs`)
- `OpenVDBReader.read( bytes, { metadataOnly: true } )`: grid metadata and transforms only, no trees

Build:

- npm workspaces. `npm run build` builds all packages into `build/<package>`. `npm run release` publishes them
- `npm run bake:examples` makes the `.wvdb` example assets

Examples:

- Examples moved to `src/docs/examples`. gh-pages: `git subtree push --prefix src/docs/examples/dist origin gh-pages`
- Add `wvdb` example: streams `.wvdb` files, compares with `.vdb`, shows LOD times
- `vdb` example plays `.wvdb` sequences (folder or ZIP). Each frame shows at its first LOD and gets sharper while the next files load

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

# v0.2.15

Core:

- Add MeshVolume
- Add GLTF-to-Mesh
- Add environment lighting
- Add volume roundness (`radius` prop) for MeshGeneration
- Remove GPU `noise` prop
- Move wrapping calculations to compile-time instead of checking each sample on the GPU
- Add `useAmbientLights`, `useDirectionalLights`, `useHemisphereLights`, `usePointLights`, `useSpotLights` and `useEnvironment` setters to limit the amount of lights affecting the volume
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

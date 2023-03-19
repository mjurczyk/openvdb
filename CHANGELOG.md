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

Examples:

- Move examples from `react-three-fiber` to vanilla `three`
- Add `bbox` example
- Add `bunny` example with various light configurations
- Add `clouds` example with generative clouds

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

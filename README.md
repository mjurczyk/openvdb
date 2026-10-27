<a href="https://mjurczyk.github.io/openvdb/" target="_blank">
  <img width="100%" src="https://github.com/mjurczyk/openvdb/assets/9549760/fb7a04c1-9c69-44c9-addb-f6969b3017c6" title="OpenVDB - Web implementation of volumetric grids" />
</a>

# OpenVDB

This project indirectly ports OpenVDB file format and tools to JavaScript, TypeScript, and Node.
Specific 3D library implementations can be found in sub-directories.

## What is OpenVDB

VDB is a volumetric data format originally implemented in C++ ([AcademySoftwareFoundation/openvdb](https://github.com/AcademySoftwareFoundation/openvdb).) It allows to efficiently store voxel structures of this like smoke, fire, and fluid simulations - as well as normal 3D models converted to voxels.

Keep in mind that, due to memory-access and multithreading limitations of JS, this repo may be more similar to a read-only [NanoVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb/nanovdb), instead of the original OpenVDB. Code is nevertheless based on original [OpenVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb).

## Usage

### With `three.js`:

```js
import * as Three from 'three';
import * as OpenVDB from 'openvdb/three';

const scene = new Three.Scene();

// NOTE To load an existing VDB model - use VDBLoader:
new OpenVDB.VDBLoader().load('./assets/bunny.vdb', function (vdb) {
  const fogVolume = new OpenVDB.FogVolume(vdb, {
    resolution: 100,
    progressive: true,
    steps: 20,
    absorbance: 1.0,
    baseColor: 0xff00ff,
  });

  scene.add(fogVolume);
});

// NOTE To create a primitive volumetric shape - use volume converters directly:
const primitiveVolume = new OpenVDB.SphereVolume();
const fogPrimitive = new OpenVDB.FogVolume(primitiveVolume, {
  resolution: 50,
  progressive: false,
  steps: 50,
  absorbance: 0.5,
  baseColor: 0xff00ff,
});

scene.add(fogPrimitive);
```

### With `react-three-fiber`:

```jsx
import * as Three from 'three';
import * as OpenVDB from 'openvdb/three';

export const VDBComponent = () => {
  const [model, setModel] = useState(new Three.Object3D());

  useEffect(() => {
    new OpenVDB.VDBLoader().load('./assets/bunny.vdb', function (vdb) {
      const fogVolume = new OpenVDB.FogVolume(vdb, {
        resolution: 100,
        progressive: true,
        steps: 20,
        absorbance: 1.0,
        baseColor: 0xff00ff,
      });

      setModel(fogVolume);
    });

    return () => {
      fogVolume.dispose();
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

Each grid has a `.getValue( position: Three.Vector3 ): float` method, which returns the voxel value saved in the file for the given position (density for fog volumes, signed distance for level sets). The `.isActive( position: Three.Vector3 ): boolean` method returns `true` if the voxel at the given position is active. See `src/openvdb/three/VolumeToFog.js` for an example of VDB file parsing.

---

### VDBLoader

- `VDBLoader( manager: Three.LoadingManager )`

- `VDBLoader.load( url, onLoad, onProgress, onError ): void`

Loads VDB model. onLoad is called when VDB is loaded and parsed. onError is called when error happens. onProgress is currently not used.

---

### VolumeToBbox

- `VolumeToBbox( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor> ): Three.Object3D`

Converts given `OpenVDBReader` to `Three.Object3D`. Resulting object consists of wireframe bounding boxes of all internal nodes within the given VDB. If multiple grids are given - each grid is drawn in a different wireframe color.

---

### VolumeToFog

- `VolumeToFog( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor>, { resolution, steps, progressive, absorbance, opacity, radius, baseColor }, onConverted: () => void, onProgress: ({ convertedVoxels, totalVoxels, convertedGrids, totalGrids }) => void ): Three.Object3D`

Converts given `OpenVDBReader` to a volumetric `Three.Object3D`. `onConverted` and `onProgress` are called as the VDB is converted to a fog. Most importantly:

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

---

### FrameVolume (experimental)

- `FrameVolume( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor>, { resolution, progressive, ... }, onConverted: () => void, onProgress: ({ convertedVoxels, totalVoxels, convertedGrids, totalGrids }) => void ): Three.Object3D`

Alternative to `VolumeToFog`. It does not ray march each volume. For each frame, all visible `FrameVolume` objects are written into one frustum-aligned voxel grid (froxels). Then one fullscreen pass marches that grid. Overlapping volumes mix correctly. It works with a normal `renderer.render(scene, camera)` call. `VolumeToFog` does not change.

* `resolution: number` - (default: `100`) resolution of the 3D texture of each grid.
* `progressive: boolean` - set to `true` to render the volume while it is converted.
* `extinction: number` - (default: `100.0`) extinction of density `1.0` for each unit of the volume box (the largest side).
* `absorbance: number` - (default: `1.0`) scales the self-shadowing. `0.0` gives no shadows.
* `densityScale`, `densityCutoff`, `opacity`, `baseColor`, `scatterColor`, `offset3D`, `wrap3D` - same as `VolumeToFog`.
* `emissiveGrid`, `baseColorGrid`, `maskGrid` - same as `VolumeToFog`. `emissiveIntensity` (default: `1.0`) scales the emission.
* `lights` - bitmask of light types (`frameLights.useAmbientLights | frameLights.useDirectionalLights | frameLights.usePointLights | frameLights.useSpotLights | frameLights.useHemisphereLights | frameLights.useEnvironment`). Bit values are the same as `lights`.
* `shadowSteps: number` - (default: `32`) steps of the shadow march toward each light, inside the volume.

All properties can be changed after creation, for example `frameVolume.extinction = 50.0` or `frameVolume.baseColor.set(0xff00ff)`.

Froxel grid settings are global, in `frameRenderer.settings`:

* `width`, `height` - (default: `256`, `256`) froxels on the screen axes.
* `depth` - (default: `100`) depth slices. Slices are exponential: thin near the camera, thick far away. Slices fit the visible volumes.
* `subSteps` - (default: `16`) density samples along the view ray in each slice. Each froxel is lit at the visibility-weighted mean position of its samples, then stored as slice color and alpha.
* `near`, `far` - (default: `1.0`, `512.0`) limits of the slice range in view depth.
* `jitter` - (default: `true`) moves sub-steps and shadow samples by a small random amount each frame. Banding becomes fine noise.
* `temporal` - (default: `true`) blends each frame with the reprojected froxels of the previous frames. This removes the jitter noise. The history is clamped to the current froxels to limit ghosting.
* `temporalBlend` - (default: `0.1`) weight of the new frame. Lower values are smoother, higher values react faster to motion.
* `lighting` - (default: `'volume'`) lighting model:
  * `'volume'` - each volume is lit alone. Shadows come only from the same volume. Good for a small number of dense volumes with sharp edges.
  * `'frame'` - all volumes are written into the froxels first (density and material only). World-space shadow grid cascades hold the extinction of all volumes, also volumes out of the view. Transmittance to each light is calculated one time in the grid. Then each froxel is lit one time. Volumes shadow each other, and the number of render calls does not grow with the number of volumes. Good for many overlapping volumes, for example cloud fields.
* `shadowResolution` - (default: `64`) voxels on each axis of each shadow grid cascade (`'frame'` lighting only).
* `shadowCascades` - (default: `3`, max `4`) shadow grid cascades. The last cascade fits all volumes. Each finer cascade is half the size, around the camera. Shadows are dense near the camera and sparse far away (`'frame'` lighting only).
* `shadowDistance` - (default: `512`) the shadow grid includes only volumes in this distance from the camera (`'frame'` lighting only).

3D textures of `FrameVolume` have mipmaps. Large froxels far away sample a lower mip level, so small details fade to transparent.

With `'frame'` lighting, the first directional, point and spot lights (6 in total) cast shadows. Hemisphere lights, light probes and the environment use the shadow grid in the up and down directions. Ambient light has no shadow. `lights` and `shadowSteps` are not used, `scatterColor` is added as emission, and `absorbance` scales the shadow of each volume.

Limits: with `'volume'` lighting, volumes do not shadow other volumes. Point and spot lights have no distance falloff (same as `VolumeToFog`). Logarithmic depth buffers are not supported.

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

## Current Feature Support

Based on files hosted on [https://www.openvdb.org/download/](https://www.openvdb.org/download/).

| Model                | Support    | Notes                                                         |
| -------------------- | ---------- | ------------------------------------------------------------- |
| armadillo.vdb        | ✅ Yes     |                                                               |
| buddha.vdb           | ✅ Yes     |                                                               |
| bunny.vdb            | ✅ Yes     |                                                               |
| bunny_cloud.vdb      | ✅ Yes     |                                                               |
| crawler.vdb          | ❓ Partial | Exceeds memory limits                                         |
| cube.vdb             | ✅ Yes     |                                                               |
| dragon.vdb           | ✅ Yes     |                                                               |
| emu.vdb              | ✅ Yes     |                                                               |
| explosion.vdb        | ✅ Yes     |                                                               |
| fire.vdb             | ✅ Yes     |                                                               |
| icosahedron.vdb      | ✅ Yes     |                                                               |
| iss.vdb              | ✅ Yes     |                                                               |
| smoke1.vdb           | ✅ Yes     |                                                               |
| smoke2.vdb           | ✅ Yes     |                                                               |
| space.vdb            | ❓ Partial | Exceeds memory limits                                         |
| sphere.vdb           | ✅ Yes     |                                                               |
| torus.vdb            | ✅ Yes     |                                                               |
| torus_knot.vdb       | ✅ Yes     |                                                               |
| utahteapot.vdb       | ✅ Yes     |                                                               |
| venusstatue.vdb      | ✅ Yes     |                                                               |
| boat_points.vdb      | ❓ Partial | Loads ok, points rendering not fully implemented              |
| bunny_points.vdb     | ❓ Partial | Loads ok, points rendering not fully implemented              |
| sphere_points.vdb    | ❓ Partial | Loads ok, points rendering not fully implemented              |
| waterfall_points.vdb | ❓ Partial | Loads ok, points rendering not fully implemented              |

## Development

```
git clone https://github.com/mjurczyk/openvdb
cd ./openvdb
npm run i
npm run dev
```

## Credits

To avoid re-coding same things over again, parts of the library may be based / taken directly from the following:

- [gkjohnson/three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh): BVH implementation
- [manzt/numcodecs.js](https://github.com/manzt/numcodecs.js/): BLOSC & ZLIB compression
  - [nodeca/pako](https://github.com/issues): ZLIB compression

Be sure to ⭐️ those!

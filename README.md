<img width="100%" src="https://user-images.githubusercontent.com/9549760/200132454-4774f8ed-f45a-43ab-a435-39c62ebd43df.png" title="OpenVDB - Web implementation of volumetric grids" />

# OpenVDB

This project indirectly ports OpenVDB file format and tools to JavaScript, TypeScript, and Node.
Specific 3D library implementations can be found in sub-directories.

## What is OpenVDB

VDB is a volumetric data format originally implemented in C++ ([AcademySoftwareFoundation/openvdb](https://github.com/AcademySoftwareFoundation/openvdb).) It allows to efficiently store voxel structures of this like smoke, fire, and fluid simulations - as well as normal 3D models converted to voxels.

Keep in mind that, due to memory-access and multithreading limitations of JS, this repo may be more similar to a read-only [NanoVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/nanovdb/nanovdb), instead of the original OpenVDB. Code is nevertheless based on original [OpenVDB](https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb).

## Usage

### Without library:

```js
import * as OpenVDB from 'openvdb';

const vdbReader = await OpenVDB.loadVDB('./assets/bunny.vdb');

vdbReader.grids.forEach(function (grid) {
  const voxelValue = grid.getValue({ x: 0.0, y: 0.0, z: 1.0 });
});
```

### With `three.js`:

```js
import * as Three from 'three';
import * as OpenVDB from 'openvdb/three';

const scene = new Three.Scene();

// NOTE To load an existing VDB model - use VDBLoader:
new OpenVDB.VDBLoader().load('./assets/bunny.vdb', function (vdb) {
  const fogVolume = new OpenVDB.FogVolume(vdb, null, {
    resolution: 100,
    progressive: true,
    steps: 20,
    absorbance: 1.0,
    color: 0xff00ff,
  });

  scene.add(fogVolume);
});

// NOTE To create a primitive volumetric shape - use volume converters directly:
const primitiveVolume = new OpenVDB.SphereVolume();
const fogPrimitive = new OpenVDB.FogVolume(primitiveVolume, null, {
  resolution: 50,
  progressive: false,
  steps: 50,
  absorbance: 0.5,
  color: 0xff00ff,
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
      const fogVolume = new OpenVDB.FogVolume(vdb, null, {
        resolution: 100,
        progressive: true,
        steps: 20,
        absorbance: 1.0,
        color: 0xff00ff,
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

## Docs

### loadVDB

- `loadVDB( url ): Promise<OpenVDB.OpenVDBReader>`

Load OpenVDB file and parse its grids. Grids can be accessed via `.grids` property of the value returned from the Promise.

Each grid has a `.getValue( position: Three.Vector3 ): float` method, which returns a voxel value for the given position. See `src/openvdb/three/VolumeToFog.js` for an example of VDB file parsing.

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

- `VolumeToFog( vdb: OpenVDB.OpenVDBReader | OpenVDB.GridDescriptor | Array<OpenVDB.GridDescriptor>, materialOverride: Optional<Three.Material>, { resolution, steps, progressive, absorbance, opacity, noise, color }, onConverted: () => void, onProgress: ({ convertedVoxels, totalVoxels, convertedGrids, totalGrids }) => void ): Three.Object3D`

Converts given `OpenVDBReader` to a volumetric `Three.Object3D`. Optional `materialOverride` can be used as a base for that volumetric object (shader of the material will be partially overriden.) `onConverted` and `onProgress` are called as the VDB is converted to a fog. Most importantly:

`resolution: number` - (required) resolution of the resulting 3D texture. Keep in mind this will be risen to the power of 3 - so resolution 200 results in 8 million voxels.
`steps: number` - (default: 100) detail of the resulting fog volume. High amount of steps combined with large amount of lights in the scene may decrease performance significantly.
`progressive: boolean` - set to `true` to render the fog on-the-go as it is being parsed, while preserving 60fps.
`absorbance: number` - (default: `1.0`) `1.0` means fog absorbs all the light going through it, lower values all light to partially traverse through the fog.
`opacity: number` - alpha opacity of the fog (doesn't affect light calculations.)
`noise: number` - between `0.0` and `1.0`, amount of CPU-generated noise within the fog volume, adds a bit of randomness to the result.
`color: Three.Color | string | number` - (default: `0x000000`) albedo color of the fog volume.

⚠️ Note - fog volumes currently react to all lights in the scene. Keep this in mind as light calculations within the volume are done using quite expensive raymarching. If fog volume covers a significant part of the viewport, consider decreasing `steps` parameter, or the overall amount of lights.

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
| crawler.vdb          | ❓ Partial | Loads ok, fails to render (Three.js) due to memory limits     |
| cube.vdb             | ✅ Yes     |                                                               |
| dragon.vdb           | ✅ Yes     |                                                               |
| emu.vdb              | ❓ Partial | Loads ok, fails to render (Three.js) due to memory limits     |
| explosion.vdb        | ❓ Partial | Loads ok, fails to render due to offsets, lacks color support |
| fire.vdb             | ❓ Partial | Loads ok, fails to render due to offsets, lacks color support |
| icosahedron.vdb      | ✅ Yes     |                                                               |
| iss.vdb              | ❓ Partial | Loads ok, fails to render (Three.js) due to memory limits     |
| smoke1.vdb           | ❓ Partial | Loads ok, fails to render due to offsets, lacks color support |
| smoke2.vdb           | ❓ Partial | Loads ok, fails to render due to offsets, lacks color support |
| space.vdb            | ❓ Partial | Loads ok, fails to render (Three.js) due to memory limits     |
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

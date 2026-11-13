import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { gui, setGuiFields } from '../utils/gui';
import { setEnvironmentLights } from '../utils/resources';
import { setLoading } from '../utils/loading';
import { createTransformFolder } from '../utils/transform';

// NOTE Longest side of the level set in scene units
const displaySize = 100.0;

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

export const exampleLevelSet = ({ scene }) => {
  const params = {
    model: 'venusstatue',
    // NOTE 'wvdb' (streamed LODs) or 'vdb' (the full file, sampled on the CPU at resolution)
    format: 'wvdb',
    // NOTE 'mesh' (LevelSetMesh) or 'fog' (FrameVolume, density 1.0 in the narrow band)
    render: 'mesh',
    resolution: 200,
    color: '#ffffff',
    roughness: 0.5,
    upAxis: 'y',
  };

  let entry = null;
  let buildId = 0;
  // NOTE The GUI calls onChange with default values. Build one time after that.
  let ready = false;

  const material = new Three.MeshStandardMaterial({
    color: params.color,
    roughness: params.roughness,
  });

  const sun = new Three.DirectionalLight(0xffffff, 1.0);
  sun.position.set(100.0, 200.0, 100.0);
  scene.add(sun);
  const hemiLight = new Three.HemisphereLight(0x88aaff, 0x443322, 0.5);
  scene.add(hemiLight);

  const setStatus = (text) => {
    getController('status')?.setValue(text);
  };

  // NOTE Z-up turns the level set -90 degrees on X around its center
  const applyUpAxis = () => {
    if (entry) {
      entry.pivot.rotation.x = params.upAxis === 'z' ? -Math.PI / 2.0 : 0.0;
    }
  };

  const removeLevelSet = () => {
    if (!entry) {
      return;
    }

    entry.volumeData?.dispose();
    entry.object?.dispose();
    scene.remove(entry.pivot);
    entry = null;
  };

  // NOTE The box fits displaySize, at the scene origin
  const addObject = (object, bbox) => {
    const size = bbox.getSize(new Three.Vector3());
    const scale = displaySize / Math.max(size.x, size.y, size.z);

    object.scale.setScalar(scale);
    object.position.copy(bbox.getCenter(new Three.Vector3())).multiplyScalar(-scale);

    entry.object = object;
    entry.pivot.add(object);
    applyUpAxis();
  };

  const rebuild = () => {
    const currentBuildId = ++buildId;
    const startTime = performance.now();
    // NOTE A demo change clears the scene. Then old callbacks must not change the GUI of the next demo.
    const isCurrent = () => currentBuildId === buildId && scene.children.includes(entry?.pivot);

    const onBuilt = () => {
      if (isCurrent()) {
        setStatus(`Built in ${Math.round(performance.now() - startTime)} ms`);
        setLoading('levelset', false);
      }
    };

    const onError = (error) => {
      console.error('Level set', { error });

      if (currentBuildId === buildId) {
        setStatus('Could not load the file.');
        setLoading('levelset', false);
      }
    };

    removeLevelSet();

    entry = { pivot: new Three.Group(), object: null, volumeData: null };
    scene.add(entry.pivot);

    setLoading('levelset', true);
    setStatus('Loading...');

    if (params.format === 'wvdb') {
      // NOTE The mesh and the fog follow each new LOD
      entry.volumeData = new OpenVDB.WVDBLoader().load(
        `./assets/${params.model}.wvdb`,
        (volumeData) => {
          if (!isCurrent()) {
            return;
          }

          const grid = Object.values(volumeData.grids).find(({ isLevelSet }) => isLevelSet);
          const object =
            params.render === 'mesh'
              ? new OpenVDB.LevelSetMesh(grid, { material })
              : new OpenVDB.FrameVolume(grid.data, {
                  dimensions: grid.dimensions,
                  bbox: grid.bbox,
                });

          volumeData.attach(object);
          addObject(object, grid.bbox);
        },
        ({ lod, lods, done }) => {
          if (!isCurrent()) {
            return;
          }

          setStatus(`LOD ${lod + 1} / ${lods}`);

          if (done && lod === lods - 1) {
            onBuilt();
          }
        },
        onError,
      );

      return;
    }

    new OpenVDB.VDBLoader().load(
      `./assets/${params.model}.vdb`,
      (vdb) => {
        if (!isCurrent()) {
          return;
        }

        const grid = Object.values(vdb.grids).find((each) => each.isLevelSet());

        setStatus('Building...');

        if (params.render === 'mesh') {
          const mesh = new OpenVDB.LevelSetMesh(
            grid,
            { material, resolution: params.resolution },
            onBuilt,
          );

          addObject(mesh, mesh.bbox);
        } else {
          const volume = new OpenVDB.FrameVolume(
            grid,
            { resolution: params.resolution, progressive: true },
            onBuilt,
          );

          addObject(volume, new Three.Box3().set(...grid.getPreciseWorldBbox()));
        }
      },
      undefined,
      onError,
    );
  };

  const rebuildOnChange = (key) => (value) => {
    params[key] = value;

    if (ready) {
      rebuild();
    }
  };

  setGuiFields([
    {
      folder: 'Level Set',
      children: [
        {
          id: 'model',
          name: 'Model',
          defaultValue: params.model,
          options: {
            'Venus Statue': 'venusstatue',
            'Utah Teapot': 'utahteapot',
          },
          onChange: rebuildOnChange('model'),
        },
        {
          id: 'format',
          name: 'Format',
          defaultValue: params.format,
          options: { WVDB: 'wvdb', VDB: 'vdb' },
          onChange: (value) => {
            getController('resolution')?.show(value === 'vdb');
            rebuildOnChange('format')(value);
          },
        },
        {
          id: 'render',
          name: 'Render',
          defaultValue: params.render,
          options: { Mesh: 'mesh', Fog: 'fog' },
          onChange: (value) => {
            getController('color')?.show(value === 'mesh');
            getController('roughness')?.show(value === 'mesh');
            rebuildOnChange('render')(value);
          },
        },
        {
          id: 'resolution',
          name: 'Resolution',
          defaultValue: params.resolution,
          options: { 100: 100, 200: 200, 300: 300 },
          onChange: rebuildOnChange('resolution'),
        },
        {
          id: 'color',
          name: 'Color',
          defaultValue: params.color,
          onChange: (value) => material.color.set(value),
        },
        {
          id: 'roughness',
          name: 'Roughness',
          defaultValue: params.roughness,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            material.roughness = value;
          },
        },
        {
          id: 'status',
          name: 'Status',
          defaultValue: '',
        },
      ],
    },
    {
      folder: 'Scene',
      children: [
        createTransformFolder({
          upAxis: params.upAxis,
          onUpAxisChange: (value) => {
            params.upAxis = value;

            applyUpAxis();
          },
        }),
        {
          id: 'lightSetup',
          name: 'Lights',
          defaultValue: 'environment',
          // NOTE environment: the lights of the environment map (utils/resources.js)
          options: {
            Environment: 'environment',
            'Sun + Hemisphere': 'sunHemi',
          },
          onChange: (value) => {
            setEnvironmentLights(scene, value === 'environment');
            sun.visible = value === 'sunHemi';
            hemiLight.visible = value === 'sunHemi';
          },
        },
      ],
    },
  ]);

  getController('status')?.disable();
  getController('resolution')?.show(params.format === 'vdb');

  ready = true;
  rebuild();
};

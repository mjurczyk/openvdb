import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { gui, setGuiFields } from '../utils/gui';
import { setLoading } from '../utils/loading';
import { createTransformFolder } from '../utils/transform';

// NOTE Longest side of the points in scene units
const displaySize = 100.0;

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

export const examplePoints = ({ scene }) => {
  const params = {
    model: 'boat_points',
    // NOTE 'wvdb' (streamed LODs, each LOD adds points) or 'vdb' (the full file)
    format: 'wvdb',
    // NOTE VDB only: 'points' (VDBPoints) or 'fog' (FrameVolume, density from the point offsets in voxels).
    // WVDB points grids have no voxels, so they are always points.
    render: 'points',
    color: '#ffffff',
    upAxis: 'y',
  };

  let entry = null;
  let buildId = 0;
  // NOTE The GUI calls onChange with default values. Build one time after that.
  let ready = false;

  const setStatus = (text) => {
    getController('status')?.setValue(text);
  };

  // NOTE Z-up turns the points -90 degrees on X around their center
  const applyUpAxis = () => {
    if (entry) {
      entry.pivot.rotation.x = params.upAxis === 'z' ? -Math.PI / 2.0 : 0.0;
    }
  };

  // NOTE The boat has no .vdb in the assets (365 MB), so it is WVDB only
  const hasVDB = () => params.model !== 'boat_points';

  const getFormat = () => (hasVDB() ? params.format : 'wvdb');

  const getRender = () => (getFormat() === 'wvdb' ? 'points' : params.render);

  const applyColor = () => {
    if (entry?.object?.isVDBPoints) {
      entry.object.material.color.set(params.color);
    }
  };

  const removePoints = () => {
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
    applyColor();
  };

  const rebuild = () => {
    const currentBuildId = ++buildId;
    const startTime = performance.now();
    // NOTE A demo change clears the scene. Then old callbacks must not change the GUI of the next demo.
    const isCurrent = () => currentBuildId === buildId && scene.children.includes(entry?.pivot);

    const onBuilt = (object) => {
      if (isCurrent()) {
        const time = Math.round(performance.now() - startTime);
        const count = object?.isVDBPoints ? `${object.pointCount.toLocaleString()} points, ` : '';

        setStatus(`${count}built in ${time} ms`);
        setLoading('points', false);
      }
    };

    const onError = (error) => {
      console.error('Points', { error });

      if (currentBuildId === buildId) {
        setStatus('Could not load the file.');
        setLoading('points', false);
      }
    };

    removePoints();

    entry = { pivot: new Three.Group(), object: null, volumeData: null };
    scene.add(entry.pivot);

    setLoading('points', true);
    setStatus('Loading...');

    if (getFormat() === 'wvdb') {
      // NOTE The points show after LOD 0. Each next LOD adds points.
      entry.volumeData = new OpenVDB.WVDBLoader().load(
        `./assets/${params.model}.wvdb`,
        (volumeData) => {
          if (!isCurrent()) {
            return;
          }

          const grid = Object.values(volumeData.grids).find(({ isPoints }) => isPoints);
          const object = new OpenVDB.VDBPoints(grid);

          volumeData.attach(object);
          addObject(object, grid.bbox);
        },
        ({ lod, lods, done }) => {
          if (!isCurrent()) {
            return;
          }

          setStatus(`LOD ${lod + 1} / ${lods}`);

          if (done && lod === lods - 1) {
            onBuilt(entry.object);
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

        const grid = Object.values(vdb.grids).find((each) => each.isPointData());
        const bbox = new Three.Box3().set(...grid.getPreciseWorldBbox());

        setStatus('Building...');

        const object =
          getRender() === 'points'
            ? new OpenVDB.VDBPoints(grid, {}, onBuilt)
            : new OpenVDB.FrameVolume(grid, { resolution: 100, progressive: true }, onBuilt);

        addObject(object, bbox);
      },
      undefined,
      onError,
    );
  };

  const showRenderFields = () => {
    getController('format')?.show(hasVDB());
    getController('render')?.show(getFormat() === 'vdb');
    getController('color')?.show(getRender() === 'points');
  };

  const rebuildOnChange = (key) => (value) => {
    params[key] = value;

    if (ready) {
      rebuild();
    }
  };

  setGuiFields([
    {
      folder: 'Points',
      children: [
        {
          id: 'model',
          name: 'Model',
          defaultValue: params.model,
          options: { Boat: 'boat_points', Sphere: 'sphere_points' },
          onChange: (value) => {
            params.model = value;
            showRenderFields();
            rebuildOnChange('model')(value);
          },
        },
        {
          id: 'format',
          name: 'Format',
          defaultValue: params.format,
          options: { WVDB: 'wvdb', VDB: 'vdb' },
          onChange: (value) => {
            params.format = value;
            showRenderFields();
            rebuildOnChange('format')(value);
          },
        },
        {
          id: 'render',
          name: 'Render',
          defaultValue: params.render,
          options: { Points: 'points', Fog: 'fog' },
          onChange: (value) => {
            params.render = value;
            showRenderFields();
            rebuildOnChange('render')(value);
          },
        },
        {
          id: 'color',
          name: 'Color',
          defaultValue: params.color,
          onChange: (value) => {
            params.color = value;
            applyColor();
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
      ],
    },
  ]);

  getController('status')?.disable();
  showRenderFields();

  ready = true;
  rebuild();
};

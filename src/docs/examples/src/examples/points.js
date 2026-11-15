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
    model: 'sphere_points',
    // NOTE 'points' (VDBPoints), 'liquid' (VDBLiquid) or 'fog' (FrameVolume, density from the point offsets in voxels)
    render: 'points',
    color: '#ffffff',
    // NOTE Liquid only: sphere radius multiplier, depth filter multiplier, distance detail
    radiusScale: 1.0,
    blend: 1.0,
    lod: false,
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

  // NOTE Points: point color. Liquid: tint, a filter color (white is clear water).
  const applyColor = () => {
    if (entry?.object?.isVDBPoints) {
      entry.object.material.color.set(params.color);
    }

    if (entry?.object?.isVDBLiquid) {
      entry.object.color.set(params.color);
    }
  };

  const applyLiquid = () => {
    if (entry?.object?.isVDBLiquid) {
      entry.object.radiusScale = params.radiusScale;
      entry.object.blend = params.blend;
      entry.object.lod = params.lod;
    }
  };

  const liquidFields = ['radiusScale', 'blend', 'lod'];

  const removePoints = () => {
    if (!entry) {
      return;
    }

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
    applyLiquid();
  };

  const rebuild = () => {
    const currentBuildId = ++buildId;
    const startTime = performance.now();
    // NOTE A demo change clears the scene. Then old callbacks must not change the GUI of the next demo.
    const isCurrent = () => currentBuildId === buildId && scene.children.includes(entry?.pivot);

    const onBuilt = (object) => {
      if (isCurrent()) {
        const time = Math.round(performance.now() - startTime);
        const count =
          object?.isVDBPoints || object?.isVDBLiquid ? `${object.pointCount.toLocaleString()} points, ` : '';

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

    entry = { pivot: new Three.Group(), object: null };
    scene.add(entry.pivot);

    setLoading('points', true);
    setStatus('Loading...');

    new OpenVDB.VDBLoader().load(
      `./assets/${params.model}.vdb`,
      (vdb) => {
        if (!isCurrent()) {
          return;
        }

        const grid = Object.values(vdb.grids).find((each) => each.isPointData());
        const bbox = new Three.Box3().set(...grid.getPreciseWorldBbox());

        setStatus('Building...');

        const objects = {
          points: () => new OpenVDB.VDBPoints(grid, {}, onBuilt),
          liquid: () => new OpenVDB.VDBLiquid(grid, {}, onBuilt),
          fog: () => new OpenVDB.FrameVolume(grid, { resolution: 100, progressive: true }, onBuilt),
        };
        const object = objects[params.render]();

        addObject(object, bbox);
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
      folder: 'Points',
      children: [
        {
          id: 'render',
          name: 'Render',
          defaultValue: params.render,
          options: { Points: 'points', Liquid: 'liquid', Fog: 'fog' },
          onChange: (value) => {
            getController('color')?.show(value !== 'fog');
            liquidFields.forEach((id) => getController(id)?.show(value === 'liquid'));
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
          id: 'radiusScale',
          name: 'Radius',
          defaultValue: params.radiusScale,
          min: 0.25,
          max: 3.0,
          onChange: (value) => {
            params.radiusScale = value;
            applyLiquid();
          },
        },
        {
          id: 'blend',
          name: 'Blend',
          defaultValue: params.blend,
          min: 0.0,
          max: 3.0,
          onChange: (value) => {
            params.blend = value;
            applyLiquid();
          },
        },
        {
          id: 'lod',
          name: 'Distance Detail',
          defaultValue: params.lod,
          onChange: (value) => {
            params.lod = value;
            applyLiquid();
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
  // NOTE The Render field calls onChange before the liquid fields exist
  liquidFields.forEach((id) => getController(id)?.show(params.render === 'liquid'));

  ready = true;
  rebuild();
};

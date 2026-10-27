import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { gui, setGuiFields } from '../utils/gui';
import { loaders } from '../utils/resources';
import { setLoading } from '../utils/loading';

// NOTE Longest side of each volume in scene units
const displaySize = 100.0;

// NOTE Sequences have one .wvdb file per frame, listed in frames.json. The examples have no .vdb files of them.
const sequences = {
  ground_explosion: {
    frames: './assets/ground_explosion/frames.json',
    // NOTE EmberGen files are Z-up
    upAxis: 'z',
    emissiveGrid: 'flames',
    // NOTE Approximately the 99th percentile of the flames grid
    emissiveScale: 6.0,
    baseColor: '#333333',
    extinction: 450.0,
    fps: 60,
  },
};

const defaultExtinction = 100.0;

const getExtinction = (asset) => sequences[asset]?.extinction ?? defaultExtinction;

const formatBytes = (bytes) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

export const exampleWVDB = ({ scene }) => {
  const params = {
    asset: 'ground_explosion',
    format: 'wvdb',
    maxLod: 'all',
    extinction: getExtinction('ground_explosion'),
    densityScale: 1.0,
    rotate: true,
  };

  let entry = null;
  let buildId = 0;
  // NOTE The GUI calls onChange with default values. Load one time after that.
  let ready = false;

  const sun = new Three.DirectionalLight(0xffffff, 1.0);
  sun.position.set(100.0, 200.0, 100.0);
  scene.add(sun);
  scene.add(new Three.HemisphereLight(0x88aaff, 0x443322, 0.5));

  loaders.rgbe.load('./assets/uv-1-HDR.hdr', (env) => {
    env.mapping = Three.EquirectangularReflectionMapping;
    scene.environment = env;
  });

  loaders.texture.load('./assets/uv-1-8K.jpg', (env) => {
    env.mapping = Three.EquirectangularRefractionMapping;
    env.colorSpace = Three.SRGBColorSpace;
    scene.background = env;
  });

  let lastTime = performance.now();

  setInterval(() => {
    const now = performance.now();

    if (entry) {
      if (params.rotate) {
        entry.pivot.rotation.y += 0.005;
      }

      // NOTE Sequences play in a FrameVolumeAnimation
      entry.volume?.update?.((now - lastTime) / 1000.0);
    }

    lastTime = now;
  }, 1000 / 60);

  const setStatus = (text) => {
    getController('status')?.setValue(text);
  };

  const applyVolumeParams = () => {
    if (entry?.volume) {
      entry.volume.extinction = params.extinction;
      entry.volume.densityScale = params.densityScale;
    }
  };

  const removeVolume = () => {
    if (!entry) {
      return;
    }

    entry.volumeData?.dispose();
    entry.volume?.dispose();
    scene.remove(entry.pivot);
    entry = null;
  };

  // NOTE Fits the box to displaySize and puts its center at the scene origin.
  // Z-up volumes turn -90 degrees on X.
  const addVolume = (volume, bbox, upAxis = 'y') => {
    const size = bbox.getSize(new Three.Vector3());
    const scale = displaySize / Math.max(size.x, size.y, size.z);
    const up = new Three.Group();

    up.rotation.x = upAxis === 'z' ? -Math.PI / 2.0 : 0.0;
    volume.scale.setScalar(scale);
    volume.position.copy(bbox.getCenter(new Three.Vector3())).multiplyScalar(-scale);

    entry.volume = volume;
    up.add(volume);
    entry.pivot.add(up);
    applyVolumeParams();
  };

  // NOTE LOD 0 of all frames loads first. Then the animation plays, and finer LODs load frame by frame.
  const loadSequence = (currentBuildId, startTime) => {
    const sequence = sequences[params.asset];
    const times = [];
    const folder = sequence.frames.slice(0, sequence.frames.lastIndexOf('/') + 1);

    const onError = (error) => {
      console.error('WVDBAnimationLoader', { error });
      setStatus('Could not load the WVDB sequence.');
      setLoading('wvdb', false);
    };

    fetch(sequence.frames)
      .then((response) => response.json())
      .then(({ frames }) => {
        if (currentBuildId !== buildId) {
          return;
        }

        const loader = new OpenVDB.WVDBAnimationLoader().setOptions({
          emissiveGrid: sequence.emissiveGrid,
          emissiveScale: sequence.emissiveScale,
        });

        if (params.maxLod !== 'all') {
          loader.setMaxLod(Number(params.maxLod));
        }

        const animation = loader.load(
          frames.map((frame) => `${folder}${frame}`),
          () => {
            if (currentBuildId !== buildId) {
              return;
            }

            addVolume(animation, animation.bbox, sequence.upAxis);
            animation.play();
          },
          ({ lod, loadedFrames, totalFrames }) => {
            if (currentBuildId !== buildId) {
              return;
            }

            if (loadedFrames === totalFrames) {
              times[lod] = Math.round(performance.now() - startTime);
            }

            const lodTimes = times
              .map((time, index) => (time === undefined ? null : `LOD ${index}: ${time} ms`))
              .filter(Boolean)
              .join(', ');
            const loading =
              loadedFrames < totalFrames ? ` | LOD ${lod}: ${loadedFrames} / ${totalFrames}` : '';

            setStatus(`${lodTimes}${loading}`);

            if (lod === 0 && loadedFrames === totalFrames) {
              setLoading('wvdb', false);
            }
          },
          onError,
        );

        // NOTE New frames get these values too
        animation.baseColor = sequence.baseColor;
        animation.fps = sequence.fps;

        // NOTE The animation is in entry before it shows, so removeVolume stops its downloads
        entry.volume = animation;
      })
      .catch(onError);
  };

  const loadWVDB = (currentBuildId, startTime) => {
    const times = [];

    const loader = new OpenVDB.WVDBLoader();

    if (params.maxLod !== 'all') {
      loader.setMaxLod(Number(params.maxLod));
    }

    entry.volumeData = loader.load(
      `./assets/${params.asset}.wvdb`,
      (volumeData) => {
        if (currentBuildId !== buildId) {
          return;
        }

        const grid = Object.values(volumeData.grids)[0];
        const volume = new OpenVDB.FrameVolume(grid.data, {
          resolution: grid.resolution,
          bbox: grid.bbox,
        });

        volumeData.attach(volume);
        addVolume(volume, grid.bbox);
      },
      ({ lod, lods, lodComplete, done, bytesLoaded, bytesTotal }) => {
        if (currentBuildId !== buildId) {
          return;
        }

        if (lodComplete) {
          times[lod] = Math.round(performance.now() - startTime);
        }

        const lodTimes = times
          .map((time, index) => (time === undefined ? null : `LOD ${index}: ${time} ms`))
          .filter(Boolean)
          .join(', ');

        setStatus(`${lodTimes} | ${formatBytes(bytesLoaded)} / ${formatBytes(bytesTotal)}`);

        if (done && lod === lods - 1) {
          setLoading('wvdb', false);
        }
      },
      (error) => {
        console.error('WVDBLoader', { error });
        setStatus('Could not load the WVDB file.');
        setLoading('wvdb', false);
      },
    );
  };

  const loadVDB = (currentBuildId, startTime) => {
    new OpenVDB.VDBLoader().load(
      `./assets/${params.asset}.vdb`,
      (vdb) => {
        if (currentBuildId !== buildId) {
          return;
        }

        const parseTime = Math.round(performance.now() - startTime);
        const bbox = new Three.Box3().set(
          ...Object.values(vdb.grids)[0].getPreciseWorldBbox(),
        );

        setStatus(`Loaded and parsed: ${parseTime} ms`);

        // NOTE Same resolution as the baked file
        const volume = new OpenVDB.FrameVolume(vdb, { resolution: 128, progressive: true }, () => {
          if (currentBuildId !== buildId) {
            return;
          }

          const convertTime = Math.round(performance.now() - startTime);

          setStatus(`Loaded and parsed: ${parseTime} ms, converted: ${convertTime} ms`);
          setLoading('wvdb', false);
        });

        addVolume(volume, bbox);
      },
      null,
      (error) => {
        console.error('VDBLoader', { error });
        setStatus('Could not load the VDB file.');
        setLoading('wvdb', false);
      },
    );
  };

  const rebuild = () => {
    const currentBuildId = ++buildId;
    const startTime = performance.now();

    removeVolume();

    entry = { pivot: new Three.Group(), volume: null, volumeData: null };
    scene.add(entry.pivot);

    setLoading('wvdb', true);
    setStatus('Loading...');

    if (sequences[params.asset]) {
      if (params.format === 'wvdb') {
        loadSequence(currentBuildId, startTime);
      } else {
        setStatus('The examples have only .wvdb files of this sequence.');
        setLoading('wvdb', false);
      }
    } else if (params.format === 'wvdb') {
      loadWVDB(currentBuildId, startTime);
    } else {
      loadVDB(currentBuildId, startTime);
    }
  };

  const setParam = (key, rebuildVolume) => (value) => {
    params[key] = value;

    if (!ready) {
      return;
    }

    if (rebuildVolume) {
      rebuild();
    } else {
      applyVolumeParams();
    }
  };

  setGuiFields([
    {
      folder: 'Streaming',
      children: [
        {
          id: 'asset',
          name: 'Asset',
          defaultValue: params.asset,
          options: {
            'Ground Explosion (sequence, EmberGen)': 'ground_explosion',
            'Bunny Cloud': 'bunny_cloud',
            'Venus Statue (level set)': 'venusstatue',
            'Utah Teapot (level set)': 'utahteapot',
            Smoke: 'smoke',
          },
          onChange: (value) => {
            // NOTE Each asset has its own default extinction
            if (ready) {
              getController('extinction')?.setValue(getExtinction(value));
            }

            setParam('asset', true)(value);
          },
        },
        {
          id: 'format',
          name: 'Format',
          defaultValue: params.format,
          options: {
            '.wvdb (streamed)': 'wvdb',
            '.vdb (source)': 'vdb',
          },
          onChange: setParam('format', true),
        },
        {
          id: 'maxLod',
          name: 'Max LOD (.wvdb)',
          defaultValue: params.maxLod,
          options: {
            All: 'all',
            'LOD 0': '0',
            'LOD 1': '1',
            'LOD 2': '2',
          },
          onChange: setParam('maxLod', true),
        },
        {
          id: 'reload',
          name: 'Reload',
          defaultValue: () => rebuild(),
        },
        {
          id: 'status',
          name: 'Status',
          defaultValue: '',
        },
      ],
    },
    {
      folder: 'Volume',
      children: [
        {
          id: 'extinction',
          name: 'Extinction',
          defaultValue: params.extinction,
          min: 1.0,
          max: 500.0,
          onChange: setParam('extinction'),
        },
        {
          id: 'densityScale',
          name: 'Density Scale',
          defaultValue: params.densityScale,
          min: 0.0,
          max: 4.0,
          onChange: setParam('densityScale'),
        },
        {
          id: 'rotate',
          name: 'Rotate',
          defaultValue: params.rotate,
          onChange: setParam('rotate'),
        },
      ],
    },
  ]);

  getController('status')?.disable();

  ready = true;
  rebuild();
};

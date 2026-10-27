import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { gui, setGuiFields } from '../utils/gui';
import { loaders } from '../utils/resources';
import { setLoading } from '../utils/loading';

// NOTE Longest side of each volume in scene units
const displaySize = 100.0;

// NOTE Sequences have one .wvdb file per frame, listed in frames.json
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
    asset: 'bunny_cloud',
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

  // NOTE Sequences play in a FrameVolumeAnimation
  setInterval(() => {
    const now = performance.now();

    entry?.volume?.update?.((now - lastTime) / 1000.0);
    lastTime = now;
  }, 1000 / 60);

  const setStatus = (text) => {
    getController('status')?.setValue(text);
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
    volume.extinction = getExtinction(params.asset);

    entry.volume = volume;
    up.add(volume);
    entry.pivot.add(up);
  };

  // NOTE LOD 0 of all frames decodes first. Then the animation plays, and finer LODs follow.
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

        const animation = new OpenVDB.WVDBAnimationLoader()
          .setOptions({
            emissiveGrid: sequence.emissiveGrid,
            emissiveScale: sequence.emissiveScale,
          })
          .load(
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

  const loadFile = (currentBuildId, startTime) => {
    const times = [];

    entry.volumeData = new OpenVDB.WVDBLoader().load(
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

  const rebuild = () => {
    const currentBuildId = ++buildId;
    const startTime = performance.now();

    removeVolume();

    entry = { pivot: new Three.Group(), volume: null, volumeData: null };
    scene.add(entry.pivot);

    setLoading('wvdb', true);
    setStatus('Loading...');

    if (sequences[params.asset]) {
      loadSequence(currentBuildId, startTime);
    } else {
      loadFile(currentBuildId, startTime);
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
            params.asset = value;

            if (ready) {
              rebuild();
            }
          },
        },
        {
          id: 'status',
          name: 'Status',
          defaultValue: '',
        },
      ],
    },
  ]);

  getController('status')?.disable();

  ready = true;
  rebuild();
};

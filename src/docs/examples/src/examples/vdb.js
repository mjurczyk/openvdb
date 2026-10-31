import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { gui, setGuiFields, dropTarget } from '../utils/gui';
import { loadEnvironment } from '../utils/resources';
import { SimpleDropzone } from 'simple-dropzone';
import zip from 'zip-js-esm';
import { setLoading } from '../utils/loading';

let animation, volumePivot, targetScene;
// NOTE Instances of the animation, for the Copies field. Disposed before the animation.
let copies = [];
let dropId = 0;
let lastFiles = null;
// NOTE Object URLs of the .wvdb frames. Finer LODs read them later, so they are released with the animation.
let wvdbUrls = [];

// NOTE Conversion settings for each emissive grid name
const emissivePresets = {
  none: null,
  // NOTE Approximately the 99th percentile of the flames grid in the ground explosion sample
  flames: { emissiveScale: 6.0, temperatureMax: 6500.0 },
  // NOTE Kelvin values. The maximum of the temperature grid in the dark portal sample.
  temperature: { emissiveScale: 5052.0, temperatureMax: 5052.0 },
};

const params = {
  baseColor: '#ffffff',
  absorbance: 1.0,
  densityScale: 1.0,
  opacity: 1.0,
  extinction: 300.0,
  shadowSteps: 32,
  emissiveIntensity: 1.0,
  temperatureMin: 0.0,
  temperatureMax: 6500.0,
  upAxis: 'y',
  emissiveGrid: 'flames',
  lighting: 'frame',
  animateLights: true,
  playing: true,
  fps: 24,
  loop: true,
  emissionLight: false,
  emissionIntensity: 1.0,
  emissionResolution: 16,
  copies: 1,
  sceneMeshes: false,
};

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

const applyVolumeParams = () => {
  if (!animation) {
    return;
  }

  animation.baseColor = params.baseColor;
  animation.absorbance = params.absorbance;
  animation.densityScale = params.densityScale;
  animation.opacity = params.opacity;
  animation.extinction = params.extinction;
  animation.shadowSteps = params.shadowSteps;
  animation.emissiveIntensity = params.emissiveIntensity;
  animation.temperatureRange = [params.temperatureMin, params.temperatureMax];

  copies.forEach((copy) => {
    copy.baseColor = params.baseColor;
    copy.absorbance = params.absorbance;
    copy.densityScale = params.densityScale;
    copy.opacity = params.opacity;
    copy.extinction = params.extinction;
    copy.shadowSteps = params.shadowSteps;
    copy.emissiveIntensity = params.emissiveIntensity;
    copy.temperatureRange = [params.temperatureMin, params.temperatureMax];
  });
};

const removeCopies = () => {
  copies.forEach((copy) => {
    copy.removeFromParent();
    copy.dispose();
  });

  copies = [];
};

const applyPlaybackParams = () => {
  if (!animation) {
    return;
  }

  animation.fps = params.fps;
  animation.loop = params.loop;

  if (params.playing) {
    animation.play();
  } else {
    animation.pause();
  }
};

const removeAnimation = () => {
  if (!animation) {
    return;
  }

  if (volumePivot.parent) volumePivot.parent.remove(volumePivot);

  // NOTE Instances first, then the animation
  removeCopies();

  // NOTE dispose() also stops the frame downloads
  animation.dispose();
  wvdbUrls.forEach((url) => URL.revokeObjectURL(url));
  wvdbUrls = [];

  animation = null;
  volumePivot = null;

  setLoading('vdb', false);
};

// NOTE VDB files do not store an up axis. Z-up files (EmberGen, Blender) turn -90 degrees on X.
const applyUpAxis = () => {
  if (volumePivot) {
    volumePivot.rotation.x = params.upAxis === 'z' ? -Math.PI / 2.0 : 0.0;
  }
};

const showAnimation = () => {
  applyVolumeParams();
  applyPlaybackParams();

  // NOTE The pivot turns the volume around its center
  volumePivot = new Three.Group();
  volumePivot.add(animation);
  applyUpAxis();

  if (targetScene) {
    targetScene.add(volumePivot);
  }
};

const createAnimation = (urls) => {
  removeAnimation();
  setLoading('vdb', true);

  const startTime = performance.now();
  const releaseUrls = () => urls.forEach((url) => URL.revokeObjectURL(url));

  const loadingAnimation = new OpenVDB.VDBAnimationLoader()
    .setOptions({
      resolution: 100,
      progressive: true,
      ...(emissivePresets[params.emissiveGrid] && {
        emissiveGrid: params.emissiveGrid,
        emissiveScale: emissivePresets[params.emissiveGrid].emissiveScale,
      }),
    })
    .load(
      urls,
      () => {
        releaseUrls();
        setLoading('vdb', false);
        console.info('VDB animation converted', `${(performance.now() - startTime).toFixed(0)}ms`);
      },
      ({ loadedFrames, totalFrames }) => {
        dropTarget.innerHTML =
          loadedFrames < totalFrames
            ? `[Converting frame ${loadedFrames + 1} / ${totalFrames}...]`
            : '[Drop .VDB / .WVDB / .ZIP here]';

        // NOTE The box is known after the first frame. Center it at the scene origin.
        animation.position.copy(animation.bbox.getCenter(new Three.Vector3())).negate();

        getController('frame')?.max(Math.max(1, loadedFrames - 1));
      },
      (error) => {
        releaseUrls();

        if (loadingAnimation === animation) {
          setLoading('vdb', false);
          dropTarget.innerHTML = '[Error - please try again]';
        }

        console.error(error);
      },
    );

  animation = loadingAnimation;

  showAnimation();
};

// NOTE LOD 0 of all frames loads first. Then the animation can play, and finer LODs load frame by frame.
const createWVDBAnimation = (urls) => {
  removeAnimation();
  setLoading('vdb', true);

  const startTime = performance.now();
  const preset = emissivePresets[params.emissiveGrid];

  wvdbUrls = urls;

  const loadingAnimation = new OpenVDB.WVDBAnimationLoader()
    .setOptions({
      ...(preset && {
        emissiveGrid: params.emissiveGrid,
        emissiveScale: preset.emissiveScale,
      }),
    })
    .load(
      urls,
      () => {
        setLoading('vdb', false);
        console.info('WVDB animation, LOD 0', `${(performance.now() - startTime).toFixed(0)}ms`);
      },
      ({ lod, loadedFrames, totalFrames }) => {
        dropTarget.innerHTML =
          lod === 0 && loadedFrames < totalFrames
            ? `[Loading LOD 0: frame ${loadedFrames + 1} / ${totalFrames}...]`
            : loadedFrames < totalFrames
            ? `[Playing. Loading LOD ${lod}: frame ${loadedFrames + 1} / ${totalFrames}...]`
            : '[Drop .VDB / .WVDB / .ZIP here]';

        if (lod === 0) {
          // NOTE The box grows while frames arrive. Center it at the scene origin.
          animation.position.copy(animation.bbox.getCenter(new Three.Vector3())).negate();
          getController('frame')?.max(Math.max(1, loadedFrames - 1));
        }
      },
      (error) => {
        if (loadingAnimation === animation) {
          setLoading('vdb', false);
          dropTarget.innerHTML = '[Error - please try again]';
        }

        console.error(error);
      },
    );

  animation = loadingAnimation;

  showAnimation();
};

// NOTE Reads the VDB entries one at a time. Reader errors reject the promise.
const unzipVDBs = (file, onProgress) =>
  new Promise((resolve, reject) => {
    zip.useWebWorkers = false;

    zip.createReader(
      new zip.BlobReader(file),
      (reader) => {
        reader.getEntries((entries) => {
          const vdbEntries = entries.filter(
            ({ directory, filename }) =>
              !directory &&
              /\.w?vdb$/i.test(filename) &&
              !filename.split('/').pop().startsWith('.'),
          );
          const files = new Map();

          const readEntry = (index) => {
            if (index >= vdbEntries.length) {
              reader.close();
              resolve(files);

              return;
            }

            onProgress(index, vdbEntries.length);

            vdbEntries[index].getData(new zip.BlobWriter(), (blob) => {
              files.set(vdbEntries[index].filename, blob);
              readEntry(index + 1);
            });
          };

          readEntry(0);
        });
      },
      reject,
    );
  });

// NOTE The frame order is the natural file name order. .wvdb files are used when the drop has them.
const loadFiles = (files) => {
  lastFiles = files;

  const getUrls = (extension) =>
    [...files]
      .filter(([name]) => name.toLowerCase().endsWith(extension))
      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB, undefined, { numeric: true }))
      .map(([, file]) => URL.createObjectURL(file));

  const wvdbUrls = getUrls('.wvdb');

  if (wvdbUrls.length > 0) {
    createWVDBAnimation(wvdbUrls);

    return;
  }

  const urls = getUrls('.vdb');

  if (urls.length === 0) {
    dropTarget.innerHTML = '[No .VDB / .WVDB files - please try again]';
    setLoading('vdb', false);

    return;
  }

  dropTarget.innerHTML = '[Loaded! Parsing...]';

  createAnimation(urls);
};

// NOTE simple-dropzone unpacks a ZIP with no progress and no errors. The demo unpacks a single ZIP.
dropTarget.addEventListener(
  'drop',
  (event) => {
    const files = Array.from(event.dataTransfer.files || []);

    if (files.length !== 1 || !files[0].name.toLowerCase().endsWith('.zip')) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const currentDropId = ++dropId;

    removeAnimation();
    setLoading('vdb', true);

    dropTarget.innerHTML = '[Unzipping...]';

    unzipVDBs(files[0], (index, count) => {
      if (currentDropId === dropId) {
        dropTarget.innerHTML = `[Unzipping ${index + 1} / ${count}...]`;
      }
    })
      .then((vdbFiles) => {
        if (currentDropId === dropId) {
          loadFiles(vdbFiles);
        }
      })
      .catch((error) => {
        if (currentDropId === dropId) {
          setLoading('vdb', false);
          dropTarget.innerHTML = '[Error - please try again]';
        }

        console.error(error);
      });
  },
  true,
);

const dropzone = new SimpleDropzone(dropTarget, document.createElement('input'));

dropTarget.innerHTML = '[Drop .VDB / .WVDB / .ZIP here]';

dropzone.on('drop', ({ files }) => {
  dropId++;

  loadFiles(files);
});

dropzone.on('dropstart', () => {
  removeAnimation();
  setLoading('vdb', true);

  dropTarget.innerHTML = '[Loading files - please wait...]';
});

dropzone.on('droperror', ({ message }) => {
  setLoading('vdb', false);
  dropTarget.innerHTML = '[Error - please try again]';

  console.error({ message });
});

export const exampleVDB = ({ scene }) => {
  targetScene = scene;

  // NOTE Light rig. The "Lights" field shows one light setup at a time.
  const lightHelpers = [];

  const addLightHelper = (light, radius = 1.0) => {
    const helper = new Three.Mesh(
      new Three.SphereGeometry(radius, 16, 16),
      new Three.MeshBasicMaterial({ color: light.color }),
    );

    light.add(helper);
    lightHelpers.push(helper);
  };

  const addPivotLight = (light, x, y, z) => {
    const pivot = new Three.Group();

    light.position.set(x, y, z);
    addLightHelper(light);
    pivot.add(light);
    scene.add(pivot);

    return pivot;
  };

  const sun = new Three.DirectionalLight(0xffffff, 1.0);
  sun.position.set(100.0, 200.0, 100.0);
  addLightHelper(sun, 3.0);
  scene.add(sun);

  const hemiLight = new Three.HemisphereLight(0x88aaff, 0x443322, 0.5);
  scene.add(hemiLight);

  const ambientLight = new Three.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const orbitPointLight = new Three.PointLight(0xff00ff, 1.0);
  const topPointLight = new Three.PointLight(0xff00ff, 1.0);
  const insidePointLight = new Three.PointLight(0xff00ff, 1.0);
  const orbitPointPivot = addPivotLight(orbitPointLight, 50.0, 80.0, 0.0);
  addPivotLight(topPointLight, 0.0, 80.0, 0.0);
  addPivotLight(insidePointLight, 0.0, -10.0, 0.0);

  const orbitSpotLight = new Three.SpotLight(0xff00ff, 1.0, 0.0, 0.2, 0.6);
  const topSpotLight = new Three.SpotLight(0xff00ff, 1.0, 0.0, 0.2, 0.6);
  const orbitSpotPivot = addPivotLight(orbitSpotLight, 50.0, 80.0, 0.0);
  addPivotLight(topSpotLight, 0.0, 80.0, 0.0);

  // NOTE One light for all emissive volumes of the scene. Only three-openvdb (WebGPURenderer) has it.
  const emissionLight = OpenVDB.FrameEmissionLight
    ? new OpenVDB.FrameEmissionLight({
        intensity: params.emissionIntensity,
        resolution: params.emissionResolution,
      })
    : null;

  if (emissionLight) {
    emissionLight.visible = params.emissionLight;
    scene.add(emissionLight);
  }

  // NOTE Lit meshes around the volume, in units of the box width. They stand on the bottom of the box.
  const sceneMeshes = new Three.Group();
  const meshMaterial = new Three.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.8 });
  const ground = new Three.Mesh(new Three.PlaneGeometry(8.0, 8.0), meshMaterial);
  const pillarGeometry = new Three.BoxGeometry(0.12, 0.5, 0.12);
  const sphereGeometry = new Three.SphereGeometry(0.15, 32, 16);

  ground.rotation.x = -Math.PI / 2.0;
  sceneMeshes.add(ground);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2.0;
    const pillar = new Three.Mesh(pillarGeometry, meshMaterial);
    const sphere = new Three.Mesh(sphereGeometry, meshMaterial);

    pillar.position.set(Math.cos(angle) * 1.0, 0.25, Math.sin(angle) * 1.0);
    sphere.position.set(Math.cos(angle + 0.4) * 1.6, 0.15, Math.sin(angle + 0.4) * 1.6);
    sceneMeshes.add(pillar, sphere);
  }

  sceneMeshes.visible = params.sceneMeshes;
  scene.add(sceneMeshes);

  const getGroundSize = () => {
    const size = animation.bbox.getSize(new Three.Vector3());

    return {
      height: params.upAxis === 'z' ? size.z : size.y,
      width: Math.max(size.x, params.upAxis === 'z' ? size.y : size.z),
    };
  };

  const placeSceneMeshes = () => {
    if (!animation || animation.bbox.isEmpty()) {
      return;
    }

    const { height, width } = getGroundSize();

    sceneMeshes.position.y = -height / 2.0;
    sceneMeshes.scale.setScalar(width);
    ground.scale.setScalar(Math.max(1.0, (Math.ceil(Math.sqrt(params.copies)) * 1.5 + 4.0) / 8.0));
  };

  // NOTE Copies stand on a square grid around the animation, 1.5 box widths apart. Each one starts at another frame.
  const updateCopies = (delta) => {
    if (!animation || animation.frames.length === 0 || animation.bbox.isEmpty()) {
      return;
    }

    const wrongAnimation = copies.length > 0 && copies[0].animation !== animation;

    if (copies.length !== params.copies - 1 || wrongAnimation) {
      removeCopies();

      copies = Array.from({ length: params.copies - 1 }, (_, index) => {
        const copy = animation.createInstance();

        copy.frame = Math.round(((index + 1) / params.copies) * animation.frames.length);
        volumePivot.add(copy);

        return copy;
      });

      applyVolumeParams();
    }

    const spacing = getGroundSize().width * 1.5;
    const side = Math.ceil(Math.sqrt(params.copies));
    const middle = Math.floor(side / 2);
    let slot = 0;

    copies.forEach((copy) => {
      // NOTE The middle slot is the animation
      if (slot === middle * side + middle) {
        slot++;
      }

      copy.position.copy(animation.position);
      copy.position.x += ((slot % side) - middle) * spacing;

      // NOTE The pivot turns Z-up volumes, so the second ground axis is Y in the pivot
      if (params.upAxis === 'z') {
        copy.position.y += (Math.floor(slot / side) - middle) * spacing;
      } else {
        copy.position.z += (Math.floor(slot / side) - middle) * spacing;
      }

      copy.fps = params.fps;
      copy.loop = params.loop;

      if (params.playing) {
        copy.play();
      } else {
        copy.pause();
      }

      copy.update(delta);
      slot++;
    });
  };

  const lightSetups = {
    sunHemi: [sun, hemiLight],
    dir: [sun],
    hemi: [hemiLight],
    point: [orbitPointLight, topPointLight],
    pointInside: [insidePointLight],
    spot: [orbitSpotLight, topSpotLight],
    ambient: [ambientLight],
    all: [
      sun,
      hemiLight,
      ambientLight,
      orbitPointLight,
      topPointLight,
      orbitSpotLight,
      topSpotLight,
    ],
    none: [],
  };

  const coloredLights = [
    sun,
    orbitPointLight,
    topPointLight,
    insidePointLight,
    orbitSpotLight,
    topSpotLight,
  ];

  setInterval(() => {
    if (params.animateLights) {
      orbitPointPivot.rotateX(0.005);
      orbitSpotPivot.rotateY(0.005);
    }
  }, 1000 / 60);

  let lastTime = performance.now();

  setInterval(() => {
    const now = performance.now();

    updateCopies((now - lastTime) / 1000.0);
    placeSceneMeshes();

    if (animation) {
      const previousFrame = animation.frame;

      animation.update((now - lastTime) / 1000.0);

      if (animation.frame !== previousFrame) {
        getController('frame')?.setValue(animation.frame);
      }
    }

    lastTime = now;
  }, 1000 / 60);

  const setParam = (key) => (value) => {
    params[key] = value;

    applyVolumeParams();
  };

  const setFrameSetting = (key) => (value) => {
    OpenVDB.frameRenderer.settings[key] = Math.round(value);
  };

  setGuiFields([
    {
      folder: 'Scene',
      children: [
        {
          id: 'environment',
          name: 'EnvMap',
          defaultValue: 'uv-1',
          options: {
            'Night Realistic': 'night',
            'Fiery Sky': 'fiery-sky-1',
            'Magic Forest': 'magic-forest-5',
            UV: 'uv-1',
          },
          onChange: (value) => {
            loadEnvironment(scene, value);
          },
        },
        {
          id: 'lightSetup',
          name: 'Lights',
          defaultValue: 'sunHemi',
          options: {
            'Sun + Hemisphere': 'sunHemi',
            Directional: 'dir',
            Hemisphere: 'hemi',
            'Point Lights': 'point',
            'Point Light Inside': 'pointInside',
            'Spot Lights': 'spot',
            Ambient: 'ambient',
            All: 'all',
            None: 'none',
          },
          onChange: (value) => {
            const visibleLights = lightSetups[value];

            [...lightSetups.all, insidePointLight].forEach((light) => {
              light.visible = visibleLights.includes(light);
            });
          },
        },
        {
          id: 'lightColor',
          name: 'Light Color',
          defaultValue: '#ff00ff',
          onChange: (value) => {
            coloredLights
              .filter((light) => light !== sun)
              .forEach((light) => light.color.set(value));
            lightHelpers.forEach((helper) => helper.material.color.copy(helper.parent.color));
          },
        },
        {
          id: 'lightIntensity',
          name: 'Light Intensity',
          defaultValue: 1.0,
          min: 0.0,
          max: 5.0,
          onChange: (value) => {
            // NOTE Point and spot lights have decay 2. Distance squared keeps the volumes lit.
            coloredLights.forEach((light) => {
              light.intensity = light.isDirectionalLight
                ? value
                : value * light.position.lengthSq();
            });
          },
        },
        {
          id: 'hemiIntensity',
          name: 'Hemisphere Intensity',
          defaultValue: hemiLight.intensity,
          min: 0.0,
          max: 5.0,
          onChange: (value) => {
            hemiLight.intensity = value;
          },
        },
        {
          id: 'ambientIntensity',
          name: 'Ambient Intensity',
          defaultValue: ambientLight.intensity,
          min: 0.0,
          max: 5.0,
          onChange: (value) => {
            ambientLight.intensity = value;
          },
        },
      ],
    },
    {
      folder: 'Light Emission',
      closed: true,
      children: [
        ...(emissionLight
          ? [
              {
                id: 'emissionLight',
                name: 'Emission Light',
                defaultValue: params.emissionLight,
                onChange: (value) => {
                  params.emissionLight = value;
                  emissionLight.visible = value;
                },
              },
              {
                id: 'emissionIntensity',
                name: 'Light Intensity',
                defaultValue: params.emissionIntensity,
                min: 0.0,
                max: 50.0,
                onChange: (value) => {
                  params.emissionIntensity = value;
                  emissionLight.intensity = value;
                },
              },
              {
                id: 'emissionResolution',
                name: 'Probes',
                defaultValue: params.emissionResolution,
                options: { '8³': 8, '16³': 16, '32³': 32 },
                onChange: (value) => {
                  params.emissionResolution = value;
                  emissionLight.resolution = value;
                },
              },
            ]
          : []),
        {
          id: 'copies',
          name: 'Copies',
          defaultValue: params.copies,
          options: { 1: 1, 10: 10, 100: 100 },
          onChange: (value) => {
            params.copies = value;
          },
        },
        {
          id: 'sceneMeshes',
          name: 'Ground + Props',
          defaultValue: params.sceneMeshes,
          onChange: (value) => {
            params.sceneMeshes = value;
            sceneMeshes.visible = value;
          },
        },
      ],
    },
    {
      folder: 'Animation',
      closed: true,
      children: [
        {
          id: 'playing',
          name: 'Play',
          defaultValue: params.playing,
          onChange: (value) => {
            params.playing = value;

            applyPlaybackParams();
          },
        },
        {
          id: 'fps',
          name: 'FPS',
          defaultValue: params.fps,
          min: 1,
          max: 60,
          onChange: (value) => {
            params.fps = Math.round(value);

            applyPlaybackParams();
          },
        },
        {
          id: 'loop',
          name: 'Loop',
          defaultValue: params.loop,
          onChange: (value) => {
            params.loop = value;

            applyPlaybackParams();
          },
        },
        {
          id: 'frame',
          name: 'Frame',
          defaultValue: 0,
          min: 0,
          max: 1,
          onChange: (value) => {
            if (animation) animation.frame = value;
          },
        },
      ],
    },
    {
      folder: 'Volume',
      closed: true,
      children: [
        {
          id: 'upAxis',
          name: 'Up Axis',
          defaultValue: params.upAxis,
          options: {
            Y: 'y',
            Z: 'z',
          },
          onChange: (value) => {
            params.upAxis = value;

            applyUpAxis();
          },
        },
        {
          id: 'emissiveGrid',
          name: 'Emissive Grid',
          defaultValue: params.emissiveGrid,
          options: {
            None: 'none',
            flames: 'flames',
            temperature: 'temperature',
          },
          onChange: (value) => {
            if (value === params.emissiveGrid) {
              return;
            }

            params.emissiveGrid = value;

            if (emissivePresets[value]) {
              getController('temperatureMax')?.setValue(emissivePresets[value].temperatureMax);
            }

            // NOTE The emissive grid is set at conversion. Convert the last files again.
            if (lastFiles) {
              dropId++;
              loadFiles(lastFiles);
            }
          },
        },
        {
          id: 'fogColor',
          name: 'Base Color',
          defaultValue: params.baseColor,
          onChange: setParam('baseColor'),
        },
        {
          id: 'absorbance',
          name: 'Absorbance',
          defaultValue: params.absorbance,
          min: 0.0,
          max: 1.0,
          onChange: setParam('absorbance'),
        },
        {
          id: 'densityScale',
          name: 'Density Scale',
          defaultValue: params.densityScale,
          min: 0.0,
          max: 1.0,
          onChange: setParam('densityScale'),
        },
        {
          id: 'opacity',
          name: 'Opacity',
          defaultValue: params.opacity,
          min: 0.0,
          max: 1.0,
          onChange: setParam('opacity'),
        },
        {
          id: 'extinction',
          name: 'Extinction',
          defaultValue: params.extinction,
          min: 1.0,
          max: 1000.0,
          onChange: setParam('extinction'),
        },
        {
          id: 'emissiveIntensity',
          name: 'Emissive Intensity',
          defaultValue: params.emissiveIntensity,
          min: 0.0,
          max: 50.0,
          onChange: setParam('emissiveIntensity'),
        },
        {
          id: 'temperatureMin',
          name: 'Temperature Min (K)',
          defaultValue: params.temperatureMin,
          min: 0.0,
          max: 3000.0,
          onChange: setParam('temperatureMin'),
        },
        {
          id: 'temperatureMax',
          name: 'Temperature Max (K)',
          defaultValue: params.temperatureMax,
          min: 1000.0,
          max: 12000.0,
          onChange: setParam('temperatureMax'),
        },
      ],
    },
  ]);
};

import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB, loadEnvironment } from '../utils/resources';
import { setLoading } from '../utils/loading';
import { createEmissionDemo } from '../utils/emission';
import { isPhone } from '../utils/device';

// NOTE Stress test: one bunny is converted one time, in a cube box.
// All grid volumes use its raw density data.
const bunnyGridResolution = 100;
const bunnyGridSize = 10;
let bunnyGridData = null;

// NOTE The Ground Explosion sequence of the Streaming demo. Z-up, scaled to explosionSize units.
const explosion = {
  frames: './assets/ground_explosion/frames.json',
  emissiveGrid: 'flames',
  // NOTE Approximately the 99th percentile of the flames grid
  emissiveScale: 6.0,
  baseColor: '#888888',
  extinction: 450.0,
  emissiveIntensity: 25.0,
  // NOTE Emission light settings for the explosion
  lightIntensity: 25.0,
  probes: 32,
  fps: 60,
  // NOTE On phones the sequence stops at LOD 1 (64³), the same as the Streaming demo
  maxLod: isPhone ? 1 : Infinity,
};
const explosionSize = 100.0;

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

const getBunnyGridData = (vdb, center, size) => {
  if (bunnyGridData) {
    return Promise.resolve(bunnyGridData);
  }

  return new Promise((resolve) => {
    // NOTE Raw density data must be a cube. Then the texture has the same texel count on all sides.
    const side = Math.max(size.x, size.y, size.z);
    const bbox = new Three.Box3().setFromCenterAndSize(center, new Three.Vector3(side, side, side));

    const converter = new OpenVDB.FrameVolume(
      vdb,
      { resolution: bunnyGridResolution, bbox },
      () => {
        bunnyGridData = { data: converter.volumes[0].densityMap3D.image.data, side };
        converter.dispose();

        resolve(bunnyGridData);
      },
    );
  });
};

export const exampleFrame = ({ scene }) => {
  const params = {
    source: 'bunny',
    format: 'wvdb',
    baseColor: '#ffffff',
    absorbance: 1.0,
    densityScale: 1.0,
    opacity: 1.0,
    extinction: 100.0,
    emissiveIntensity: 1.0,
    temperatureMin: 600.0,
    temperatureMax: 7000.0,
    shadowSteps: 32,
    rotate: true,
    lighting: 'frame',
    animateLights: true,
    mipmaps: true,
  };

  let entries = [];
  // NOTE .wvdb downloads of the current build. A rebuild stops them.
  let streams = [];
  let buildId = 0;
  let rotation = null;

  // NOTE One light for all emissive volumes of the scene, and lit meshes
  const emission = createEmissionDemo(scene);

  const debugObstacle = new Three.Mesh(
    new Three.SphereGeometry(20.0, 32, 32),
    new Three.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.5 }),
  );
  debugObstacle.position.set(0.0, 0.0, 40.0);
  scene.add(debugObstacle);

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

  // NOTE Animation props apply to all frames. A FrameVolume keeps its own Color and Vector2.
  const applyVolumeParams = (volume) => {
    if (volume.isFrameVolumeAnimation) {
      volume.baseColor = params.baseColor;
      volume.temperatureRange = [params.temperatureMin, params.temperatureMax];
    } else {
      volume.baseColor.set(params.baseColor);
      volume.temperatureRange.set(params.temperatureMin, params.temperatureMax);
    }

    volume.absorbance = params.absorbance;
    volume.densityScale = params.densityScale;
    volume.opacity = params.opacity;
    volume.extinction = params.extinction;
    volume.emissiveIntensity = params.emissiveIntensity;
    volume.shadowSteps = params.shadowSteps;
    volume.mipmaps = params.mipmaps;
  };

  const applyParams = () => {
    entries.forEach(({ volume }) => applyVolumeParams(volume));
  };

  let lastTime = performance.now();

  // NOTE The explosion sequence plays in a FrameVolumeAnimation
  setInterval(() => {
    const now = performance.now();

    entries.forEach(({ volume }) => volume.update?.((now - lastTime) / 1000.0));
    lastTime = now;
  }, 1000 / 60);

  const removeVolumes = () => {
    if (rotation) {
      clearInterval(rotation);
      rotation = null;
    }

    entries.forEach(({ pivot, volume }) => {
      scene.remove(pivot);
      volume.dispose();
    });

    streams.forEach((volumeData) => volumeData.dispose());

    entries = [];
    streams = [];
  };

  // NOTE The pivot turns the volume around its own center
  const addVolume = (volume, center) => {
    const pivot = new Three.Group();

    volume.position.copy(center).negate();
    pivot.position.copy(center);
    pivot.add(volume);

    applyVolumeParams(volume);
    scene.add(pivot);
    entries.push({ pivot, volume });

    return pivot;
  };

  const rebuild = () => {
    const currentBuildId = ++buildId;

    removeVolumes();
    setLoading('frame', true);

    const onBuilt = () => {
      if (currentBuildId === buildId) {
        setLoading('frame', false);
      }
    };

    // NOTE LOD 0 of all frames loads first. The animation shows when it can play.
    const addExplosion = () => {
      const onError = (error) => {
        console.error('WVDBAnimationLoader', { error });
        onBuilt();
      };

      fetch(explosion.frames)
        .then((response) => response.json())
        .then(({ frames }) => {
          if (currentBuildId !== buildId) {
            return;
          }

          const folder = explosion.frames.slice(0, explosion.frames.lastIndexOf('/') + 1);
          const animation = new OpenVDB.WVDBAnimationLoader()
            .setOptions({ emissiveGrid: explosion.emissiveGrid, emissiveScale: explosion.emissiveScale })
            .setMaxLod(explosion.maxLod)
            .load(
              frames.map((frame) => `${folder}${frame}`),
              () => {
                if (currentBuildId !== buildId) {
                  return;
                }

                const size = animation.bbox.getSize(new Three.Vector3());
                const scale = explosionSize / Math.max(size.x, size.y, size.z);

                animation.scale.setScalar(scale);
                animation.position.copy(animation.bbox.getCenter(new Three.Vector3())).multiplyScalar(-scale);
                animation.visible = true;
                animation.play();

                // NOTE Z-up: the height is the Z side of the box
                emission.placeMeshes(size.z * scale, Math.max(size.x, size.y) * scale);
                onBuilt();
              },
              undefined,
              onError,
            );

          // NOTE In entries at once, so a rebuild stops the downloads
          const pivot = new Three.Group();

          animation.fps = explosion.fps;
          animation.visible = false;
          pivot.rotation.x = -Math.PI / 2.0;
          pivot.add(animation);
          applyVolumeParams(animation);
          scene.add(pivot);
          entries.push({ pivot, volume: animation });
        })
        .catch(onError);
    };

    if (params.source === 'explosion') {
      addExplosion();

      return;
    }

    // NOTE One bunny, or two bunnies that overlap. createBunny() gives a new volume.
    const addBunnies = (center, size, createBunny) => {
      // NOTE Center the first bunny at the scene origin
      const firstPivot = addVolume(createBunny(), center);
      firstPivot.position.set(0.0, 0.0, 0.0);
      emission.placeMeshes(size.y, Math.max(size.x, size.z));

      if (params.source !== 'twoBunnies') {
        return;
      }

      // NOTE The second bunny overlaps the first by approximately 40 percent of its width
      const secondPivot = addVolume(createBunny(), center);
      secondPivot.position.set(size.x * 0.6, size.y * 0.1, -size.z * 0.2);

      rotation = setInterval(() => {
        if (params.rotate) {
          secondPivot.rotation.y += 0.01;
        }
      }, 1000 / 60);
    };

    // NOTE 10 x 10 bunnies. createGridVolume() gives a new volume with its scale.
    // NOTE One bunny has the textures. The other bunnies are instances of it.
    const addBunnyGrid = (side, createGridVolume) => {
      const spacing = side * 1.1;
      const offset = ((bunnyGridSize - 1) * spacing) / 2.0;
      let source = null;

      // NOTE The ground covers the grid
      emission.placeMeshes(side, side, (bunnyGridSize * 1.1 + 4.0) / 8.0);

      const createBunny = () => {
        if (!source) {
          source = createGridVolume();

          return source;
        }

        const instance = source.createInstance();
        instance.scale.copy(source.scale);

        return instance;
      };

      for (let x = 0; x < bunnyGridSize; x++) {
        for (let z = 0; z < bunnyGridSize; z++) {
          addVolume(createBunny(), new Three.Vector3()).position.set(
            x * spacing - offset,
            0.0,
            z * spacing - offset,
          );
        }
      }
    };

    // NOTE All bunnies use the same .wvdb data. Each LOD makes all of them sharper.
    if (params.format === 'wvdb') {
      const volumeData = new OpenVDB.WVDBLoader().load(
        './assets/bunny_cloud.wvdb',
        () => {
          if (currentBuildId !== buildId) {
            return;
          }

          const grid = volumeData.grids.density || Object.values(volumeData.grids)[0];
          const center = grid.bbox.getCenter(new Three.Vector3());
          const size = grid.bbox.getSize(new Three.Vector3());

          if (params.source === 'bunnyGrid') {
            addBunnyGrid(Math.max(size.x, size.y, size.z), () => {
              const volume = new OpenVDB.FrameVolume(grid.data, { resolution: grid.resolution });
              volume.scale.copy(size);

              return volumeData.attach(volume);
            });

            return;
          }

          addBunnies(center, size, () =>
            volumeData.attach(
              new OpenVDB.FrameVolume(grid.data, { resolution: grid.resolution, bbox: grid.bbox }),
            ),
          );
        },
        ({ done }) => {
          if (done) {
            onBuilt();
          }
        },
        (error) => {
          console.error('WVDBLoader', { error });
          onBuilt();
        },
      );

      streams.push(volumeData);

      return;
    }

    loadAndCacheVDB('bunny_cloud.vdb', './assets/bunny_cloud.vdb').then((vdb) => {
      if (currentBuildId !== buildId) {
        return;
      }

      const sampleGrid = vdb.grids[Object.keys(vdb.grids)[0]];
      const worldBbox = new Three.Box3();
      worldBbox.set(...sampleGrid.getPreciseWorldBbox());

      const center = worldBbox.getCenter(new Three.Vector3());
      const size = worldBbox.getSize(new Three.Vector3());

      if (params.source === 'bunnyGrid') {
        getBunnyGridData(vdb, center, size).then(({ data, side }) => {
          if (currentBuildId !== buildId) {
            return;
          }

          addBunnyGrid(side, () => {
            const volume = new OpenVDB.FrameVolume(data, { resolution: bunnyGridResolution });
            volume.scale.setScalar(side);

            return volume;
          });

          onBuilt();
        });

        return;
      }

      // NOTE The build is done when all bunnies are converted
      let bunniesLeft = params.source === 'twoBunnies' ? 2 : 1;

      const onBunnyConverted = () => {
        bunniesLeft--;

        if (bunniesLeft === 0) {
          onBuilt();
        }
      };

      addBunnies(center, size, () =>
        new OpenVDB.FrameVolume(vdb, { resolution: 100, progressive: true }, onBunnyConverted),
      );
    });
  };

  const setParam = (key) => (value) => {
    params[key] = value;

    applyParams();
  };

  const setFrameSetting = (key) => (value) => {
    OpenVDB.frameRenderer.settings[key] = Math.round(value);
  };

  setGuiFields([
    {
      folder: 'General',
      children: [
        {
          id: 'source',
          name: 'Source',
          defaultValue: params.source,
          options: {
            'Bunny Cloud': 'bunny',
            'Two Bunnies': 'twoBunnies',
            '100 Bunnies (stress test)': 'bunnyGrid',
            'Explosion (Emissive)': 'explosion',
          },
          onChange: (value) => {
            params.source = value;

            // NOTE The explosion lights the ground at night
            if (value === 'explosion') {
              getController('emissionLight')?.setValue(true);
              getController('emissionIntensity')?.setValue(explosion.lightIntensity);
              getController('emissionResolution')?.setValue(explosion.probes);
              getController('sceneMeshes')?.setValue(true);
              getController('environment')?.setValue('night');
              getController('lightIntensity')?.setValue(0.0);
              getController('fogColor')?.setValue(explosion.baseColor);
              getController('extinction')?.setValue(explosion.extinction);
              getController('emissiveIntensity')?.setValue(explosion.emissiveIntensity);
            }

            rebuild();
          },
        },
      ],
    },
    {
      folder: 'Scene',
      closed: true,
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
        {
          id: 'animateLights',
          name: 'Animate Lights',
          defaultValue: params.animateLights,
          onChange: (value) => {
            params.animateLights = value;
          },
        },
        {
          id: 'showObstacle',
          name: 'Show Obstacle',
          defaultValue: false,
          onChange: (value) => {
            debugObstacle.visible = value;
          },
        },
      ],
    },
    {
      folder: 'Rendering',
      closed: true,
      children: [
        {
          id: 'format',
          name: 'Format',
          defaultValue: params.format,
          options: {
            WVDB: 'wvdb',
            VDB: 'vdb',
          },
          onChange: (value) => {
            params.format = value;

            rebuild();
          },
        },
        {
          id: 'rotate',
          name: 'Rotate Second Bunny',
          defaultValue: params.rotate,
          onChange: (value) => {
            params.rotate = value;
          },
        },
        {
          id: 'froxelWidth',
          name: 'Froxels X',
          defaultValue: OpenVDB.frameRenderer.settings.width,
          min: 4,
          max: 1280,
          onChange: setFrameSetting('width'),
        },
        {
          id: 'froxelHeight',
          name: 'Froxels Y',
          defaultValue: OpenVDB.frameRenderer.settings.height,
          min: 4,
          max: 760,
          onChange: setFrameSetting('height'),
        },
        {
          id: 'froxelDepth',
          name: 'Slices',
          defaultValue: OpenVDB.frameRenderer.settings.depth,
          min: 8,
          max: 512,
          onChange: setFrameSetting('depth'),
        },
        {
          id: 'lighting',
          name: 'Lighting',
          defaultValue: params.lighting,
          options: {
            'Combined (shared shadows)': 'frame',
            'Per-volume': 'volume',
          },
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.lighting = value;
          },
        },
        // NOTE WebGPURenderer only. WebGLRenderer always blends on the sRGB canvas.
        ...('srgbBlending' in OpenVDB.frameRenderer.settings
          ? [
              {
                id: 'srgbBlending',
                name: 'sRGB Blending',
                defaultValue: OpenVDB.frameRenderer.settings.srgbBlending,
                onChange: (value) => {
                  OpenVDB.frameRenderer.settings.srgbBlending = value;
                },
              },
            ]
          : []),
        {
          id: 'mipmaps',
          name: 'Mipmaps',
          defaultValue: params.mipmaps,
          onChange: (value) => {
            params.mipmaps = value;

            applyParams();
          },
        },
        {
          id: 'shadowResolution',
          name: 'Shadow Grid',
          defaultValue: OpenVDB.frameRenderer.settings.shadowResolution,
          min: 16,
          max: 160,
          onChange: setFrameSetting('shadowResolution'),
        },
        {
          id: 'jitter',
          name: 'Jitter',
          defaultValue: OpenVDB.frameRenderer.settings.jitter,
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.jitter = value;
          },
        },
        {
          id: 'temporal',
          name: 'Temporal',
          defaultValue: OpenVDB.frameRenderer.settings.temporal,
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.temporal = value;
          },
        },
        {
          id: 'temporalBlend',
          name: 'Temporal Blend',
          defaultValue: OpenVDB.frameRenderer.settings.temporalBlend,
          min: 0.01,
          max: 1.0,
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.temporalBlend = value;
          },
        },
        {
          id: 'shadowCascades',
          name: 'Shadow Cascades',
          defaultValue: OpenVDB.frameRenderer.settings.shadowCascades,
          min: 1,
          max: 4,
          onChange: setFrameSetting('shadowCascades'),
        },
        {
          id: 'froxelSubSteps',
          name: 'Sub-steps',
          defaultValue: OpenVDB.frameRenderer.settings.subSteps,
          min: 1,
          max: 32,
          onChange: setFrameSetting('subSteps'),
        },
      ],
    },
    {
      folder: 'Light Emission',
      closed: true,
      children: [...emission.lightFields, emission.meshesField],
    },
    {
      folder: 'Volume',
      children: [
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
        {
          id: 'shadowSteps',
          name: 'Shadow Steps',
          defaultValue: params.shadowSteps,
          min: 0,
          max: 128,
          onChange: (value) => setParam('shadowSteps')(Math.round(value)),
        },
      ],
    },
  ]);
};

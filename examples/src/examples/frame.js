import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { setGuiFields } from '../utils/gui';
import { loadAndCacheVDB, loaders } from '../utils/resources';

// NOTE A/B comparison: the same source as FrameVolume (froxel frame) or FogVolume (per-object march)
// NOTE One cloud is converted one time. All cloud field volumes use its raw density data.
const cloudFieldResolution = 64;
let cloudFieldData = null;

const getCloudFieldData = () => {
  if (cloudFieldData) {
    return Promise.resolve(cloudFieldData);
  }

  return new Promise((resolve) => {
    const source = new OpenVDB.CloudVolume({ height: 0.8, density: 0.3 });
    const converter = new OpenVDB.FrameVolume(source, { resolution: cloudFieldResolution }, () => {
      const data = converter.volumes[0].densityMap3D.image.data;
      const resolution = cloudFieldResolution;

      // NOTE Fade the density to zero at the box sides. Then the box edges are not visible.
      for (let z = 0; z < resolution; z++) {
        for (let y = 0; y < resolution; y++) {
          for (let x = 0; x < resolution; x++) {
            const distance =
              Math.hypot(
                (x + 0.5) / resolution - 0.5,
                (y + 0.5) / resolution - 0.5,
                (z + 0.5) / resolution - 0.5,
              ) * 2.0;
            const fade = Math.min(1.0, Math.max(0.0, (1.0 - distance) / 0.4));

            data[x + y * resolution + z * resolution * resolution] *= fade;
          }
        }
      }

      cloudFieldData = data;
      converter.dispose();

      resolve(data);
    });
  });
};

// NOTE Fixed random sequence. The cloud field is the same after each rebuild.
const createRandom = (seed) => () => {
  seed = (seed * 16807) % 2147483647;

  return (seed - 1) / 2147483646;
};

export const exampleFrame = ({ scene }) => {
  const params = {
    renderer: 'frame',
    source: 'bunny',
    baseColor: '#ffffff',
    absorbance: 1.0,
    densityScale: 1.0,
    opacity: 1.0,
    extinction: 100.0,
    shadowSteps: 32,
    rotate: true,
    lighting: 'frame',
    fieldVolumes: 24,
    animateLights: true,
  };

  let entries = [];
  let buildId = 0;
  let rotation = null;

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

  const applyVolumeParams = (volume) => {
    if (volume.isFrameVolume) {
      volume.baseColor.set(params.baseColor);
      volume.absorbance = params.absorbance;
      volume.densityScale = params.densityScale;
      volume.opacity = params.opacity;
      volume.extinction = params.extinction;
      volume.shadowSteps = params.shadowSteps;
    } else {
      volume.materials.forEach((material) => {
        material.baseColor = params.baseColor;
        material.absorbance = params.absorbance;
        material.densityScale = params.densityScale;
        material.opacity = params.opacity;
      });
    }
  };

  const applyParams = () => {
    entries.forEach(({ volume }) => applyVolumeParams(volume));
  };

  const removeVolumes = () => {
    if (rotation) {
      clearInterval(rotation);
      rotation = null;
    }

    entries.forEach(({ pivot, volume }) => {
      scene.remove(pivot);

      if (!volume.isFrameVolume) {
        volume.materials.forEach((material) => material.densityMap3D?.dispose());
      }

      volume.dispose();
    });

    entries = [];
  };

  const createVolume = (source, props) => {
    if (params.renderer === 'frame') {
      return new OpenVDB.FrameVolume(source, {
        ...props,
        lights: props.frameLights,
      });
    }

    return new OpenVDB.FogVolume(source, props);
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

    if (params.source === 'cloudField') {
      getCloudFieldData().then((data) => {
        if (currentBuildId !== buildId) {
          return;
        }

        const random = createRandom(7);

        for (let i = 0; i < params.fieldVolumes; i++) {
          const volume = createVolume(data, {
            resolution: cloudFieldResolution,
            steps: 100,
            frameLights:
              OpenVDB.frameLights.useEnvironment | OpenVDB.frameLights.useDirectionalLights,
          });

          volume.scale.set(
            80.0 + random() * 120.0,
            40.0 + random() * 40.0,
            80.0 + random() * 120.0,
          );

          const pivot = addVolume(volume, new Three.Vector3());
          pivot.position.set(
            (random() - 0.5) * 500.0,
            60.0 + random() * 60.0,
            (random() - 0.5) * 500.0,
          );
          pivot.rotation.y = random() * Math.PI * 2.0;
        }
      });

      return;
    }

    if (params.source === 'clouds') {
      const volume = createVolume(new OpenVDB.CloudVolume({ height: 0.2, density: 0.3 }), {
        resolution: 100,
        progressive: true,
        steps: 100,
        wrap3D: Three.MirroredRepeatWrapping,
        lights: OpenVDB.lights.useEnvironment | OpenVDB.lights.useDirectionalLights,
        frameLights: OpenVDB.frameLights.useEnvironment | OpenVDB.frameLights.useDirectionalLights,
      });
      volume.scale.setScalar(400.0);

      addVolume(volume, new Three.Vector3()).position.y = 100.0;

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

      const createBunny = () =>
        createVolume(vdb, { resolution: 300, progressive: true, steps: 1000 });

      // NOTE Center the first bunny at the scene origin
      const firstPivot = addVolume(createBunny(), center);
      firstPivot.position.set(0.0, 0.0, 0.0);

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
            loaders.rgbe.load(`./assets/${value}-HDR.hdr`, (env) => {
              env.mapping = Three.EquirectangularReflectionMapping;
              scene.environment = env;
            });

            loaders.texture.load(`./assets/${value}-8K.jpg`, (env) => {
              env.mapping = Three.EquirectangularRefractionMapping;
              env.colorSpace = Three.SRGBColorSpace;
              scene.background = env;
            });
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
            coloredLights.forEach((light) => {
              light.intensity = value;
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
      children: [
        {
          id: 'renderer',
          name: 'Renderer',
          defaultValue: params.renderer,
          options: {
            'Frame (FrameVolume)': 'frame',
            'Per-object (FogVolume)': 'fog',
          },
          onChange: (value) => {
            params.renderer = value;

            rebuild();
          },
        },
        {
          id: 'source',
          name: 'Source',
          defaultValue: params.source,
          options: {
            'Bunny Cloud': 'bunny',
            'Two Bunnies': 'twoBunnies',
            Clouds: 'clouds',
            'Cloud Field': 'cloudField',
          },
          onChange: (value) => {
            params.source = value;

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
          name: 'Froxels X (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.width,
          min: 4,
          max: 1280,
          onChange: setFrameSetting('width'),
        },
        {
          id: 'froxelHeight',
          name: 'Froxels Y (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.height,
          min: 4,
          max: 760,
          onChange: setFrameSetting('height'),
        },
        {
          id: 'froxelDepth',
          name: 'Slices (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.depth,
          min: 8,
          max: 512,
          onChange: setFrameSetting('depth'),
        },
        {
          id: 'fieldVolumes',
          name: 'Cloud Field Volumes',
          defaultValue: params.fieldVolumes,
          min: 1,
          max: 120,
          onChange: (value) => {
            params.fieldVolumes = Math.round(value);

            if (params.source === 'cloudField') {
              rebuild();
            }
          },
        },
        {
          id: 'lighting',
          name: 'Lighting (frame)',
          defaultValue: params.lighting,
          options: {
            'Combined (shared shadows)': 'frame',
            'Per-volume': 'volume',
          },
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.lighting = value;
          },
        },
        {
          id: 'shadowResolution',
          name: 'Shadow Grid (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.shadowResolution,
          min: 16,
          max: 160,
          onChange: setFrameSetting('shadowResolution'),
        },
        {
          id: 'jitter',
          name: 'Jitter (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.jitter,
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.jitter = value;
          },
        },
        {
          id: 'temporal',
          name: 'Temporal (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.temporal,
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.temporal = value;
          },
        },
        {
          id: 'temporalBlend',
          name: 'Temporal Blend (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.temporalBlend,
          min: 0.01,
          max: 1.0,
          onChange: (value) => {
            OpenVDB.frameRenderer.settings.temporalBlend = value;
          },
        },
        {
          id: 'shadowCascades',
          name: 'Shadow Cascades (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.shadowCascades,
          min: 1,
          max: 4,
          onChange: setFrameSetting('shadowCascades'),
        },
        {
          id: 'froxelSubSteps',
          name: 'Sub-steps (frame)',
          defaultValue: OpenVDB.frameRenderer.settings.subSteps,
          min: 1,
          max: 32,
          onChange: setFrameSetting('subSteps'),
        },
      ],
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
          name: 'Extinction (frame)',
          defaultValue: params.extinction,
          min: 1.0,
          max: 1000.0,
          onChange: setParam('extinction'),
        },
        {
          id: 'shadowSteps',
          name: 'Shadow Steps (frame)',
          defaultValue: params.shadowSteps,
          min: 0,
          max: 128,
          onChange: (value) => setParam('shadowSteps')(Math.round(value)),
        },
      ],
    },
  ]);
};

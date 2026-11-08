import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { setGuiFields, setDemoCleanup, activeDemo } from '../utils/gui';
import { setLoading } from '../utils/loading';
import { camera, controls } from '../main';
import {
  firstEnvironment,
  groundLevel,
  setEnvironmentLights,
  setEnvironmentShadowRadius,
  defaultEnvironmentShadowRadius,
  setEnvironmentShadowSamples,
  defaultEnvironmentShadowSamples,
} from '../utils/resources';
import { placeClouds } from '../utils/cloudField';

// NOTE Cloud Pack by JangaFX (README.md). Z-up files.
const cloudFiles = Array.from(
  { length: 10 },
  (_, index) => `./assets/CloudPackVDB_wvdb/cloud_${String(index + 1).padStart(2, '0')}_variant_0000.wvdb`,
);

// NOTE All pack files have the same box: 349 x 530 x 178 units (Z-up). This is its size with Y up.
const cloudSize = [349.0, 178.0, 530.0];

const cloudCount = 128;
// NOTE Large clouds in a small field give a dense sky. Altitude is the lowest cloud center.
const fieldSize = 6000.0;
const cloudScale = [2.0, 2.8];
const cloudAltitude = groundLevel + 1100.0;
const altitudeRange = 800.0;
const maxOverlap = 0.5;

// NOTE Clouds move on +X and loop back at the field edge. They fade near the edges, so the jump is not seen.
const windSpeed = 20.0;
const fadeLength = fieldSize * 0.15;

// NOTE Flat ground of the grassland skybox (radius 2500, height 250, utils/resources.js)
const groundRadius = 2400.0;

// NOTE The environment light shadow camera holds the clouds above the ground. Volumes out of it cast no shadow.
const shadowRadius = 4000.0;

const maxExtinction = 1000.0;

// NOTE Frame renderer settings of this demo. The cleanup sets the old values again.
// NOTE The clouds move, so the shadow grid passes run in each frame. Their cost is the grid voxels times the voxel march.
const frameSettings = {
  castShadows: false,
  shadowResolution: 48,
  environmentSamples: 8,
  width: 324,
  height: 324,
  depth: 48,
};

// NOTE The camera is on the ground and looks up. The target is near, so a drag turns the view.
// With a 60 degree view, a 25 degree pitch keeps a band of ground with the cloud shadows at the bottom.
const cameraHeight = 2.0;
const cameraPitch = Three.MathUtils.degToRad(25.0);

export const exampleSky = ({ scene }) => {
  const savedSettings = Object.fromEntries(
    Object.keys(frameSettings).map((key) => [key, OpenVDB.frameRenderer.settings[key]]),
  );
  const savedCamera = {
    position: camera.position.clone(),
    target: controls.target.clone(),
    enableZoom: controls.enableZoom,
    enablePan: controls.enablePan,
  };

  const { clouds } = placeClouds({
    count: cloudCount,
    types: cloudFiles.length,
    size: cloudSize,
    fieldSize,
    altitude: cloudAltitude,
    altitudeRange,
    scaleRange: cloudScale,
    maxOverlap,
    noiseCells: 4,
    seed: 152,
  });

  const cloudGroup = new Three.Group();
  scene.add(cloudGroup);

  // NOTE The ground shows only shadows. Elsewhere it is transparent, so the environment ground shows.
  const ground = new Three.Mesh(new Three.CircleGeometry(groundRadius, 96), new Three.ShadowMaterial({ opacity: 0.5 }));
  ground.rotation.x = -Math.PI / 2.0;
  ground.position.y = groundLevel;
  ground.receiveShadow = true;
  ground.visible = frameSettings.castShadows;
  scene.add(ground);

  // NOTE One slot for each cloud. The slot moves with the wind. Its up group turns the Z-up volume.
  const slots = clouds.map((cloud) => {
    const slot = new Three.Group();
    const up = new Three.Group();

    slot.position.set(cloud.x, cloud.y, cloud.z);
    slot.rotation.y = (cloud.turns * Math.PI) / 2.0;
    slot.scale.setScalar(cloud.scale);
    up.rotation.x = -Math.PI / 2.0;
    slot.add(up);
    cloudGroup.add(slot);

    return { slot, up, type: cloud.type, volume: null };
  });

  // NOTE Weather from 0 (clear) to 1 (overcast) sets the extinction of all clouds, from 0 to maxExtinction
  const params = { weather: 0.1 };

  const applyVolumeParams = (volume) => {
    volume.extinction = params.weather * maxExtinction;
  };

  const sources = [];
  const streams = [];
  let active = true;
  let loadsLeft = cloudFiles.length;

  const onLoadDone = () => {
    loadsLeft--;

    if (loadsLeft === 0) {
      setLoading('sky', false);
    }
  };

  // NOTE One source volume for each file. The other clouds of the file are instances of it.
  const loadClouds = () => {
    cloudFiles.forEach((file, type) => {
      const volumeData = new OpenVDB.WVDBLoader().load(
        file,
        (data) => {
          if (!active) {
            return;
          }

          const grid = data.grids.density || Object.values(data.grids)[0];
          const center = grid.bbox.getCenter(new Three.Vector3()).negate();
          const source = data.attach(
            new OpenVDB.FrameVolume(grid.data, { dimensions: grid.dimensions, bbox: grid.bbox }),
          );

          sources.push(source);

          slots
            .filter((each) => each.type === type)
            .forEach((each, index) => {
              each.volume = index === 0 ? source : source.createInstance();
              each.volume.position.copy(center);
              applyVolumeParams(each.volume);
              each.up.add(each.volume);
            });

          onLoadDone();
        },
        undefined,
        (error) => {
          console.error('WVDBLoader', { file, error });
          onLoadDone();
        },
      );

      streams.push(volumeData);
    });
  };

  let lastTime = performance.now();
  let frame = 0;

  const updateClouds = () => {
    const now = performance.now();
    // NOTE A hidden tab stops the frames. The clouds do not jump when it shows again.
    const delta = Math.min((now - lastTime) / 1000.0, 0.1);
    const halfField = fieldSize / 2.0;

    lastTime = now;

    slots.forEach(({ slot, volume }) => {
      slot.position.x += windSpeed * delta;

      if (slot.position.x > halfField) {
        slot.position.x -= fieldSize;
      }

      if (volume) {
        volume.opacity = Math.min(
          Three.MathUtils.smoothstep(slot.position.x, -halfField, -halfField + fadeLength),
          Three.MathUtils.smoothstep(-slot.position.x, -halfField, -halfField + fadeLength),
        );
      }
    });

    frame = requestAnimationFrame(updateClouds);
  };

  const cleanup = () => {
    active = false;
    cancelAnimationFrame(frame);

    slots.forEach(({ volume }) => {
      if (volume && !sources.includes(volume)) {
        volume.dispose();
      }
    });
    sources.forEach((source) => source.dispose());
    streams.forEach((volumeData) => volumeData.dispose());

    Object.assign(OpenVDB.frameRenderer.settings, savedSettings);
    setEnvironmentShadowRadius(defaultEnvironmentShadowRadius);
    setEnvironmentShadowSamples(defaultEnvironmentShadowSamples);
    setLoading('sky', false);

    camera.position.copy(savedCamera.position);
    controls.target.copy(savedCamera.target);
    controls.enableZoom = savedCamera.enableZoom;
    controls.enablePan = savedCamera.enablePan;
    controls.update();
  };

  setDemoCleanup(cleanup);

  Object.assign(OpenVDB.frameRenderer.settings, frameSettings);
  setEnvironmentShadowRadius(shadowRadius);
  setEnvironmentShadowSamples(1);
  setEnvironmentLights(scene, true);

  camera.position.set(0.0, groundLevel + cameraHeight, 0.0);
  controls.target.set(0.0, Math.sin(cameraPitch), -Math.cos(cameraPitch)).add(camera.position);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.update();

  setGuiFields([
    {
      folder: 'General',
      children: [
        {
          id: 'weather',
          name: 'Weather',
          defaultValue: params.weather,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            params.weather = value;

            slots.forEach(({ volume }) => volume && applyVolumeParams(volume));
          },
        },
      ],
    },
  ]);

  setLoading('sky', true);
  frame = requestAnimationFrame(updateClouds);

  firstEnvironment.then(() => {
    // NOTE The user can change the demo before the first environment is set
    if (!active || activeDemo !== 'sky') {
      return;
    }

    loadClouds();
  });
};

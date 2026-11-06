import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import * as OpenVDB from 'three-openvdb';
import { EnvironmentLightExtractor, EnvironmentShadowLights } from 'three-environment-shadows';
import { isPhone, isIPhone } from './device';
import { furnaceEnvironment, setFurnaceActive, createFurnaceMap } from './furnace';
import { camera, controls } from '../main';

export const vdbList = {};

export const loadAndCacheVDB = async (name, file) => {
  if (!vdbList[file]) {
    const vdb = await new Promise(resolve => {
      new OpenVDB.VDBLoader().load(file, (vdb) => {
        resolve(vdb);  
      }, null, () => {
        alert('Could not load the VDB file.');
        console.error('Could not load the VDB file.', { name, file });
      });
    });

    vdbList[file] = {
      name,
      vdb
    };
  }

  return vdbList[file].vdb;
};

export const loaders = {
  texture: new Three.TextureLoader(),
  ultraHdr: new UltraHDRLoader(),
  gltf: new GLTFLoader()
};

// NOTE 8K backgrounds crash iOS Safari. Phones get 4K backgrounds.
const backgroundSize = isPhone ? '4K' : '8K';

// NOTE 4K UltraHDR files crash iPhones. iPhones get the 1K files, as background and environment.
const ultraHdrSuffix = isIPhone ? '-1K' : '';

// NOTE These environments have no JPEG background. The UltraHDR file is also the background.
const ultraHdrBackgrounds = [
  'desert',
  'grassland',
  'shore',
  'townsquare',
  'sky-cloudy',
  'sky-dusk',
  'sky-midday',
  'sky-night',
];

// NOTE The UltraHDR files are brighter than the JPEG backgrounds
const ultraHdrIntensity = 0.4;

// NOTE These environments have ground in the lower half. It shows as a flat ground. Values are in scene units.
// height is the camera height of the photo. A larger height makes the ground larger, with less pinch at its center.
// A larger height to radius ratio makes a softer blend from the ground to the sky.
const groundedEnvironments = {
  desert: { height: 50.0, radius: 500.0 },
  grassland: { height: 250.0, radius: 2500.0 },
  shore: { height: 250.0, radius: 2500.0 },
  townsquare: { height: 160.0, radius: 1600.0 },
};
// NOTE The bottom of a volume with a longest side of 100 units, at the origin
export const groundLevel = -50.0;

// NOTE One skybox for each environment, made one time
const groundedSkyboxes = {};
let shownSkybox = null;
// NOTE Only the last environment load changes the scene
let environmentLoadId = 0;

// NOTE Resolves when the first environment is set. The first example loads its volume after this.
let resolveFirstEnvironment;
export const firstEnvironment = new Promise((resolve) => {
  resolveFirstEnvironment = resolve;
});

// NOTE Two animation frames make sure that the renderer rendered one frame between the steps
const nextRenderedFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// NOTE The "high" quality of the three-environment-shadows examples. Phones: fewer and smaller shadow maps.
const environmentLightQuality = {
  maxLights: 2,
  samples: 4,
  maxShadowMaps: isPhone ? 2 : 8,
  mapSize: isPhone ? 512 : 1024,
};

// NOTE The "Environment" light setup: the lights found in the environment map, with shadows.
// The bounds hold a volume with a longest side of 100 units, and the mesh of the Mesh Volume demo.
const environmentLights = new EnvironmentShadowLights([], {
  samples: environmentLightQuality.samples,
  maxShadowMaps: environmentLightQuality.maxShadowMaps,
  mapSize: environmentLightQuality.mapSize,
});
environmentLights.bounds.radius = 600.0;

// NOTE "Environment" lights use the map without the found lights. Then the scene does not get the same light two times.
let environmentMaps = null;
let useEnvironmentLights = false;

const applyEnvironmentMap = (scene) => {
  if (environmentMaps) {
    scene.environment = useEnvironmentLights ? environmentMaps.withoutLights : environmentMaps.full;
  }
};

export const setEnvironmentLights = (scene, enabled) => {
  useEnvironmentLights = enabled;

  if (enabled) {
    scene.add(environmentLights);
  } else {
    scene.remove(environmentLights);
  }

  applyEnvironmentMap(scene);
};

// NOTE Near the nadir the skybox UVs change fast, so mipmaps blur the ground center into a pinch.
// The skybox map is a copy of the environment, without mipmaps. The copy uses the same image data.
const createSkyboxMap = (env) => {
  const map = env.clone();

  map.minFilter = Three.LinearFilter;
  map.generateMipmaps = false;
  map.needsUpdate = true;

  return map;
};

const showGroundedSkybox = (scene, name, env) => {
  const map = createSkyboxMap(env);

  if (groundedSkyboxes[name]) {
    groundedSkyboxes[name].material.map.dispose();
    groundedSkyboxes[name].material.map = map;
    groundedSkyboxes[name].material.needsUpdate = true;
  } else {
    const { height, radius } = groundedEnvironments[name];
    const skybox = new GroundedSkybox(map, height, radius);

    skybox.material.color.setScalar(ultraHdrIntensity);
    skybox.position.y = groundLevel + height;
    groundedSkyboxes[name] = skybox;
  }

  hideGroundedSkybox(scene);

  shownSkybox = groundedSkyboxes[name];
  scene.add(shownSkybox);
  setCameraBounds({ center: shownSkybox.position, radius: groundedEnvironments[name].radius });
};

const hideGroundedSkybox = (scene) => {
  if (shownSkybox) {
    scene.remove(shownSkybox);
    shownSkybox = null;
  }

  setCameraBounds(null);
};

// NOTE A grounded skybox is a sphere with a flat ground at groundLevel. The camera stays in the sphere and above the ground.
// The camera stays 1 unit (1% of a volume) above the ground. On the ground, the ground plane is seen edge-on.
const cameraFloor = groundLevel + 1.0;
let cameraBounds = null;
let cameraLimitsAdded = false;
const cameraOffset = new Three.Vector3();

const limitCamera = () => {
  if (!controls) {
    return;
  }

  if (!cameraBounds) {
    controls.maxDistance = Infinity;
    controls.maxPolarAngle = Math.PI;
    return;
  }

  const { center, radius } = cameraBounds;
  const { target } = controls;

  // NOTE Panning can move the target. It stays above the ground and in the sphere.
  target.y = Math.max(target.y, cameraFloor);

  if (target.distanceTo(center) > radius) {
    target.sub(center).setLength(radius).add(center);
  }

  controls.maxDistance = radius - target.distanceTo(center);
  cameraOffset.subVectors(camera.position, target);

  const distance = Math.min(cameraOffset.length(), controls.maxDistance);
  const floorHeight = cameraFloor - target.y;

  // NOTE OrbitControls limits the polar angle. At this distance, a larger angle puts the camera under the ground.
  controls.maxPolarAngle = Math.acos(Three.MathUtils.clamp(floorHeight / Math.max(distance, 1e-6), -1.0, 1.0));

  // NOTE A zoom out at a low angle, or a new environment, can still put the camera out of the bounds
  if (cameraOffset.length() > distance || camera.position.y < cameraFloor) {
    cameraOffset.setLength(distance);

    if (cameraOffset.y < floorHeight) {
      const horizontal = Math.hypot(cameraOffset.x, cameraOffset.z);
      const horizontalLength = Math.sqrt(Math.max(0.0, distance * distance - floorHeight * floorHeight));

      if (horizontal > 0.0) {
        cameraOffset.x *= horizontalLength / horizontal;
        cameraOffset.z *= horizontalLength / horizontal;
      }

      cameraOffset.y = floorHeight;
    }

    camera.position.copy(target).add(cameraOffset);
    camera.lookAt(target);
  }
};

const setCameraBounds = (bounds) => {
  cameraBounds = bounds;

  if (controls && !cameraLimitsAdded) {
    controls.addEventListener('change', limitCamera);
    cameraLimitsAdded = true;
  }

  limitCamera();
};

export const loadEnvironment = (scene, name) => {
  const loadId = ++environmentLoadId;
  // NOTE The furnace map (utils/furnace.js) is its own background, with intensity 1
  const isFurnace = name === furnaceEnvironment;
  const intensity = isFurnace ? 1.0 : ultraHdrIntensity;
  const useUltraHdrBackground = isFurnace || ultraHdrBackgrounds.includes(name);

  setFurnaceActive(isFurnace);

  // NOTE The current environment stays until the new one loads
  const onEnvironment = async (env) => {
    if (loadId !== environmentLoadId) {
      return;
    }

    env.mapping = Three.EquirectangularReflectionMapping;

    if (useUltraHdrBackground) {
      scene.background = env;
      scene.backgroundIntensity = intensity;
    }

    if (groundedEnvironments[name]) {
      showGroundedSkybox(scene, name, env);
    } else {
      hideGroundedSkybox(scene);
    }

    // NOTE Phones crash when the background, the environment and the volume load in the same frame. They load one after the other.
    await nextRenderedFrame();

    if (loadId !== environmentLoadId) {
      return;
    }

    let extraction = null;

    try {
      extraction = await EnvironmentLightExtractor.extract(env, {
        maxLights: environmentLightQuality.maxLights,
        samples: environmentLightQuality.samples,
      });
    } catch (error) {
      console.error('Could not find the environment lights.', { name, error });
    }

    if (loadId !== environmentLoadId) {
      extraction?.texture?.dispose();
      return;
    }

    const previousMaps = environmentMaps;

    environmentMaps = { full: env, withoutLights: extraction?.texture ?? env };
    environmentLights.setLights(extraction?.lights ?? []);
    applyEnvironmentMap(scene);
    scene.environmentIntensity = intensity;

    if (previousMaps && previousMaps.withoutLights !== previousMaps.full) {
      previousMaps.withoutLights.dispose();
    }

    await nextRenderedFrame();
    resolveFirstEnvironment();
  };

  if (isFurnace) {
    onEnvironment(createFurnaceMap());
  } else {
    loaders.ultraHdr.load(`./assets/${name}-HDR${ultraHdrSuffix}.jpg`, onEnvironment, undefined, (error) => {
      console.error('Could not load the environment.', { name, error });
      resolveFirstEnvironment();
    });
  }

  if (!useUltraHdrBackground) {
    loaders.texture.load(`./assets/${name}-${backgroundSize}.jpg`, (background) => {
      if (loadId !== environmentLoadId) {
        return;
      }

      background.mapping = Three.EquirectangularRefractionMapping;
      background.colorSpace = Three.SRGBColorSpace;
      scene.background = background;
      scene.backgroundIntensity = 1.0;
    });
  }
};

import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import * as OpenVDB from 'three-openvdb';
import { isPhone } from './device';

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
};

const hideGroundedSkybox = (scene) => {
  if (shownSkybox) {
    scene.remove(shownSkybox);
    shownSkybox = null;
  }
};

export const loadEnvironment = (scene, name) => {
  const loadId = ++environmentLoadId;
  const useUltraHdrBackground = ultraHdrBackgrounds.includes(name);

  // NOTE The current environment stays until the new one loads
  loaders.ultraHdr.load(`./assets/${name}-HDR.jpg`, (env) => {
    if (loadId !== environmentLoadId) {
      return;
    }

    env.mapping = Three.EquirectangularReflectionMapping;
    scene.environment = env;
    scene.environmentIntensity = ultraHdrIntensity;

    if (useUltraHdrBackground) {
      scene.background = env;
      scene.backgroundIntensity = ultraHdrIntensity;
    }

    if (groundedEnvironments[name]) {
      showGroundedSkybox(scene, name, env);
    } else {
      hideGroundedSkybox(scene);
    }
  });

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

import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
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
const ultraHdrBackgrounds = ['night'];

// NOTE The UltraHDR files are brighter than the JPEG backgrounds
const ultraHdrIntensity = 0.4;

export const loadEnvironment = (scene, name) => {
  const useUltraHdrBackground = ultraHdrBackgrounds.includes(name);

  loaders.ultraHdr.load(`./assets/${name}-HDR.jpg`, (env) => {
    env.mapping = Three.EquirectangularReflectionMapping;
    scene.environment = env;
    scene.environmentIntensity = ultraHdrIntensity;

    if (useUltraHdrBackground) {
      scene.background = env;
      scene.backgroundIntensity = ultraHdrIntensity;
    }
  });

  if (!useUltraHdrBackground) {
    loaders.texture.load(`./assets/${name}-${backgroundSize}.jpg`, (background) => {
      background.mapping = Three.EquirectangularRefractionMapping;
      background.colorSpace = Three.SRGBColorSpace;
      scene.background = background;
      scene.backgroundIntensity = 1.0;
    });
  }
};

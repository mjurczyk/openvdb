import * as Three from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js'
import { exampleVDB } from './examples/vdb';
import { frameRenderer } from 'three-openvdb';
import packageInfo from '../../../three-openvdb/package.json';
import { setActiveDemo } from './utils/gui';
import { exampleWVDB } from './examples/wvdb';
import { readFurnace } from './utils/furnace';
import { isPhone } from './utils/device';
import { updateShadowMaps } from './utils/shadowMaps';
import { updateTransformMode } from './utils/transform';

export const camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000.0);
export const scene = new Three.Scene();
// NOTE npm run dev:webgl uses WebGLRenderer and three-openvdb/webgl. ?webgl uses the WebGL2 fallback of WebGPURenderer.
// NOTE No MSAA on phones. The volume pass copies the scene color and depth in each frame, and MSAA makes this 4 times larger.
const antialias = !isPhone;

// NOTE Phones: at most one froxel for each 2 x 2 CSS pixels. A phone canvas is small, and each pass costs per froxel.
frameRenderer.settings.pixelsPerFroxel = isPhone ? 2 : 0;

export const renderer =
  import.meta.env.VITE_FRAME_RENDERER === 'webgl'
    ? new Three.WebGLRenderer({ antialias })
    : new WebGPURenderer({
        antialias,
        forceWebGL: new URLSearchParams(window.location.search).has('webgl'),
      });

document.querySelector('.package-version').innerHTML = `v${packageInfo.version}`;

const stats = new Stats();
document.body.appendChild(stats.dom);

// NOTE Made in init. Grounded environments limit it (utils/resources.js).
export let controls = null;

const init = () => {
  // NOTE 39 units above the ground of the environments (y = -50)
  camera.position.set(-100.0, -11.0, 80.0);

  scene.background = new Three.Color(0x598eff);

  renderer.outputColorSpace = Three.SRGBColorSpace
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  controls = new OrbitControls(camera, renderer.domElement);
  // NOTE Without damping the camera moves on each pointer event, and on a high refresh display some frames get two
  // events and some none: the background steps. With damping the motion is spread over the frames by controls.update().
  controls.enableDamping = true;
  controls.dampingFactor = 0.15;
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth) / (window.innerHeight);
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

const animate = () => {
  stats.begin();

  // NOTE Transform mode turns off the orbit controls and moves the camera (utils/transform.js)
  if (controls.enabled) {
    controls.update();
  }

  updateTransformMode();
  updateShadowMaps(scene);
  renderer.render(scene, camera);
  readFurnace(renderer);

  stats.end();
};

setActiveDemo('wvdb');

init();
renderer.setAnimationLoop(animate);
exampleWVDB({ scene });

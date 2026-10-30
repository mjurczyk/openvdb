import * as Three from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js'
import { exampleVDB } from './examples/vdb';
import packageInfo from '../../../three-openvdb/package.json';
import { setActiveDemo } from './utils/gui';
import { exampleWVDB } from './examples/wvdb';

export const camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000.0);
export const scene = new Three.Scene();
// NOTE npm run dev:webgl uses WebGLRenderer and three-openvdb/webgl. ?webgl uses the WebGL2 fallback of WebGPURenderer.
export const renderer =
  import.meta.env.VITE_FRAME_RENDERER === 'webgl'
    ? new Three.WebGLRenderer({ antialias: true })
    : new WebGPURenderer({
        antialias: true,
        forceWebGL: new URLSearchParams(window.location.search).has('webgl'),
      });

document.querySelector('.package-version').innerHTML = `v${packageInfo.version}`;

const stats = new Stats();
document.body.appendChild(stats.dom);

const init = () => {
  camera.position.set(-100.0, 80.0, 80.0);

  scene.background = new Three.Color(0x598eff);

  renderer.outputColorSpace = Three.SRGBColorSpace
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  new OrbitControls(camera, renderer.domElement);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth) / (window.innerHeight);
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

const animate = () => {
  stats.begin();
  
  renderer.render(scene, camera); 

  stats.end();
};

setActiveDemo('wvdb');

init();
renderer.setAnimationLoop(animate);
exampleWVDB({ scene });

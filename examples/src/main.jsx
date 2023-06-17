import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js'
import { exampleVDB } from './examples/vdb';
import packageInfo from '../../package.json';
import { setActiveDemo } from './utils/gui';
import { exampleGLTF } from './examples/gltf';
import { exampleBunny } from './examples/bunny';
import { exampleClouds } from './examples/clouds';

export const camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000.0);
export const scene = new Three.Scene();
export const renderer = new Three.WebGLRenderer({ antialias: true });

document.querySelector('.package-version').innerHTML = `v${packageInfo.version}`;

const stats = new Stats();
document.body.appendChild(stats.dom);

const init = () => {
  camera.position.set(-100.0, 80.0, 80.0);

  scene.background = new Three.Color(0x598eff);

  renderer.outputEncoding = Three.sRGBEncoding;
  // renderer.useLegacyLights = false;
  renderer.physicallyCorrectLights = true;
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
  requestAnimationFrame(animate);

  stats.begin();
  
  renderer.render(scene, camera); 

  stats.end();
};

setActiveDemo('clouds');

init();
animate();
exampleClouds({ scene });

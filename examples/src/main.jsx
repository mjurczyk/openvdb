import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { exampleClouds } from './examples/clouds';
import { showGui } from './utils/gui';
import Stats from 'stats.js'

import { loaders } from './utils/resources';

export const camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000.0);
export const scene = new Three.Scene();
export const renderer = new Three.WebGLRenderer({ antialias: true });

const stats = new Stats();
document.body.appendChild(stats.dom);

const init = () => {
  camera.position.set(-100.0, 80.0, 80.0);

  scene.background = new Three.Color(0x598eff);

  loaders.rgbe.load('./assets/blue-sky-2-HDR.hdr', hdri => {
    hdri.mapping = Three.EquirectangularReflectionMapping;

    scene.environment = hdri;
  });

  loaders.texture.load('./assets/blue-sky-2-SD.jpg', texture => {
    texture.encoding = Three.sRGBEncoding;
    texture.mapping = Three.EquirectangularRefractionMapping;

    scene.background = texture;
  });

  renderer.outputEncoding = Three.sRGBEncoding;
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

init();
animate();
exampleClouds({ scene });

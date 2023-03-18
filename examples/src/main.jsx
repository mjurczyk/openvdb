import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './utils/gui';

import { exampleBbox } from './examples/bbox';
import { exampleSpotlights } from './examples/spotlights';

let camera, scene, renderer;

const init = () => {
  camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000.0);
  camera.position.set(-100.0, 80.0, 80.0);

  scene = new Three.Scene();
  scene.background = new Three.Color(0x598eff);

  renderer = new Three.WebGLRenderer({ antialias: true });
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

  renderer.render(scene, camera); 
};

init();
// exampleBbox({ scene });
exampleSpotlights({ scene });
animate();

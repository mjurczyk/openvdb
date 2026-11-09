import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';
import { EnvironmentShadows } from 'three-environment-shadows/webgpu';
import { FrameEmissionLight, WVDBAnimationLoader, frameRenderer } from 'three-openvdb';

const LANTERN_HEIGHT = 10;
const SMOKE_FRAMES = 100;
// NOTE Seconds for one env intensity loop, 0 -> 1 -> 0.
const ENV_CYCLE = 20;
// NOTE Same as the temperature preset of the docs example (Kelvin max of its sample).
const TEMPERATURE_SCALE = 5052;

frameRenderer.settings.spectral = true;

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#15171c');

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// NOTE 3/4 view: 45 degrees around the lantern, at about the height of the light box.
camera.position.set(-LANTERN_HEIGHT * 1.365, LANTERN_HEIGHT * 0.6325, LANTERN_HEIGHT * 1.365);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.target.set(0, LANTERN_HEIGHT * 0.6, 0);

// NOTE Lights the volume and the lantern. The volume renderer reads scene.environment.
const environmentReady = new UltraHDRLoader().loadAsync('./env.jpg').then((texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

// NOTE Regular (SD) panorama, only for the background.
new THREE.TextureLoader().load('./bg.jpg', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  scene.background = texture;
  scene.backgroundBlurriness = 0.7;
  scene.backgroundIntensity = 0.1;
});

// NOTE Emission from the smoke temperature grid. The only light object in the scene.
const emissionLight = new FrameEmissionLight();
emissionLight.intensity = 3000;
scene.add(emissionLight);

const lantern = new THREE.Group();
scene.add(lantern);

// NOTE EnvironmentShadows (WebGPU) skips materials that are not node materials.
const STANDARD_PROPERTIES = [
  'name', 'color', 'map', 'roughness', 'roughnessMap', 'metalness', 'metalnessMap', 'normalMap', 'normalMapType',
  'normalScale', 'aoMap', 'aoMapIntensity', 'emissive', 'emissiveMap', 'emissiveIntensity', 'alphaMap', 'alphaTest',
  'transparent', 'opacity', 'side', 'vertexColors',
];

const toNodeMaterial = (material) => {
  const nodeMaterial = new THREE.MeshStandardNodeMaterial();
  STANDARD_PROPERTIES.forEach((key) => {
    if (material[key] === undefined) return;
    if (material[key]?.isColor || material[key]?.isVector2) nodeMaterial[key].copy(material[key]);
    else nodeMaterial[key] = material[key];
  });
  material.dispose();
  return nodeMaterial;
};

const lanternReady = new GLTFLoader().loadAsync('./stone_japanese_lantern.glb').then((gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.material = toNodeMaterial(child.material);
    child.castShadow = true;
    child.receiveShadow = true;
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // NOTE Normalize to LANTERN_HEIGHT, centered on X/Z, base on y = 0.
  const scale = LANTERN_HEIGHT / size.y;
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  lantern.add(model);
});

const smokeUrls = Array.from({ length: SMOKE_FRAMES }, (_, index) => `./smoke/smoke_${index}.wvdb`);
const smoke = new WVDBAnimationLoader()
  .setOptions({ emissiveGrid: 'temperature', emissiveScale: TEMPERATURE_SCALE })
  .load(smokeUrls, () => {
    // NOTE Source is Z-up. Center the smoke on X/Z with its bottom at the group origin.
    const box = smoke.bbox;
    const center = box.getCenter(new THREE.Vector3());
    smoke.position.set(-center.x, -center.y, -box.min.z);
    smoke.visible = true;
    smoke.play();
  });

smoke.visible = false;
smoke.fps = 60;
smoke.baseColor = '#0dceae';
smoke.extinction = 25;
smoke.densityScale = 1;
smoke.emissiveIntensity = 1.5;
smoke.temperatureRange = [0, TEMPERATURE_SCALE];
smoke.angstromExponent = 'smoke';

// NOTE Inner group: the Z-up fix and the bbox offset. Outer group: the place in the lantern light box.
const smokeOffset = new THREE.Group();
smokeOffset.rotation.x = -Math.PI / 2;
smokeOffset.add(smoke);

const smokeRoot = new THREE.Group();
smokeRoot.position.set(-0.2, 4.7, 0);
smokeRoot.scale.setScalar(0.3);
smokeRoot.add(smokeOffset);
scene.add(smokeRoot);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new THREE.Timer();

await renderer.init();

let shadows = null;

// NOTE The bake needs the env map and the lantern. The scene renders without shadows until it is ready.
Promise.all([environmentReady, lanternReady]).then(() => {
  // NOTE Vite pre-bundles the package, which breaks its relative wasm URL. Serve the wasm from public/ instead.
  const environmentShadows = new EnvironmentShadows(renderer, scene, {
    xatlasWasmUrl: './xatlas-web.wasm',
    bounds: new THREE.Box3().setFromObject(lantern).getBoundingSphere(new THREE.Sphere()),
  });

  environmentShadows.ready.then(() => {
    shadows = environmentShadows;
  });
});

renderer.setAnimationLoop((time) => {
  timer.update(time);
  smoke.update(timer.getDelta());

  scene.environmentIntensity = 0.5 - 0.5 * Math.cos((timer.getElapsed() / ENV_CYCLE) * Math.PI * 2);
  controls.update();
  shadows?.update(camera);
  renderer.render(scene, camera);
});

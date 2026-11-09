import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import { EnvironmentShadows } from 'three-environment-shadows/webgpu';
import { FrameEmissionLight, WVDBAnimationLoader, frameAngstromExponents, frameRenderer } from 'three-openvdb';

const LANTERN_HEIGHT = 10;
const SMOKE_FRAMES = 100;
// NOTE Seconds for one env intensity loop, 0 -> 1 -> 0.
const ENV_CYCLE = 20;

// NOTE Smoke placement relative to the lantern base. Tweak live with the panel, then copy the values here.
const smokeSettings = {
  x: -0.2,
  y: 4.7,
  z: 0,
  scale: 0.3,
  rotationY: 0,
  fps: 60,
  playing: true,
  copyValues: () => {
    const { copyValues, ...values } = smokeSettings;
    const text = JSON.stringify({ ...values, ...volumeSettings }, null, 2);
    navigator.clipboard?.writeText(text);
    console.log(text);
  },
};

const volumeSettings = {
  baseColor: '#0dceae',
  extinction: 25,
  densityScale: 1,
  emissiveIntensity: 1.5,
  // NOTE Same as the temperature preset of the docs example (Kelvin max of its sample).
  temperatureScale: 5052,
  spectral: true,
  preset: 'smoke',
  lightEmission: true,
  envIntensity: 0.75,
  lightIntensity: 3000,
};

frameRenderer.settings.spectral = volumeSettings.spectral;

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#15171c');

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// NOTE 3/4 view: 45 degrees around the lantern, slightly from above.
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
emissionLight.visible = volumeSettings.lightEmission;
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

const smokeRoot = new THREE.Group();
scene.add(smokeRoot);

const smokeUrls = Array.from({ length: SMOKE_FRAMES }, (_, index) => `./smoke/smoke_${index}.wvdb`);
const smoke = new WVDBAnimationLoader()
  .setOptions({ emissiveGrid: 'temperature', emissiveScale: volumeSettings.temperatureScale }).load(smokeUrls, () => {
  // NOTE Source is Z-up. Center the smoke on X/Z with its bottom at the group origin.
  const box = smoke.bbox;
  const center = box.getCenter(new THREE.Vector3());
  smoke.position.set(-center.x, -center.y, -box.min.z);
  smoke.visible = true;
  if (smokeSettings.playing) smoke.play();
});
smoke.visible = false;
smoke.fps = smokeSettings.fps;

// NOTE Inner group carries the Z-up fix and the bbox offset. Outer group is what the panel moves.
const smokeOffset = new THREE.Group();
smokeOffset.rotation.x = -Math.PI / 2;
smokeOffset.add(smoke);
smokeRoot.add(smokeOffset);

const applySmokeSettings = () => {
  smokeRoot.position.set(smokeSettings.x, smokeSettings.y, smokeSettings.z);
  smokeRoot.scale.setScalar(smokeSettings.scale);
  smokeRoot.rotation.y = THREE.MathUtils.degToRad(smokeSettings.rotationY);
  smoke.fps = smokeSettings.fps;
  if (smokeSettings.playing) smoke.play();
  else smoke.pause();
};
applySmokeSettings();

const applyVolumeSettings = () => {
  smoke.baseColor = volumeSettings.baseColor;
  smoke.extinction = volumeSettings.extinction;
  smoke.densityScale = volumeSettings.densityScale;
  smoke.emissiveIntensity = volumeSettings.emissiveIntensity;
  smoke.temperatureRange = [0, volumeSettings.temperatureScale];
  smoke.angstromExponent = volumeSettings.preset;
  frameRenderer.settings.spectral = volumeSettings.spectral;
  emissionLight.visible = volumeSettings.lightEmission;
  scene.environmentIntensity = volumeSettings.envIntensity;
  emissionLight.intensity = volumeSettings.lightIntensity;
};
applyVolumeSettings();

const gui = new GUI({ title: 'Smoke' });
gui.add(smokeSettings, 'x', -20, 20, 0.05).onChange(applySmokeSettings);
gui.add(smokeSettings, 'y', -10, 30, 0.05).onChange(applySmokeSettings);
gui.add(smokeSettings, 'z', -20, 20, 0.05).onChange(applySmokeSettings);
gui.add(smokeSettings, 'scale', 0.05, 3, 0.01).onChange(applySmokeSettings);
gui.add(smokeSettings, 'rotationY', -180, 180, 1).onChange(applySmokeSettings);
gui.add(smokeSettings, 'fps', 1, 60, 1).onChange(applySmokeSettings);
gui.add(smokeSettings, 'playing').onChange(applySmokeSettings);

const volumeFolder = gui.addFolder('Volume');
volumeFolder.addColor(volumeSettings, 'baseColor').name('base color').onChange(applyVolumeSettings);
volumeFolder.add(volumeSettings, 'extinction', 0, 400, 1).onChange(applyVolumeSettings);
volumeFolder.add(volumeSettings, 'densityScale', 0, 5, 0.01).name('density scale').onChange(applyVolumeSettings);
volumeFolder.add(volumeSettings, 'emissiveIntensity', 0, 50, 0.1).name('emissive int').onChange(applyVolumeSettings);
volumeFolder.add(volumeSettings, 'spectral').onChange(applyVolumeSettings);
volumeFolder.add(volumeSettings, 'preset', Object.keys(frameAngstromExponents)).onChange(applyVolumeSettings);
volumeFolder.add(volumeSettings, 'envIntensity', 0, 1, 0.01).name('env intensity').listen();
volumeFolder.add(volumeSettings, 'lightEmission').name('light emission').onChange(applyVolumeSettings);
volumeFolder.add(volumeSettings, 'lightIntensity', 0, 10000, 1).name('light intensity').onChange(applyVolumeSettings);

gui.add(smokeSettings, 'copyValues').name('copy values');

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
    console.info('EnvironmentShadows ready');
    shadows = environmentShadows;
  });
});

renderer.setAnimationLoop((time) => {
  timer.update(time);
  smoke.update(timer.getDelta());

  volumeSettings.envIntensity = 0.5 - 0.5 * Math.cos((timer.getElapsed() / ENV_CYCLE) * Math.PI * 2);
  scene.environmentIntensity = volumeSettings.envIntensity;
  controls.update();
  shadows?.update(camera);
  renderer.render(scene, camera);
});

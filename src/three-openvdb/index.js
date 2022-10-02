import '../openvdb/index';
import { VolumeToMesh } from '../openvdb/tools/VolumeToMesh';

const Three = THREE;

const renderThree = (vdb) => {
  let camera, scene, renderer, controls, mesh;

  const createWorld = () => {
    scene.add()
    scene.add(new Three.Mesh(
      new Three.SphereGeometry(500.0, 32, 32),
      new Three.MeshBasicMaterial({ wireframe: true, color: 0x372948 })
    ));
  };

  const init = () => {
    camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000.0);
    camera.position.set(-5, 5, 7);

    scene = new Three.Scene();
    scene.background = new Three.Color(0x251B37);

    const spot = new Three.SpotLight(0xffffcc, 1.0);
    spot.position.set(150.0, 50.0, 150.0);
    scene.add(spot);

    scene.add(new Three.HemisphereLight(0xffff88, 0x000033, 0.5));

    renderer = new Three.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    
    controls = new Three.OrbitControls(camera, renderer.domElement);

    createWorld();

    window.addEventListener('resize', onWindowResize);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    
    controls.update();
  
    renderer.render(scene, camera); 
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  init();
  animate();
};

window.renderThree = renderThree;

import '../openvdb/index';

const Three = THREE;

const renderThree = (vdb) => {
  let camera, scene, renderer, controls, mesh;

  const createWorld = () => {
    const bbox = new Three.Box3();

    const preview = new Three.Object3D();
    scene.add(preview);

    Object.values(vdb).forEach(grid => {
      const materialGrid = new Three.MeshBasicMaterial({ wireframe: true, color: 0x330033 });
      const geometry = new Three.BoxGeometry(1.0, 1.0);
      const mesh = new Three.InstancedMesh(geometry, materialGrid, grid.leavesCount);
      preview.add(mesh);

      const mock = new Three.Object3D();
      let instanceId = 0;
      const voxelBox = [];

      window.addEventListener('keydown', (event) => {
        if (event.key === 'a') {
          voxelBox.forEach(voxel => voxel.visible = true);
          mesh.visible = false;
        }

        if (event.key === 'b') {
          voxelBox.forEach(voxel => voxel.visible = false);
          mesh.visible = true;
        }
      });

      const traverseVDB = (level, node) => {

        let sumParentOffset = new Three.Vector3();

        const addParentOffset = (parent) => {
          if (parent && parent.origin) {
            sumParentOffset.add(parent.origin);
          }

          if (parent.parent) {
            addParentOffset(parent.parent);
          }
        };
        addParentOffset(node);

        if (node.level === 0) {
          const materialVoxel = new Three.MeshPhongMaterial({ color: Math.random() * 0x888888 + 0x888888 });
          const voxels = new Three.InstancedMesh(geometry, materialVoxel, node.numVoxels * 3);
          let voxelId = 0;

          voxels.visible = false;
          voxelBox.push(voxels);
          preview.add(voxels);

          let nodeBbox = grid.getWorldBbox(node);
          bbox.set(...nodeBbox);

          bbox.getCenter(mock.position);
          bbox.getSize(mock.scale);

          mock.updateMatrix();
          mesh.setMatrixAt(instanceId++, mock.matrix);

          const nodePosition = mock.position.clone();
          const voxelSize = mock.scale.x / 8;

          voxels.position.copy(nodePosition);

          node.forEachValue(({ coords }) => {
            mock.scale.setScalar(voxelSize);
            mock.position.set(0.0, 0.0, 0.0);

            mock.position.x += coords.x * voxelSize - voxelSize * 3.5;
            mock.position.y += coords.y * voxelSize - voxelSize * 3.5;
            mock.position.z += coords.z * voxelSize - voxelSize * 3.5;

            mock.updateMatrix();
            voxels.setMatrixAt(voxelId++, mock.matrix);

            voxelId++;
          });
        }

        if (node.table) {
          node.table.forEach(child => {
            traverseVDB(level + 1, child);
          });
        }
      };

      grid.root.table.forEach(node => traverseVDB(0, node));
    });

    scene.add(new Three.Mesh(
      new Three.SphereGeometry(500.0, 32, 32),
      new Three.MeshBasicMaterial({ wireframe: true, color: 0x000000, transparent: true, opacity: 0.1 })
    ));
  };

  const init = () => {
    camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000.0);
    camera.position.set(-5, 5, 7);

    scene = new Three.Scene();
    scene.background = new Three.Color(0xffeeff);

    const spot = new Three.SpotLight(0xffffcc, 1.0);
    spot.position.set(150.0, 50.0, 150.0);
    scene.add(spot);

    scene.add(new Three.HemisphereLight(0xffff88, 0x000033, 0.5));

    renderer = new Three.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    
    controls = new Three.OrbitControls(camera, renderer.domElement);

    createWorld();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    
    controls.update();
  
    renderer.render(scene, camera); 
  };

  init();
  animate();
};

window.renderThree = renderThree;

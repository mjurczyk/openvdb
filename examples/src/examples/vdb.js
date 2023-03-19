import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { setGuiFields, dropTarget } from '../utils/gui';
import { loadAndCacheVDB } from '../utils/resources';
import { SimpleDropzone } from 'simple-dropzone';

let fogVolume, targetScene;

const dropzone = new SimpleDropzone(dropTarget, document.createElement('input'));

dropTarget.innerHTML = '[Drop .VDB / .ZIP here]';

dropzone.on('drop', ({ files }) => {
  let file = [...files];

  const fileName = file[0][0];
  const fileSource = URL.createObjectURL(file[0][1]);

  dropTarget.innerHTML = '[Loaded! Parsing...]';

  loadAndCacheVDB(fileName, fileSource).then(vdb => {
    dropTarget.innerHTML = '[Drop .VDB / .ZIP here]';

    fogVolume = new OpenVDB.FogVolume(vdb, {
      resolution: 200,
      steps: 50,
      baseColor: 0xffffff,
      absorbance: 1.0,
      progressive: true,
      emissiveGrid: vdb.grids?.temperature
    });
    
    // NOTE Center fog volume
    const sampleGrid = vdb.grids[Object.keys(vdb.grids)[0]];
    const worldBbox = new Three.Box3();
    worldBbox.set(...sampleGrid.getPreciseWorldBbox());
    const worldOffset = new Three.Vector3();
    worldBbox.getSize(worldOffset).multiplyScalar(0.5);
    fogVolume.position.y -= worldOffset.y;

    if (targetScene) {
      targetScene.add(fogVolume);
    }
  });
});

dropzone.on('dropstart', () => {
  if (fogVolume) {
    fogVolume.parent.remove(fogVolume);
    fogVolume.geometry.dispose();

    fogVolume.materials.forEach(material => {
      material.densityMap3D.dispose();

      if (material.emissiveMap3D) material.emissiveMap3D.dispose();
    });

    fogVolume.dispose();
    fogVolume = null;
  }

  dropTarget.innerHTML = '[Loading VDB file - please wait...]';
});

dropzone.on('droperror', ({ message }) => {
  dropTarget.innerHTML = '[Error - please try again]';

  console.error({message});
});

export const exampleVDB = ({ scene }) => {
  targetScene = scene;

  const debugMesh = new Three.Mesh(
    new Three.SphereGeometry(20.0, 32.0, 32.0),
    new Three.MeshStandardMaterial({ color: 0xffffff })
  );
  scene.add(debugMesh);

  const debugObstacle = new Three.Mesh(
    new Three.SphereGeometry(20.0, 32.0, 32.0),
    new Three.MeshPhongMaterial({ color: 0xffffff })
  );
  debugObstacle.position.set(-200.0, 0.0, 200.0);
  scene.add(debugObstacle);

  // Lights

  const addPointLight = (color, x, y, z) => {
    const pivot = new Three.Group();
    const light = new Three.PointLight(color, 0.5);
    light.position.set(x, y, z);
    light.add(new Three.Mesh(
      new Three.SphereGeometry(1.0, 32, 32),
      new Three.MeshBasicMaterial({ color: color })
    ));

    pivot.add(light);
    scene.add(pivot);

    return [ light, pivot ];
  };

  const addSpotLight = (color, x, y, z) => {
    const pivot = new Three.Group();
    const light = new Three.SpotLight(color, 0.5, null, 0.2, 0.6);
    light.position.set(x, y, z);
    light.add(new Three.Mesh(
      new Three.SphereGeometry(1.0, 32, 32),
      new Three.MeshBasicMaterial({ color: color })
    ));

    pivot.add(light);
    scene.add(pivot);

    return [ light, pivot ];
  };

  const addDirectionalLight = (color, x, y, z) => {
    const light = new Three.DirectionalLight(color, 0.5);
    light.position.set(x, y, z);
    
    const helper = new Three.Mesh(
      new Three.SphereGeometry(1.0, 32, 32),
      new Three.MeshBasicMaterial({ color: color })
    );
    helper.position.set(x, y, z);

    scene.add(light);
    scene.add(helper);

    return [ light, helper ];
  };

  const [ spotLight, spotLightPivot ] = addSpotLight(0xff00ff, 50.0, 80.0, 0.0);
  const [ topSpotLight ] = addSpotLight(0xff0000, 0.0, 80, 0.0);

  const [ pointLight, pointLightPivot ] = addPointLight(0xff00ff, 50.0, 80.0, 0.0);
  const [ topPointLight ] = addPointLight(0xff0000, 0.0, 80, 0.0);
  
  const [ debugMeshLight, debugMeshLightPivot ] = addPointLight(0xffff88, 0.0, 0.0, 0.0);
  debugObstacle.add(debugMeshLightPivot);

  const [ fogVolumeLight ] = addPointLight(0xff00ff, 0.0, -10.0, 0.0);
  fogVolumeLight.children = [];

  const [ directionalLight, directionalHelper ] = addDirectionalLight(0xff0000, 0.0, 0.0, -80.0);

  const hemiSphereLight = new Three.HemisphereLight(0xff0000, 0x0000ff, 1.0);
  scene.add(hemiSphereLight);

  setInterval(() => {
    spotLightPivot.rotateY(0.005);
    pointLightPivot.rotateX(0.005);
  }, 1);

  setGuiFields([
    {
      folder: 'Scene',
      children: [
        {
          id: 'showMesh',
          name: 'Show Debug Mesh',
          defaultValue: false,
          onChange: (value) => {
            if (fogVolume) fogVolume.visible = !value;

            debugMesh.visible = !!value;
          }
        },
        {
          id: 'backgroundColor',
          name: 'Background Color',
          defaultValue: '#598eff',
          onChange: (value) => {
            scene.background.set(value);
          }
        },
        {
          id: 'lightSetup',
          name: 'Lights',
          defaultValue: 'hemi',
          options: {
            'Hemisphere Light': 'hemi',
            'Spot Lights': 'spot',
            'Point Lights': 'point',
            'Directional Light': 'dir',
            'Sun': 'sun',
            'Glow': 'glow',
            'None': 'none',
          },
          onChange: (value) => {
            pointLight.visible = value === 'point';
            topPointLight.visible = value === 'point';

            spotLight.visible = value === 'spot';
            topSpotLight.visible = value === 'spot';

            directionalLight.visible = value === 'dir';
            hemiSphereLight.visible = value === 'dir';

            hemiSphereLight.visible = value === 'hemi';

            debugMeshLight.visible = value === 'sun';

            fogVolumeLight.visible = value === 'glow';
          }
        },
        {
          id: 'lightColor',
          name: 'Light Color',
          defaultValue: '#ff00ff',
          onChange: (value) => {
            spotLight.color.set(value);
            spotLight.children[0].material.color.set(value);

            directionalLight.color.set(value);
            directionalHelper.material.color.set(value);

            pointLight.color.set(value);
            pointLight.children[0].material.color.set(value);

            fogVolumeLight.color.set(value);
          }
        },
        {
          id: 'lightIntensity',
          name: 'Light Intensity',
          defaultValue: 1.0,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            spotLight.intensity = value;
            topSpotLight.intensity = value;

            directionalLight.intensity = value;
            hemiSphereLight.intensity = value;

            pointLight.intensity = value;
            topPointLight.intensity = value;

            fogVolumeLight.intensity = value;
          }
        }
      ]
    },
    {
      folder: 'Fog Volume',
      children: [
        {
          id: 'wrap3D',
          name: '3D Wrapping',
          defaultValue: Three.MirroredRepeatWrapping,
          options: {
            'Three.ClampToEdgeWrapping': Three.ClampToEdgeWrapping,
            'Three.RepeatWrapping': Three.RepeatWrapping,
            'Three.MirroredRepeatWrapping': Three.MirroredRepeatWrapping,
          },
          onChange: (value) => {
            if (!fogVolume) return;

            fogVolume.material.wrap3D = value;
          }
        },
        {
          id: 'fogColor',
          name: 'Fog Color',
          defaultValue: '#ffffff',
          onChange: (value) => {
            if (fogVolume) fogVolume.materials.forEach(material => material.baseColor = value);
            debugMesh.material.color.set(value);
          }
        },
        {
          id: 'scatterColor',
          name: 'Scatter Color',
          defaultValue: '#000000',
          onChange: (value) => {
            if (fogVolume) fogVolume.materials.forEach(material => material.scatterColor = value);
          }
        },
        {
          id: 'absorbance',
          name: 'Absorbance',
          defaultValue: 0.98,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            if (fogVolume) fogVolume.materials.forEach(material => material.absorbance = value);
          }
        },
        {
          id: 'densityScale',
          name: 'Density Scale',
          defaultValue: 1.0,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            if (fogVolume) fogVolume.materials.forEach(material => material.densityScale = value);
          }
        },
        {
          id: 'noise',
          name: 'Noise',
          defaultValue: 0.5,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            if (fogVolume) fogVolume.materials.forEach(material => material.noiseScale = value);
          }
        },
        {
          id: 'opacity',
          name: 'Opacity',
          defaultValue: 1.0,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            if (fogVolume) fogVolume.materials.forEach(material => material.opacity = value);
          }
        },
        {
          id: 'steps',
          name: 'Steps',
          defaultValue: 400.0,
          min: 10.0,
          max: 1000.0,
          onChange: (value) => {
            if (fogVolume) fogVolume.materials.forEach(material => material.steps = value);
          }
        }
      ]
    }
  ]);
};

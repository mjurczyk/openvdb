import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB, loaders } from '../utils/resources';
import { lights } from '../../../src/openvdb/utils/lights';

export const exampleClouds = ({ scene }) => {
  const debugMesh = new Three.Mesh(
    new Three.SphereGeometry(20.0, 32.0, 32.0),
    new Three.MeshStandardMaterial({ color: 0xffffff })
  );
  scene.add(debugMesh);

  const debugObstacle = new Three.Mesh(
    new Three.SphereGeometry(20.0, 32.0, 32.0),
    new Three.MeshStandardMaterial({ color: 0xffffff })
  );
  debugObstacle.position.set(-200.0, 0.0, 200.0);
  // scene.add(debugObstacle);

  const fogVolume = new OpenVDB.FogVolume(new OpenVDB.CloudVolume({
    height: 0.2,
    density: 0.001
  }), {
    resolution: 50,
    progressive: true,
    steps: 100,
    absorbance: 0.5,
    baseColor: 0xaaaaaa,
    radius: 1.,
    lights: lights.useEnvironment
  });
  fogVolume.scale.setScalar(1000.0);
  fogVolume.position.y += 300.0;
  scene.add(fogVolume);

  setInterval(() => {
    fogVolume.materials.forEach(material => {
      material.densityMap3D.offset3D.x += 0.0001;
      material.densityMap3D.offset3D.z += 0.0001;
    });
  }, 1 / 60);
  
  const light = new Three.DirectionalLight(0xffff88, 1.0);
  light.position.set(1.0, 1.0, 0.0);
  scene.add(light);

  // NOTE Depth testing
  loaders.gltf.load('./assets/depth-testing.glb', ({ scene: gltfModel }) => {
    const model = gltfModel;

    model.position.x += 2.0;
    model.scale.setScalar(25.0);
    model.position.y = -100.0;

    scene.add(model);
  });

  setGuiFields([
    {
      folder: 'Scene',
      children: [
        {
          id: 'showMesh',
          name: 'Show Debug Mesh',
          defaultValue: false,
          onChange: (value) => {
            fogVolume.visible = !value;
            debugMesh.visible = !!value;
          }
        },
        {
          id: 'lightIntensity',
          name: 'Light Intensity',
          defaultValue: 1.0,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            light.intensity = value;
          }
        },
        {
          id: 'environment',
          name: 'EnvMap',
          defaultValue: 'uv-1',
          options: {
            'Fiery Sky': 'fiery-sky-1',
            'Magic Forest': 'magic-forest-5',
            'UV': 'uv-1'
          },
          onChange: (value) => {
            loaders.rgbe.load(`./assets/${value}-HDR.hdr`, env => {
              env.mapping = Three.EquirectangularReflectionMapping;
              scene.environment = env;
            });
          
            loaders.texture.load(`./assets/${value}-8K.jpg`, env => {
              env.mapping = Three.EquirectangularRefractionMapping;
              env.encoding = Three.sRGBEncoding;
              scene.background = env;
            });
          }
        },
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
            fogVolume.materials.forEach(material => material.wrap3D = value);
          }
        },
        {
          id: 'fogColor',
          name: 'Fog Color',
          defaultValue: '#ffffff',
          onChange: (value) => {
            fogVolume.materials.forEach(material => material.baseColor = value);
            debugMesh.material.color.set(value);
          }
        },
        {
          id: 'scatterColor',
          name: 'Scatter Color',
          defaultValue: `#000000`,
          onChange: (value) => {
            fogVolume.materials.forEach(material => material.scatterColor = value);
          }
        },
        {
          id: 'absorbance',
          name: 'Absorbance',
          defaultValue: 0.98,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            fogVolume.materials.forEach(material => material.absorbance = value);
          }
        },
        {
          id: 'densityScale',
          name: 'Density Scale',
          defaultValue: 1.0,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            fogVolume.materials.forEach(material => material.densityScale = value);
          }
        },
        {
          id: 'roughness',
          name: 'Roughness',
          defaultValue: 0.5,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            fogVolume.materials.forEach(material => material.roughness = value);
          }
        },
        {
          id: 'opacity',
          name: 'Opacity',
          defaultValue: 1.0,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            fogVolume.materials.forEach(material => material.opacity = value);
          }
        },
        {
          id: 'steps',
          name: 'Steps',
          defaultValue: 500.0,
          min: 10.0,
          max: 1000.0,
          onChange: (value) => {
            fogVolume.materials.forEach(material => material.steps = value);
          }
        }
      ]
    }
  ]);
};

import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB, loaders } from '../utils/resources';
import { lights } from '../../../src/openvdb/utils/lights';
import { camera } from '../main';

const DEPTH_TEST_DEMO = false;
const FLIGHT_DEMO = true;

export const exampleClouds = ({ scene }) => {
  const fogVolume = new OpenVDB.FogVolume(new OpenVDB.CloudVolume({
    height: 0.2,
    density: 0.3
  }), {
    resolution: 100,
    progressive: true,
    steps: 100,
    absorbance: 1.,
    baseColor: 0x000000,
    lights: lights.useEnvironment | lights.useDirectionalLights,
    densityCutoff: 0.,
  });
  fogVolume.scale.setScalar(1000.0);
  fogVolume.position.y += 300.0;
  scene.add(fogVolume);

  let aircraft;
  const flightDirection = new Three.Vector3(0.0, 0.0, 1.0);
  const windDirection = new Three.Vector3(1.0, 0.0, 1.0).multiplyScalar(0.00005);

  setInterval(() => {
    const delta = flightDirection.clone().normalize().multiplyScalar(0.0001);

    fogVolume.materials.forEach(material => {
      material.densityMap3D.offset3D.x += delta.x;
      material.densityMap3D.offset3D.z += delta.z;

    //   material.densityMap3D.offset3D.x += windDirection.x;
    //   material.densityMap3D.offset3D.z += windDirection.z;
    });

  //   fogVolume.position.y -= flightDirection.y * 0.2;

  //   if (aircraft) {
  //     aircraft.lookAt(flightDirection);
  //   }

  //   const cameraDirection = new Three.Vector3();
  //   camera.getWorldDirection(cameraDirection);

  //   flightDirection.lerp(cameraDirection, 0.005);
  }, 1 / 60);
  
  const light = new Three.DirectionalLight(0xccccff, 0.2);
  light.position.set(1000.0, 1000.0, 1000.0);
  // scene.add(light);

  // NOTE Depth testing
  if (DEPTH_TEST_DEMO) {
    loaders.gltf.load('./assets/depth-testing.glb', ({ scene: gltfModel }) => {
      const model = gltfModel;

      model.position.x += 2.0;
      model.scale.setScalar(25.0);
      model.position.y = -100.0;

      scene.add(model);
    });
  }

  if (FLIGHT_DEMO) {
    loaders.gltf.load('./assets/airbus.glb', ({ scene: gltfModel }) => {
      const model = gltfModel;

      model.scale.setScalar(10.0);

      model.traverse(child => {
        if (child.isPointLight) {
          child.intensity = 1.0;
          child.distance = 0.1;
        }
      });

      scene.add(model);

      aircraft = model;
    });
  }

  setGuiFields([
    {
      folder: 'Scene',
      children: [
        {
          id: 'lightIntensity',
          name: 'Light Intensity',
          defaultValue: light.intensity,
          min: 0.0,
          max: 1.0,
          onChange: (value) => {
            light.intensity = value;
          }
        },
        {
          id: 'environment',
          name: 'EnvMap',
          defaultValue: 'night',
          options: {
            'Night Realistic': 'night',
            'Fiery Sky': 'fiery-sky-1',
            'Magic Forest': 'magic-forest-5',
            'UV': 'uv-1',
          },
          onChange: (value) => {
            loaders.rgbe.load(`./assets/${value}-HDR.hdr`, env => {
              env.mapping = Three.EquirectangularReflectionMapping;
              scene.environment = env;


              scene.background = env;
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
          defaultValue: 0.9,
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

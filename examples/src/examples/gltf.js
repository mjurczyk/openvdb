import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loaders } from '../utils/resources';

export const exampleGLTF = ({ scene }) => {

  const createGui = (fogVolume) => {
    setGuiFields([
      {
        folder: 'Scene',
        children: [
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
            defaultValue: '#000000',
            onChange: (value) => {
              fogVolume.materials.forEach(material => material.scatterColor = value);
            }
          },
          {
            id: 'absorbance',
            name: 'Absorbance',
            defaultValue: 1.0,
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
            defaultValue: 1000.0,
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

  loaders.gltf.load('./assets/car.glb', ({ scene: gltfModel }) => {
    const model = gltfModel;

    model.position.x += 2.0;
    model.scale.setScalar(0.8);

    scene.add(model);

    const fogVolume = new OpenVDB.FogVolume(
      new OpenVDB.MeshVolume(model),
      {
        baseColor: 0xff00ff,
        resolution: 100,
        progressive: true,
        steps: 1000,
        radius: 5.0
      }
    );

    scene.add(fogVolume);
    scene.scale.setScalar(100.0);

    createGui(fogVolume);
  });

  const sun = new Three.DirectionalLight(0xffffff, 0.1);
  sun.position.set(1.0, 0.8, 1.0);

  scene.add(sun);
};

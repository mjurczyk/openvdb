import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loaders } from '../utils/resources';

export const exampleGLTF = ({ scene }) => {

  const createGui = (fogVolume) => {
    setGuiFields([
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
            id: 'noise',
            name: 'Noise',
            defaultValue: 0.0,
            min: 0.0,
            max: 1.0,
            onChange: (value) => {
              fogVolume.materials.forEach(material => material.noiseScale = value);
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

  loaders.rgbe.load('./assets/fiery-sky-1-HDR.hdr', env => {
    env.mapping = Three.EquirectangularReflectionMapping;
    scene.environment = env;
  });

  loaders.texture.load('./assets/fiery-sky-1-8K.jpg', env => {
    env.mapping = Three.EquirectangularRefractionMapping;
    env.encoding = Three.sRGBEncoding;
    scene.background = env;
  });

  loaders.gltf.load('./assets/damaged_helmet.glb', ({ scene: gltfModel }) => {
    const model = gltfModel;
    // const model = new Three.Mesh(
    //   new Three.SphereGeometry(0.75, 32, 64),
    //   new Three.MeshStandardMaterial({ metalness: 0.9, roughness: 0.75 })
    // );

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
        // absorbance: 0.5,
        // densityScale: 0.3,
      }
    );

    scene.add(fogVolume);
    scene.scale.setScalar(100.0);

    createGui(fogVolume);
  });

  const sun = new Three.DirectionalLight(0xffffff, 1.0);
  sun.position.set(1.0, 0.8, 1.0);

  scene.add(sun);

  // loadAndCacheVDB('bunny_cloud.vdb', './assets/bunny_cloud.vdb').then(vdb => {
  //   const fogVolume = new OpenVDB.Bbox(vdb);

  //   // NOTE Center fog volume
  //   const sampleGrid = vdb.grids[Object.keys(vdb.grids)[0]];
  //   const worldBbox = new Three.Box3();
  //   worldBbox.set(...sampleGrid.getPreciseWorldBbox());
  //   const worldOffset = new Three.Vector3();
  //   worldBbox.getSize(worldOffset).multiplyScalar(0.5);
  //   fogVolume.position.y -= worldOffset.y;

  //   scene.add(fogVolume);

  //   setGuiFields([
  //     {
  //       folder: 'Bbox',
  //       children: [
  //         {
  //           id: 'color',
  //           name: 'Color',
  //           defaultValue: '#ff0000',
  //           onChange: (value) => {
  //             fogVolume.children[0].material.color.set(value);
  //           }
  //         },
  //         {
  //           id: 'opacity',
  //           name: 'Opacity',
  //           defaultValue: 0.1,
  //           min: 0.0,
  //           max: 1.0,
  //           onChange: (value) => {
  //             fogVolume.children.forEach(child => {
  //               child.material.opacity = value;
  //             });
  //           }
  //         }
  //       ]
  //     }
  //   ]);
  // });
};

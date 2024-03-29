import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB, loaders } from '../utils/resources';

export const exampleBunny = ({ scene }) => {
  loadAndCacheVDB('bunny_cloud.vdb', './assets/bunny_cloud.vdb').then(vdb => {
    const debugMesh = new Three.Mesh(
      new Three.SphereGeometry(20.0, 32.0, 32.0),
      new Three.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.5 })
    );
    scene.add(debugMesh);

    const debugObstacle = new Three.Mesh(
      new Three.SphereGeometry(20.0, 32.0, 32.0),
      new Three.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.5 })
    );
    debugObstacle.position.set(-200.0, 0.0, 200.0);
    scene.add(debugObstacle);

    const fogVolume = new OpenVDB.FogVolume(vdb, {
      resolution: 100,
      steps: 10000,
      absorbance: 1.0,
      progressive: true,
      radius: 2.0,
    });

    // NOTE Center fog volume
    const sampleGrid = vdb.grids[Object.keys(vdb.grids)[0]];
    const worldBbox = new Three.Box3();
    worldBbox.set(...sampleGrid.getPreciseWorldBbox());
    const worldOffset = new Three.Vector3();
    worldBbox.getSize(worldOffset).multiplyScalar(0.5);
    fogVolume.position.y -= worldOffset.y;

    scene.add(fogVolume);

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
              fogVolume.visible = !value;
              debugMesh.visible = !!value;
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

              fogVolume.materials.forEach(material => material.useEnvironment = value !== 'none');
              fogVolume.materials.forEach(material => material.usePointLights = ['point', 'sun', 'glow'].includes(value));
              fogVolume.materials.forEach(material => material.useDirectionalLights = value === 'dir');
              fogVolume.materials.forEach(material => material.useSpotLights = value === 'spot');
              fogVolume.materials.forEach(material => material.useHemisphereLights = value === 'hemi');
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
  });
};

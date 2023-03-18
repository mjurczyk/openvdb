import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB } from '../utils/resources';

export const exampleSpotlights = ({ scene }) => {
  loadAndCacheVDB('./assets/bunny_cloud.vdb').then(vdb => {
    const debugMesh = new Three.Mesh(
      new Three.SphereGeometry(20.0, 32.0, 32.0),
      new Three.MeshStandardMaterial({ color: 0xffffff })
    );
    scene.add(debugMesh);

    const fogVolume = new OpenVDB.FogVolume(vdb, {
      resolution: 100,
      steps: 50,
      color: 0xffffff,
      absorbance: 1.0,
      progressive: true
    });

    const sampleGrid = vdb.grids[Object.keys(vdb.grids)[0]];
    const worldBbox = new Three.Box3();
    worldBbox.set(...sampleGrid.getPreciseWorldBbox());
    const worldOffset = new Three.Vector3();
    worldBbox.getSize(worldOffset).multiplyScalar(0.5);

    fogVolume.position.y -= worldOffset.y;

    scene.add(fogVolume);

    const addPunctualLight = (color, x, y, z) => {
      const pivot = new Three.Group();
      const light = new Three.PointLight(color, 0.5, null, 0.2, 0.6);
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

    const [ spotLight, spotLightPivot ] = addPunctualLight(0xff00ff, 50.0, 80.0, 0.0);
    const [ topLight ] = addPunctualLight(0xff0000, 0.0, 80, 0.0);
    
    const [ directionalLight, directionalHelper ] = addDirectionalLight(0xff0000, 0.0, 0.0, -80.0);

    setInterval(() => {
      spotLightPivot.rotateY(0.005);
    }, 1);

    const hemiSphereLight = new Three.HemisphereLight(0xff0000, 0x0000ff, 1.0);
    scene.add(hemiSphereLight);


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
            id: 'lightColor',
            name: 'Light Color',
            defaultValue: '#ff00ff',
            onChange: (value) => {
              spotLight.color.set(value);
              spotLight.children[0].material.color.set(value);

              directionalLight.color.set(value);
              directionalHelper.material.color.set(value);
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
              topLight.intensity = value;
              directionalLight.intensity = value;
            }
          }
        ]
      },
      {
        folder: 'Fog Volume',
        children: [
          {
            id: 'color',
            name: 'Fog Color',
            defaultValue: '#ffffff',
            onChange: (value) => {
              fogVolume.material.baseColor = value;
              debugMesh.material.color.set(value);
            }
          },
          {
            id: 'absorbance',
            name: 'Absorbance',
            defaultValue: 1.0,
            min: 0.0,
            max: 1.0,
            onChange: (value) => {
              fogVolume.material.absorbance = value;
            }
          },
          {
            id: 'opacity',
            name: 'Opacity',
            defaultValue: 1.0,
            min: 0.0,
            max: 1.0,
            onChange: (value) => {
              fogVolume.material.opacity = value;
            }
          },
          {
            id: 'steps',
            name: 'Steps',
            defaultValue: 100.0,
            min: 10.0,
            max: 200.0,
            onChange: (value) => {
              fogVolume.material.steps = value;
            }
          }
        ]
      }
    ]);
  });
};

import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB } from '../utils/resources';

export const exampleClouds = ({ scene }) => {
  loadAndCacheVDB('./assets/bunny_cloud.vdb').then(vdb => {
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
    scene.add(debugObstacle);

    const fogVolume = new OpenVDB.FogVolume(new OpenVDB.CloudVolume({
      height: 0.2,
      density: 0.001
    }), {
      resolution: 50,
      progressive: true,
      steps: 500,
      absorbance: 0.5,
      baseColor: 0xaaaaaa
    });
    fogVolume.scale.setScalar(1000.0);
    fogVolume.position.y += 300.0;
    scene.add(fogVolume);

    setInterval(() => {
      fogVolume.material.densityMap3D.offset3D.x += 0.0001;
      fogVolume.material.densityMap3D.offset3D.z += 0.0001;
    }, 1 / 60);
    
    const light = new Three.DirectionalLight(0xffff88, 1.0);
    light.position.set(1.0, 1.0, 0.0);
    scene.add(light);

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
            id: 'backgroundColor',
            name: 'Background Color',
            defaultValue: '#598eff',
            onChange: (value) => {
              scene.background.set(value);
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
              fogVolume.material.wrap3D = value;
            }
          },
          {
            id: 'fogColor',
            name: 'Fog Color',
            defaultValue: '#ffffff',
            onChange: (value) => {
              fogVolume.material.baseColor = value;
              debugMesh.material.color.set(value);
            }
          },
          {
            id: 'scatterColor',
            name: 'Scatter Color',
            defaultValue: `#${scene.background.getHexString ? scene.background.getHexString() : '888888'}`,
            onChange: (value) => {
              fogVolume.material.scatterColor = value;
            }
          },
          {
            id: 'absorbance',
            name: 'Absorbance',
            defaultValue: 0.98,
            min: 0.0,
            max: 1.0,
            onChange: (value) => {
              fogVolume.material.absorbance = value;
            }
          },
          {
            id: 'densityScale',
            name: 'Density Scale',
            defaultValue: 1.0,
            min: 0.0,
            max: 1.0,
            onChange: (value) => {
              fogVolume.material.densityScale = value;
            }
          },
          {
            id: 'noise',
            name: 'Noise',
            defaultValue: 0.5,
            min: 0.0,
            max: 1.0,
            onChange: (value) => {
              fogVolume.material.noiseScale = value;
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
            defaultValue: 400.0,
            min: 10.0,
            max: 1000.0,
            onChange: (value) => {
              fogVolume.material.steps = value;
            }
          }
        ]
      }
    ]);
  });
};

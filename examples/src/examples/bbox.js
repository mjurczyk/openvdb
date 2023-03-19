import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB } from '../utils/resources';

export const exampleBbox = ({ scene }) => {
  loadAndCacheVDB('bunny_cloud.vdb', './assets/bunny_cloud.vdb').then(vdb => {
    const fogVolume = new OpenVDB.Bbox(vdb);

    // NOTE Center fog volume
    const sampleGrid = vdb.grids[Object.keys(vdb.grids)[0]];
    const worldBbox = new Three.Box3();
    worldBbox.set(...sampleGrid.getPreciseWorldBbox());
    const worldOffset = new Three.Vector3();
    worldBbox.getSize(worldOffset).multiplyScalar(0.5);
    fogVolume.position.y -= worldOffset.y;

    scene.add(fogVolume);

    setGuiFields([
      {
        folder: 'Bbox',
        children: [
          {
            id: 'color',
            name: 'Color',
            defaultValue: '#ff0000',
            onChange: (value) => {
              fogVolume.children[0].material.color.set(value);
            }
          },
          {
            id: 'opacity',
            name: 'Opacity',
            defaultValue: 0.1,
            min: 0.0,
            max: 1.0,
            onChange: (value) => {
              fogVolume.children.forEach(child => {
                child.material.opacity = value;
              });
            }
          }
        ]
      }
    ]);
  });
};

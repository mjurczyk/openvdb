import * as Three from 'three';
import * as OpenVDB from '../../../src/openvdb/three';
import { gui, setGuiFields } from '../utils/gui';
import { loadAndCacheVDB } from '../utils/resources';

export const exampleBbox = ({ scene }) => {
  loadAndCacheVDB('./assets/bunny_cloud.vdb').then(vdb => {
    const bbox = new OpenVDB.Bbox(vdb);
    scene.add(bbox);

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

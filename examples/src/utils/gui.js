import GUI from "lil-gui";
import { exampleBbox } from "../examples/bbox";
import { exampleBunny } from "../examples/bunny";
import { exampleClouds } from "../examples/clouds";
import { exampleVDB } from "../examples/vdb";
import { scene } from "../main";

export let gui = new GUI();
export const dropTarget = document.querySelector('#dropzone');

let activeDemo = 'vdb';

const guiBaseFields = () => [
  {
    folder: 'General',
    children: [
      {
        id: 'demo',
        name: 'Example',
        options: {
          'Bunny': 'bunny',
          'Clouds': 'clouds',
          'Bbox': 'bbox',
          'Custom VDB': 'vdb',
        },
        defaultValue: activeDemo,
        onChange: (value) => {
          if (value === activeDemo) {
            return;
          }

          activeDemo = value;

          scene.traverse(child => {
            if (child.material) {
              child.material.dispose();
            }

            if (child.geometry) {
              child.geometry.dispose();
            }
          });
          scene.children = [];

          dropTarget.style.display = value === 'vdb' ? '' : 'none';

          switch (value) {
            case 'bbox':
              return exampleBbox({ scene });
            case 'bunny':
              return exampleBunny({ scene });
            case 'clouds':
              return exampleClouds({ scene });
            case 'vdb':
              return exampleVDB({ scene });
          }
        }
      }
    ]
  }
];

let guiExtendedFields = [];

export const setGuiFields = (extendedFields) => {
  guiExtendedFields = extendedFields;

  showGui();
};

export const showGui = () => {
  gui.destroy();
  gui = new GUI();

  const guiState = {};

  const traverse = (level, fields) => {
    fields.forEach(field => {
      if (field.folder) {
        return;
      }

      guiState[field.id] = field.defaultValue;
    });

    fields.forEach(field => {
      if (field.folder) {
        traverse(gui.addFolder(field.folder), field.children);
      } else {
        let input;

        if (guiState[field.id] && guiState[field.id][0] === '#') {
          input = level.addColor(guiState, field.id);
        } else {
          input = level.add(guiState, field.id, field.options || field.min, field.max);
        }

        input.name(field.name)
          .onChange(value => {
            if (field.onChange) {
              field.onChange(value);
            }
          });

        if (field.onChange) {
          field.onChange(field.defaultValue);
        }
      }
    });
  };

  traverse(gui, guiBaseFields());
  traverse(gui, guiExtendedFields);
};

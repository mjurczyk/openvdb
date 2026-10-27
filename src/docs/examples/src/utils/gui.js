import GUI from "lil-gui";
import { exampleBbox } from "../examples/bbox";
import { exampleBunny } from "../examples/bunny";
import { exampleClouds } from "../examples/clouds";
import { exampleGLTF } from "../examples/gltf";
import { exampleVDB } from "../examples/vdb";
import { exampleFrame } from "../examples/frame";
import { exampleWVDB } from "../examples/wvdb";
import { scene } from "../main";
import { isPhone } from "./device";

export let gui = new GUI();
export const dropTarget = document.querySelector('#dropzone');

let activeDemo = 'vdb';

export const setActiveDemo = (id) => {
  activeDemo = id;

  dropTarget.style.display = id === 'vdb' ? '' : 'none';
};

const guiBaseFields = () => [
  {
    folder: 'General',
    children: [
      {
        id: 'demo',
        name: 'Example',
        // NOTE Only FrameVolume demos are listed. The other demos stay in examples/ but are hidden.
        options: {
          'Rendering Frame': 'frame',
          'Custom VDB': 'vdb',
          'Streaming WVDB': 'wvdb',
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
            case 'gltf':
              return exampleGLTF({ scene });
            case 'frame':
              return exampleFrame({ scene });
            case 'wvdb':
              return exampleWVDB({ scene });
          }
        }
      }
    ]
  }
];

let guiExtendedFields = [];

// NOTE On phones the GUI starts closed, because it covers most of the screen. A demo change keeps the state.
let guiClosed = isPhone;

export const setGuiFields = (extendedFields) => {
  guiExtendedFields = extendedFields;

  showGui();
};

export const showGui = () => {
  gui.destroy();
  gui = new GUI();
  gui.open(!guiClosed);
  gui.onOpenClose((changedGui) => {
    if (changedGui === gui) {
      guiClosed = gui._closed;
    }
  });

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

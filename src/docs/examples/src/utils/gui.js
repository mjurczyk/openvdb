import GUI from "lil-gui";
import { exampleVDB } from "../examples/vdb";
import { exampleFrame } from "../examples/frame";
import { exampleWVDB } from "../examples/wvdb";
import { exampleMesh } from "../examples/mesh";
import { exampleLevelSet } from "../examples/levelset";
import { exampleSky } from "../examples/sky";
import { scene } from "../main";
import { isPhone } from "./device";
import { loadEnvironment } from "./resources";
import { resetTransformMode } from "./transform";

export let gui = new GUI();
export const dropTarget = document.querySelector('#dropzone');

export let activeDemo = 'vdb';

// NOTE The examples import this module, so the functions are read only when a demo starts
export const demos = {
  vdb: (options) => exampleVDB(options),
  frame: (options) => exampleFrame(options),
  wvdb: (options) => exampleWVDB(options),
  mesh: (options) => exampleMesh(options),
  levelset: (options) => exampleLevelSet(options),
  sky: (options) => exampleSky(options),
};

// NOTE All demos share the environment. A demo change keeps it.
let activeEnvironment = 'desert';

// NOTE These demos start with their own environment
const demoEnvironments = {
  sky: 'desert',
};

// NOTE A demo can set a function that undoes its global changes. A demo change calls it.
let demoCleanup = null;

export const setDemoCleanup = (cleanup) => {
  demoCleanup = cleanup;
};

export const setActiveDemo = (id) => {
  activeDemo = id;
  activeEnvironment = demoEnvironments[id] ?? activeEnvironment;

  dropTarget.style.display = id === 'vdb' ? '' : 'none';
};

const guiBaseFields = () => [
  {
    folder: 'General',
    children: [
      {
        id: 'demo',
        name: 'Example',
        options: {
          'Rendering Frame': 'frame',
          'Custom VDB': 'vdb',
          'Streaming WVDB': 'wvdb',
          'Mesh Volume': 'mesh',
          'Level Set': 'levelset',
          Sky: 'sky',
        },
        defaultValue: activeDemo,
        onChange: (value) => {
          if (value === activeDemo) {
            return;
          }

          activeDemo = value;
          activeEnvironment = demoEnvironments[value] ?? activeEnvironment;

          demoCleanup?.();
          demoCleanup = null;

          resetTransformMode();

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

          return demos[value]?.({ scene });
        }
      },
      {
        id: 'environment',
        name: 'EnvMap',
        options: {
          Desert: 'desert',
          Grassland: 'grassland',
          Shore: 'shore',
          'Town Square': 'townsquare',
          'Sky Cloudy': 'sky-cloudy',
          'Sky Dusk': 'sky-dusk',
          'Sky Midday': 'sky-midday',
          'Sky Night': 'sky-night',
          UV: 'uv-1',
          // NOTE White furnace test (utils/furnace.js)
          'Furnace (test)': 'furnace',
        },
        defaultValue: activeEnvironment,
        onChange: (value) => {
          activeEnvironment = value;

          loadEnvironment(scene, value);
        }
      },
    ]
  }
];

let guiExtendedFields = [];

// NOTE A demo folder named General adds its fields to the General folder, after the Example field
const mergeGeneralFields = (baseFields, extendedFields) => {
  const generalFields = extendedFields
    .filter((field) => field.folder === 'General')
    .flatMap((field) => field.children);

  return [
    ...baseFields.map((field) =>
      field.folder === 'General' ? { ...field, children: [...field.children, ...generalFields] } : field,
    ),
    ...extendedFields.filter((field) => field.folder !== 'General'),
  ];
};

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

      // NOTE A field with onClick is a button
      guiState[field.id] = field.onClick ? () => field.onClick() : field.defaultValue;
    });

    fields.forEach(field => {
      if (field.folder) {
        // NOTE A folder in a folder is a subfolder
        const folder = level.addFolder(field.folder);

        // NOTE closed: true starts the folder collapsed
        if (field.closed) {
          folder.close();
        }

        traverse(folder, field.children);
      } else {
        if (field.onClick) {
          const button = level.add(guiState, field.id).name(field.name);

          if (field.disabled) {
            button.disable();
          }

          return;
        }

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

  traverse(gui, mergeGeneralFields(guiBaseFields(), guiExtendedFields));
};

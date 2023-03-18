import GUI from "lil-gui";

export let gui = new GUI();

const guiBaseFields = [
  {
    folder: 'General',
    children: [
      {
        id: 'demo',
        name: 'Example',
        options: {
          '(0.1.4) Shuttle': 'shuttle',
          '(0.1.3) Lighthouse': 'lighthouse',
          'BBOX': 'bbox',
          'Primitives': 'primitives',
          'Clouds': 'clouds',
          'Transforms': 'transforms',
          'Spotlights': 'spotLights',
          'Temperature': 'temperature',
          'Level Set Mesh': 'levelSetMesh',
          'Level Set LOD': 'levelSetLOD',
          'Property Matrix': 'propertyMatrix',
        },
        defaultValue: 'bbox'
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

  traverse(gui, guiBaseFields);
  traverse(gui, guiExtendedFields);
};

showGui();

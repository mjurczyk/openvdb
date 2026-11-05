import * as OpenVDB from 'three-openvdb';

// NOTE FrameVolume phase props for the demos. The defaults are the FrameVolume defaults, but the phase function is 2HG.
export const phaseParams = {
  phase: 'dual-lobe',
  phaseG: 0.8,
  phaseBackG: -0.3,
  phaseBackWeight: 0.2,
};

// NOTE All demos start with 2HG for 'frame' (Combined) lighting too
OpenVDB.frameRenderer.settings.phase = 'dual-lobe';

// NOTE Phase fields. idPrefix and namePrefix keep the field ids unique.
const createFields = (values, setValue, idPrefix = '', namePrefix = '') => [
  {
    id: `${idPrefix}phase`,
    name: `${namePrefix}Phase Function`,
    defaultValue: values.phase,
    options: {
      Isotropic: 'isotropic',
      HG: 'henyey-greenstein',
      '2HG': 'dual-lobe',
      MIE: 'lorenz-mie',
    },
    onChange: setValue('phase'),
  },
  {
    id: `${idPrefix}phaseG`,
    name: `${namePrefix}Phase G`,
    defaultValue: values.phaseG,
    min: -0.99,
    max: 0.99,
    onChange: setValue('phaseG'),
  },
  {
    id: `${idPrefix}phaseBackG`,
    name: `${namePrefix}Phase Back G`,
    defaultValue: values.phaseBackG,
    min: -0.99,
    max: 0.99,
    onChange: setValue('phaseBackG'),
  },
  {
    id: `${idPrefix}phaseBackWeight`,
    name: `${namePrefix}Phase Back Weight`,
    defaultValue: values.phaseBackWeight,
    min: 0.0,
    max: 1.0,
    onChange: setValue('phaseBackWeight'),
  },
];

// NOTE Volume folder fields: the phase of each FrameVolume, used by 'volume' (Per-volume) lighting.
// No Phase Function field: the demo volumes keep the phase function of phaseParams (2HG).
// setParam applies the value to the volumes of the demo.
export const createPhaseFields = (params, setParam) =>
  createFields(params, setParam).filter((field) => field.id !== 'phase');

// NOTE frameRenderer.settings fields: one phase for all volumes, used by 'frame' (Combined) lighting
export const createFramePhaseFields = () =>
  createFields(
    OpenVDB.frameRenderer.settings,
    (key) => (value) => {
      OpenVDB.frameRenderer.settings[key] = value;
    },
    'frame-',
    'Combined ',
  );

export const applyPhaseParams = (volume, params) => {
  volume.phase = params.phase;
  volume.phaseG = params.phaseG;
  volume.phaseBackG = params.phaseBackG;
  volume.phaseBackWeight = params.phaseBackWeight;
};

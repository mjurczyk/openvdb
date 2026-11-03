// NOTE FrameVolume phase props for the demos. The defaults are the FrameVolume defaults.
export const phaseParams = {
  phase: 'dual-lobe',
  phaseG: 0.8,
  phaseBackG: -0.3,
  phaseBackWeight: 0.2,
};

// NOTE Volume folder fields. setParam applies the value to the volumes of the demo.
export const createPhaseFields = (params, setParam) => [
  {
    id: 'phase',
    name: 'Phase Function',
    defaultValue: params.phase,
    options: {
      Isotropic: 'isotropic',
      'Henyey-Greenstein': 'henyey-greenstein',
      'Dual-lobe': 'dual-lobe',
    },
    onChange: setParam('phase'),
  },
  {
    id: 'phaseG',
    name: 'Phase G',
    defaultValue: params.phaseG,
    min: -0.99,
    max: 0.99,
    onChange: setParam('phaseG'),
  },
  {
    id: 'phaseBackG',
    name: 'Phase Back G',
    defaultValue: params.phaseBackG,
    min: -0.99,
    max: 0.99,
    onChange: setParam('phaseBackG'),
  },
  {
    id: 'phaseBackWeight',
    name: 'Phase Back Weight',
    defaultValue: params.phaseBackWeight,
    min: 0.0,
    max: 1.0,
    onChange: setParam('phaseBackWeight'),
  },
];

export const applyPhaseParams = (volume, params) => {
  volume.phase = params.phase;
  volume.phaseG = params.phaseG;
  volume.phaseBackG = params.phaseBackG;
  volume.phaseBackWeight = params.phaseBackWeight;
};

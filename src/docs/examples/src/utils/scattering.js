import * as OpenVDB from 'three-openvdb';

const setFrameSetting = (key) => (value) => {
  OpenVDB.frameRenderer.settings[key] = value;
};

// NOTE Rendering folder fields of frameRenderer.settings.multipleScattering.
// Off is single scattering: dense volumes get dark inside. Octave fields are used only by Octaves.
export const createMultipleScatteringFields = () => [
  {
    id: 'multipleScattering',
    name: 'Multiple Scattering',
    defaultValue: OpenVDB.frameRenderer.settings.multipleScattering,
    options: {
      Off: false,
      Diffusion: true,
      Octaves: 'octaves',
    },
    onChange: setFrameSetting('multipleScattering'),
  },
  {
    id: 'scatteringOctaves',
    name: 'Octaves',
    defaultValue: OpenVDB.frameRenderer.settings.scatteringOctaves,
    min: 1,
    max: 8,
    onChange: setFrameSetting('scatteringOctaves'),
  },
  {
    id: 'scatteringOctaveExtinction',
    name: 'Octave Extinction',
    defaultValue: OpenVDB.frameRenderer.settings.scatteringOctaveExtinction,
    min: 0.0,
    max: 1.0,
    onChange: setFrameSetting('scatteringOctaveExtinction'),
  },
  {
    id: 'scatteringOctaveContribution',
    name: 'Octave Contribution',
    defaultValue: OpenVDB.frameRenderer.settings.scatteringOctaveContribution,
    min: 0.0,
    max: 1.0,
    onChange: setFrameSetting('scatteringOctaveContribution'),
  },
  {
    id: 'scatteringOctavePhase',
    name: 'Octave Phase',
    defaultValue: OpenVDB.frameRenderer.settings.scatteringOctavePhase,
    min: 0.0,
    max: 1.0,
    onChange: setFrameSetting('scatteringOctavePhase'),
  },
];

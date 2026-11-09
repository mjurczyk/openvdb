import * as OpenVDB from 'three-openvdb';
import { gui } from './gui';

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

// NOTE Measured media of OpenVDB.frameMediumPresets. Custom keeps the current values.
const mediumOptions = {
  Custom: 'custom',
  Cloud: 'cloud',
  Fog: 'fog',
  Ice: 'ice',
  Soot: 'soot',
  'White Smoke': 'white-smoke',
  'Dark Smoke': 'dark-smoke',
  Haze: 'haze',
  Dust: 'dust',
};

// NOTE Spectral folder fields. A medium turns Spectral on and sets Base Color, the Angstrom exponent,
// the volume phase and the Combined phase. Extinction does not change.
export const createSpectralFields = (params, setParam) => [
  {
    id: 'spectral',
    name: 'Spectral',
    defaultValue: OpenVDB.frameRenderer.settings.spectral,
    onChange: (value) => {
      OpenVDB.frameRenderer.settings.spectral = value;
    },
  },
  {
    id: 'medium',
    name: 'Medium',
    defaultValue: 'custom',
    options: mediumOptions,
    onChange: (value) => {
      const props = OpenVDB.getFrameMediumProps(value);

      if (!props) {
        return;
      }

      // NOTE The volume phase has no field. The Phase G change below applies it.
      params.phase = props.phase;

      getController('spectral')?.setValue(true);
      getController('fogColor')?.setValue(`#${props.baseColor.getHexString()}`);
      // NOTE The color field has 8 bits. The volumes get the exact albedo.
      setParam('baseColor')(props.baseColor);
      getController('angstromExponent')?.setValue(props.angstromExponent);
      getController('phaseG')?.setValue(props.phaseG);
      getController('phaseGExponent')?.setValue(props.phaseGExponent);
      getController('frame-phase')?.setValue(props.phase);
      getController('frame-phaseG')?.setValue(props.phaseG);
      getController('frame-phaseGExponent')?.setValue(props.phaseGExponent);
    },
  },
  {
    id: 'angstromExponent',
    name: 'Ångström Exponent',
    defaultValue: params.angstromExponent,
    min: -0.5,
    max: 4.5,
    onChange: setParam('angstromExponent'),
  },
];

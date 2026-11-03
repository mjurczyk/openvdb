import * as Three from 'three';
import { renderer } from '../main';

// NOTE Tone mapping of the demo renderer. The field starts from the current value, so a demo change keeps it.
export const createToneMappingField = () => ({
  id: 'toneMapping',
  name: 'Tone Mapping',
  defaultValue: renderer.toneMapping,
  options: {
    Default: Three.NoToneMapping,
    ACES: Three.ACESFilmicToneMapping,
    'Khronos PBR': Three.NeutralToneMapping,
  },
  onChange: (value) => {
    renderer.toneMapping = value;
  },
});

import { PrimitiveVolume } from './PrimitiveVolume.js';

export class CubeVolume extends PrimitiveVolume {
  constructor() {
    super('CubeVolume');
  }

  getValue(position) {
    // NOTE Cube by default has all leaves enabled
    return 1.0;
  }
}

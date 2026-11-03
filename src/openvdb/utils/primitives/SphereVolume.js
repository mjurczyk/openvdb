import { PrimitiveVolume } from './PrimitiveVolume.js';

export class SphereVolume extends PrimitiveVolume {
  constructor() {
    super('SphereVolume');
  }

  getValue(position) {
    return position.length() <= 0.5 ? 1.0 : 0.0;
  }
}

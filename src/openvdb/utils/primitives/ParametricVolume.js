import { PrimitiveVolume } from './PrimitiveVolume.js';

export class ParametricVolume extends PrimitiveVolume {
  valueFunction;

  constructor(valueFunction) {
    super('ParametricVolume');

    this.valueFunction = valueFunction;
  }

  getValue(position) {
    return this.valueFunction(position);
  }
}

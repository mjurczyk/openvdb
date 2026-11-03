import { Vector3 } from '../../math/vector.js';
import { perlin3Noise, worley3Noise } from '../../math/noise.js';
import { PrimitiveVolume } from './PrimitiveVolume.js';

const scaledNoise = (position, scale, noiseSource) => {
  const scaledX = (position.x * scale) % scale;
  const scaledY = (position.y * scale) % scale;
  const scaledZ = (position.z * scale) % scale;

  const dx = Math.abs(scaledX - 0.5);
  const dy = Math.abs(scaledY - 0.5);
  const dz = Math.abs(scaledZ - 0.5);

  return noiseSource(dx, dy, dz);
};

export class CloudVolume extends PrimitiveVolume {
  height = 1.0;
  density = 0.01;

  constructor({
    height,
    density
  } = {}) {
    super('CloudVolume');

    this.height = height || 1.0;
    this.density = density || 0.01;
  }

  // NOTE Scratch vector for samples
  samplePosition = new Vector3();

  getValue(xyz) {
    const position = this.samplePosition.set(xyz.x + 0.5, xyz.y + 0.5, xyz.z + 0.5);

    if (position.y < this.height) {
      const yOffset = this.height - position.y;

      const noise =
        scaledNoise(position, 20.0, worley3Noise) +
        scaledNoise(position, 100.0, worley3Noise) * 0.25 +
        scaledNoise(position, 10.0, perlin3Noise);

      return noise < this.density
        ? (0.5 +
            scaledNoise(position, 100.0, perlin3Noise) +
            scaledNoise(position, 100.0, worley3Noise)) *
            yOffset
        : 0.0;
    }

    return 0.0;
  }
}

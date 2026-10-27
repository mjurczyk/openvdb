import { floatType } from '../../math/memory';
import { GridDescriptor } from '../../core/GridDescriptor';
import { Vector3 } from '../../math/vector';
import { GridTransform } from '../../core/GridTransform';
import { perlin3Noise, worley3Noise } from '../../math/noise';
import { getUuid } from '../uuid';

const scaledNoise = (position, scale, noiseSource) => {
  const scaledX = (position.x * scale) % scale;
  const scaledY = (position.y * scale) % scale;
  const scaledZ = (position.z * scale) % scale;

  const dx = Math.abs(scaledX - 0.5);
  const dy = Math.abs(scaledY - 0.5);
  const dz = Math.abs(scaledZ - 0.5);

  return noiseSource(dx, dy, dz);
};

export class CloudVolume extends GridDescriptor {
  static halfFloatGridPrefix = GridDescriptor.halfFloatGridPrefix;

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;

  height = 1.0;
  density = 0.01;

  constructor({
    height,
    density
  } = {}) {
    super();

    this.height = height || 1.0;
    this.density = density || 0.01;

    // NOTE Primitives don't need to use OpenVDBReader - just "read grid" right away
    this.readGrid();
  }

  readGrid() {
    this.readGridHeader();
    this.readGridTransform();
  }

  readGridHeader() {
    this.uniqueName = `CloudVolume#${getUuid()}`;
    this.gridName = this.uniqueName.split('#')[0];
    this.gridType = 'fog volume';
  }

  readCompression() {
    /* NOTE Unnecessary */
  }

  readMetadata() {
    /* NOTE Unnecessary */
  }

  getGridValueType() {
    return floatType;
  }

  getGridClass() {
    return 'fog volume';
  }

  readGridTransform() {
    this.transform = new GridTransform();
  }

  readTopology() {
    /* NOTE Unnecessary */
  }

  getWorldBbox() {
    return this.getLocalBbox();
  }

  getLocalBbox() {
    return [new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)];
  }

  getPreciseWorldBbox() {
    return this.getWorldBbox();
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

  getLeafAt(position) {
    return null;
  }
}

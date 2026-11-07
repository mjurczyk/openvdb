import * as Three from 'three/webgpu';
import { Fn, float, ivec2, vec2, vec4, uniform, texture, min, mod, floor } from 'three/tsl';
import { frameFragCoord, frameLoad, frameFullscreenVertex } from './frameShaderChunks.js';

// NOTE Box filter mips of the last world shadow grid cascade, for multipleScattering 'neural' (core/frameNeuralIndirect.js).
// Level k (1 to frameNeuralLevels - 1) has resolution / 2^k voxels on each side. Its z slices are in one row:
// the target is (side * side) x side. Each texel is the mean of 2 x 2 x 2 texels of the level before it.
// The source is the grid atlas (level 1) or the row of the level before.
export class FrameGridMipMaterial extends Three.NodeMaterial {
  constructor() {
    super();

    this.name = 'FrameGridMipMaterial';
    this.frameMipSource = texture(new Three.Texture());
    // NOTE Source: voxels on each side, tile columns, first tile, texture size
    this.frameMipSourceResolution = uniform(1.0);
    this.frameMipSourceColumns = uniform(1.0);
    this.frameMipSourceTile = uniform(0.0);
    this.frameMipSourceSize = uniform(new Three.Vector2(1.0, 1.0));
    this.frameMipResolution = uniform(1.0);

    const sourceResolution = this.frameMipSourceResolution;
    const columns = this.frameMipSourceColumns;

    // NOTE Source texel of voxel (x, y, z), edge voxels clamped
    const loadSource = (x, y, z) => {
      const last = sourceResolution.sub(1.0);
      const tile = this.frameMipSourceTile.add(min(z, last));
      const tileXY = vec2(mod(tile, columns), floor(tile.div(columns)));
      const texel = tileXY.mul(sourceResolution).add(vec2(min(x, last), min(y, last)));

      return frameLoad(this.frameMipSource, ivec2(texel), this.frameMipSourceSize).rg;
    };

    this.vertexNode = frameFullscreenVertex;

    this.colorNode = Fn(() => {
      const resolution = this.frameMipResolution;
      const fragCoord = floor(frameFragCoord(vec2(resolution.mul(resolution), resolution))).toVar();
      const z = floor(fragCoord.x.div(resolution)).toVar();
      const x = fragCoord.x.sub(z.mul(resolution)).toVar();
      const y = fragCoord.y.toVar();
      let sum = vec2(0.0);

      for (let i = 0; i < 8; i++) {
        sum = sum.add(
          loadSource(
            x.mul(2.0).add(float(i & 1)),
            y.mul(2.0).add(float((i >> 1) & 1)),
            z.mul(2.0).add(float((i >> 2) & 1)),
          ),
        );
      }

      return vec4(sum.div(8.0), 0.0, 1.0);
    })();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }
}

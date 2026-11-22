import * as Three from 'three/webgpu';
import { Fn, float, ivec2, vec2, vec4, uniform, texture, clamp, mod, floor } from 'three/tsl';
import { frameFragCoord, frameLoad, frameFullscreenVertex } from './frameShaderChunks.js';

// NOTE Mips of the last world shadow grid cascade, for multipleScattering 'neural' (core/frameNeuralIndirect.js)
// and 'multi-scale'. Level k (1 to frameNeuralLevels - 1) has resolution / 2^k voxels on each side. Its z slices are
// tiles in an atlas (core/frameLayout.js getAtlasLayout), the same as the grid atlas. The source is the grid atlas
// (level 1) or the atlas of the level before. The same as webgl/FrameGridMipMaterial.js.
// NOTE Box (neural, its training data): each texel is the mean of 2 x 2 x 2 texels of the level before it.
// NOTE Binomial (multi-scale): weights 1 3 3 1 on 4 x 4 x 4 texels. Gaussian-like, so coarse levels alias less.
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
    // NOTE Target: voxels on each side, tile columns, texture size
    this.frameMipResolution = uniform(1.0);
    this.frameMipColumns = uniform(1.0);
    this.frameMipSize = uniform(new Three.Vector2(1.0, 1.0));
    this.binomial = false;

    this.vertexNode = frameFullscreenVertex;
    this.buildNodes();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }

  // NOTE true: binomial filter (multi-scale). false: box filter (neural).
  setBinomial(binomial) {
    if (binomial !== this.binomial) {
      this.binomial = binomial;
      this.buildNodes();
      this.needsUpdate = true;
    }
  }

  buildNodes() {
    const sourceResolution = this.frameMipSourceResolution;
    const columns = this.frameMipSourceColumns;

    // NOTE Source texel of voxel (x, y, z), edge voxels clamped
    const loadSource = (x, y, z) => {
      const last = sourceResolution.sub(1.0);
      const tile = this.frameMipSourceTile.add(clamp(z, 0.0, last));
      const tileXY = vec2(mod(tile, columns), floor(tile.div(columns)));
      const texel = tileXY
        .mul(sourceResolution)
        .add(vec2(clamp(x, 0.0, last), clamp(y, 0.0, last)));

      return frameLoad(this.frameMipSource, ivec2(texel), this.frameMipSourceSize).rg;
    };

    this.colorNode = Fn(() => {
      const resolution = this.frameMipResolution;
      const fragCoord = floor(frameFragCoord(this.frameMipSize)).toVar();
      const tile = floor(fragCoord.div(resolution)).toVar();
      const z = tile.y.mul(this.frameMipColumns).add(tile.x).toVar();
      const x = fragCoord.x.sub(tile.x.mul(resolution)).toVar();
      const y = fragCoord.y.sub(tile.y.mul(resolution)).toVar();
      let sum = vec2(0.0);

      // NOTE Taps 2x - 1 to 2x + 2 on each axis, weights 1 3 3 1 (sum 8, 512 for 3 axes)
      if (this.binomial) {
        const weights = [1, 3, 3, 1];

        for (let i = 0; i < 64; i++) {
          const [tx, ty, tz] = [i & 3, (i >> 2) & 3, (i >> 4) & 3];

          sum = sum.add(
            loadSource(
              x.mul(2.0).add(float(tx - 1)),
              y.mul(2.0).add(float(ty - 1)),
              z.mul(2.0).add(float(tz - 1)),
            ).mul(float(weights[tx] * weights[ty] * weights[tz])),
          );
        }

        return vec4(sum.div(512.0), 0.0, 1.0);
      }

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
  }
}

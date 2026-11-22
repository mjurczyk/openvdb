import * as Three from 'three';

// NOTE Mips of the last world shadow grid cascade, for multipleScattering 'neural' (core/frameNeuralIndirect.js)
// and 'multi-scale'. Level k (1 to frameNeuralLevels - 1) has resolution / 2^k voxels on each side. Its z slices are
// tiles in an atlas (core/frameLayout.js getAtlasLayout), the same as the grid atlas. The source is the grid atlas
// (level 1) or the atlas of the level before. The same as webgpu/FrameGridMipMaterial.js.
// NOTE Box (neural, its training data): each texel is the mean of 2 x 2 x 2 texels of the level before it.
// NOTE Binomial (multi-scale): weights 1 3 3 1 on 4 x 4 x 4 texels. Gaussian-like, so coarse levels alias less.

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D frameMipSource;
  // NOTE Source: voxels on each side, tile columns, first tile
  uniform float frameMipSourceResolution;
  uniform float frameMipSourceColumns;
  uniform float frameMipSourceTile;
  // NOTE Target: voxels on each side, tile columns
  uniform float frameMipResolution;
  uniform float frameMipColumns;

  // NOTE Source texel of voxel (x, y, z), edge voxels clamped
  vec2 frameLoadSource(float x, float y, float z) {
    float last = frameMipSourceResolution - 1.0;
    float tile = frameMipSourceTile + clamp(z, 0.0, last);
    vec2 tileXY = vec2(mod(tile, frameMipSourceColumns), floor(tile / frameMipSourceColumns));
    vec2 texel = tileXY * frameMipSourceResolution + clamp(vec2(x, y), 0.0, last);

    return texelFetch(frameMipSource, ivec2(texel), 0).rg;
  }

  out highp vec4 frameMip;

  void main() {
    vec2 fragCoord = floor(gl_FragCoord.xy);
    vec2 tile = floor(fragCoord / frameMipResolution);
    float z = tile.y * frameMipColumns + tile.x;
    float x = fragCoord.x - tile.x * frameMipResolution;
    float y = fragCoord.y - tile.y * frameMipResolution;
    vec2 sum = vec2(0.0);

    #ifdef FRAME_MIP_BINOMIAL
      // NOTE Taps 2x - 1 to 2x + 2 on each axis, weights 1 3 3 1 (sum 8, 512 for 3 axes)
      for (int i = 0; i < 64; i++) {
        ivec3 tap = ivec3(i & 3, (i >> 2) & 3, (i >> 4) & 3);
        vec3 weights = vec3(tap.x == 1 || tap.x == 2 ? 3.0 : 1.0, tap.y == 1 || tap.y == 2 ? 3.0 : 1.0, tap.z == 1 || tap.z == 2 ? 3.0 : 1.0);

        sum += weights.x * weights.y * weights.z * frameLoadSource(
          x * 2.0 - 1.0 + float(tap.x),
          y * 2.0 - 1.0 + float(tap.y),
          z * 2.0 - 1.0 + float(tap.z)
        );
      }

      frameMip = vec4(sum / 512.0, 0.0, 1.0);
    #else
      for (int i = 0; i < 8; i++) {
        sum += frameLoadSource(
          x * 2.0 + float(i & 1),
          y * 2.0 + float((i >> 1) & 1),
          z * 2.0 + float((i >> 2) & 1)
        );
      }

      frameMip = vec4(sum / 8.0, 0.0, 1.0);
    #endif
  }
`;

export class FrameGridMipMaterial extends Three.ShaderMaterial {
  name = 'FrameGridMipMaterial';

  constructor() {
    super({
      glslVersion: Three.GLSL3,
      uniforms: {
        frameMipSource: { value: null },
        frameMipSourceResolution: { value: 1.0 },
        frameMipSourceColumns: { value: 1.0 },
        frameMipSourceTile: { value: 0.0 },
        frameMipResolution: { value: 1.0 },
        frameMipColumns: { value: 1.0 },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      blending: Three.NoBlending,
    });

    this.binomial = false;
  }

  // NOTE true: binomial filter (multi-scale). false: box filter (neural).
  setBinomial(binomial) {
    if (binomial !== this.binomial) {
      this.binomial = binomial;
      this.defines = binomial ? { FRAME_MIP_BINOMIAL: '' } : {};
      this.needsUpdate = true;
    }
  }
}

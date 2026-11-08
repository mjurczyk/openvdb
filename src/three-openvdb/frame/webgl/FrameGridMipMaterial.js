import * as Three from 'three';

// NOTE Box filter mips of the last world shadow grid cascade, for multipleScattering 'neural' (core/frameNeuralIndirect.js).
// Level k (1 to frameNeuralLevels - 1) has resolution / 2^k voxels on each side. Its z slices are tiles in an atlas
// (core/frameLayout.js getAtlasLayout), the same as the grid atlas. Each texel is the mean of 2 x 2 x 2 texels of the
// level before it. The source is the grid atlas (level 1) or the atlas of the level before. The same as
// webgpu/FrameGridMipMaterial.js.

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
    float tile = frameMipSourceTile + min(z, last);
    vec2 tileXY = vec2(mod(tile, frameMipSourceColumns), floor(tile / frameMipSourceColumns));
    vec2 texel = tileXY * frameMipSourceResolution + vec2(min(x, last), min(y, last));

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

    for (int i = 0; i < 8; i++) {
      sum += frameLoadSource(
        x * 2.0 + float(i & 1),
        y * 2.0 + float((i >> 1) & 1),
        z * 2.0 + float((i >> 2) & 1)
      );
    }

    frameMip = vec4(sum / 8.0, 0.0, 1.0);
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
  }
}

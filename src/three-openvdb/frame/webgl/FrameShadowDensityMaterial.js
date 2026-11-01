import * as Three from 'three';
import { volumePars, gridPars, tileQuadVertexShader, createVolumeUniforms } from './frameShaderChunks.js';

const fragmentShader = `
  precision highp float;

  layout(location = 0) out highp vec4 frameShadowDensity;

  ${volumePars}
  ${gridPars}

  void main() {
    vec3 gridUvw;
    int cascade = frameGetGridCell(gl_FragCoord.xy, gridUvw);

    if (cascade >= frameGridCount) {
      discard;
    }

    vec3 worldPosition = frameGridMin[cascade] + gridUvw * frameGridSize[cascade];
    vec3 localPosition = (frameWorldToLocal * vec4(worldPosition, 1.0)).xyz;

    if (!frameInsideBox(localPosition)) {
      discard;
    }

    vec3 voxel = frameGridVoxel[cascade];
    float voxelSize = max(voxel.x, max(voxel.y, voxel.z));
    float lod = frameLod(voxelSize / frameWorldScale);

    // NOTE Absorbance scales the shadow of this volume, not its look from the camera
    float extinction = frameSampleExtinction(localPosition, lod) * frameAbsorbance;

    if (extinction <= 0.0) {
      discard;
    }

    frameShadowDensity = vec4(extinction, 0.0, 0.0, 0.0);
  }
`;

// NOTE Writes the extinction of one volume into one cascade of the world-space shadow grid
export class FrameShadowDensityMaterial extends Three.ShaderMaterial {
  name = 'FrameShadowDensityMaterial';

  constructor(sharedUniforms) {
    super({
      glslVersion: Three.GLSL3,
      uniforms: {
        ...sharedUniforms,
        ...createVolumeUniforms(),
        frameRect: { value: new Three.Vector4() },
        frameSliceStart: { value: 0.0 },
      },
      vertexShader: tileQuadVertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: Three.CustomBlending,
      blendEquation: Three.AddEquation,
      blendSrc: Three.OneFactor,
      blendDst: Three.OneFactor,
      blendSrcAlpha: Three.OneFactor,
      blendDstAlpha: Three.OneFactor,
    });
  }
}

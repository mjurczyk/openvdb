import * as Three from 'three';
import {
  volumePars,
  gridPars,
  shadowPars,
  tileQuadVertexShader,
  createVolumeUniforms,
} from './frameShaderChunks.js';

const fragmentShader = `
  precision highp float;

  layout(location = 0) out highp vec4 frameShadowDensity;

  // NOTE Spectral: targets (extinction rgb, 0) and (absorption rgb, 0)
  #ifdef FRAME_SPECTRAL
    layout(location = 1) out highp vec4 frameShadowAbsorptionOutput;
  #endif

  ${volumePars}
  ${gridPars}
  ${shadowPars}

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

    #ifdef FRAME_SPECTRAL
      // NOTE Absorption is the part that the albedo of each channel does not scatter
      vec3 spectralExtinction = frameExtinctionSpectrum * extinction;
      vec3 albedo = clamp(frameSampleAlbedo(localPosition, lod), 0.0, 1.0);

      frameShadowDensity = vec4(spectralExtinction, 0.0);
      frameShadowAbsorptionOutput = vec4(spectralExtinction * (1.0 - albedo), 0.0);
    #else
      frameShadowDensity = vec4(
        extinction,
        frameShadowAbsorption(extinction, frameSampleAlbedo(localPosition, lod)),
        0.0,
        0.0
      );
    #endif
  }
`;

// NOTE Writes the extinction and absorption of one volume into one cascade of the world-space shadow grid.
// NOTE Absorption limits multiple scattering in the shadow marches. Dark volumes keep sharp shadows.
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

    // NOTE frameRenderer.settings.spectral: two targets
    this.spectral = false;
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.defines = spectral ? { FRAME_SPECTRAL: '' } : {};
      this.needsUpdate = true;
    }
  }
}

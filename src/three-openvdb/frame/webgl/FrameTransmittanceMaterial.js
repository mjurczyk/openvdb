import * as Three from 'three';
import { gridPars, noisePars, shadowPars } from './frameShaderChunks.js';

// NOTE Light slots: sky up, sky down, then 6 lights. Targets 0 and 1: total transmittance of all slots.
// NOTE Targets 2 and 3: direct transmittance of the 6 lights. Then the lighting gives the phase only to the direct light.
// NOTE Scattering octaves: targets 0 and 1 have 1 / (1 + optical depth), see frameShadowTransmittance. 1.0 is no shadow.
// NOTE Scene lights take the first slots. The dominant directional environment light takes the next free slot.
export const frameShadowLightSlots = 6;

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  #define FRAME_SHADOW_SLOTS ${frameShadowLightSlots}
  #define FRAME_MAX_SHADOW_STEPS 1024

  layout(location = 0) out highp vec4 frameTransmittance0;
  layout(location = 1) out highp vec4 frameTransmittance1;
  layout(location = 2) out highp vec4 frameTransmittance2;
  layout(location = 3) out highp vec4 frameTransmittance3;

  ${gridPars}
  ${noisePars}
  ${shadowPars}

  uniform sampler2D frameShadowDensityMap;
  uniform vec3 frameSkyDirection;
  uniform vec4 frameShadowLights[FRAME_SHADOW_SLOTS];
  uniform int frameShadowLightCount;

  // NOTE (extinction, absorption)
  vec2 frameGridExtinction(vec3 worldPosition) {
    int cascade = frameFindCascade(worldPosition, 0);

    if (cascade < 0) {
      return vec2(0.0);
    }

    return frameSampleGrid(frameShadowDensityMap, cascade, frameGridUvw(cascade, worldPosition)).rg;
  }

  // NOTE Each step moves one voxel of the finest cascade at the probe, on the fastest axis of the direction.
  // The march goes to coarser cascades when it leaves a fine cascade.
  // NOTE Returns (direct, total, reduced depth, effective depth). Sky up and down use z and w for the diffusion total.
  vec4 frameMarch(vec3 origin, vec3 direction, float maxDistance, float jitter) {
    vec3 depths = vec3(0.0);
    float traveled = 0.0;
    vec3 probe = origin;

    for (int i = 0; i < FRAME_MAX_SHADOW_STEPS; i++) {
      int cascade = frameFindCascade(probe, 0);

      if (cascade < 0 || traveled >= maxDistance || frameShadowMarchDepth(depths) > 6.0) {
        break;
      }

      vec3 voxelsPerUnit = abs(direction) / frameGridVoxel[cascade];
      float stepLength = 1.0 / max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z));

      stepLength = min(stepLength, maxDistance - traveled);

      vec2 extinction = frameGridExtinction(probe + direction * stepLength * jitter);

      depths += frameShadowStep(extinction.x, extinction.y) * stepLength;
      probe += direction * stepLength;
      traveled += stepLength;
    }

    return vec4(frameShadowTransmittance(depths), depths.z, depths.y);
  }

  // NOTE Sky up and down are isotropic, and opposite. Diffusion: two-sided total (frameIsotropicDiffusion).
  float frameSkyTotal(vec4 front, vec4 back) {
    if (frameMultipleScattering > 0.0) {
      return frameIsotropicDiffusion(front.z, back.z, front.w);
    }

    return front.y;
  }

  vec2 frameLightTransmittance(int slot, vec3 worldPosition, float jitter) {
    if (slot >= frameShadowLightCount) {
      return vec2(1.0);
    }

    vec4 light = frameShadowLights[slot];

    // NOTE w is 1.0 for a light direction, 2.0 for a light position
    if (light.w < 1.5) {
      return frameMarch(worldPosition, normalize(light.xyz), 1e20, jitter).xy;
    }

    vec3 toLight = light.xyz - worldPosition;

    return frameMarch(worldPosition, normalize(toLight), length(toLight), jitter).xy;
  }

  void main() {
    vec3 gridUvw;
    int cascade = frameGetGridCell(gl_FragCoord.xy, gridUvw);

    if (cascade >= frameGridCount) {
      frameTransmittance0 = vec4(1.0);
      frameTransmittance1 = vec4(1.0);
      frameTransmittance2 = vec4(1.0);
      frameTransmittance3 = vec4(1.0);

      return;
    }

    vec3 worldPosition = frameGridMin[cascade] + gridUvw * frameGridSize[cascade];

    // NOTE Skip voxels with no extinction near them. The lighting pass does not read them.
    float nearExtinction = 0.0;

    for (int i = 0; i < 8; i++) {
      vec3 corner = vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1)) - 0.5;

      nearExtinction += frameGridExtinction(worldPosition + corner * frameGridVoxel[cascade]).x;
    }

    if (nearExtinction <= 0.0) {
      frameTransmittance0 = vec4(1.0);
      frameTransmittance1 = vec4(1.0);
      frameTransmittance2 = vec4(1.0);
      frameTransmittance3 = vec4(1.0);

      return;
    }

    float jitter = frameNoise(gl_FragCoord.xy);

    vec2 light0 = frameLightTransmittance(0, worldPosition, jitter);
    vec2 light1 = frameLightTransmittance(1, worldPosition, jitter);
    vec2 light2 = frameLightTransmittance(2, worldPosition, jitter);
    vec2 light3 = frameLightTransmittance(3, worldPosition, jitter);
    vec2 light4 = frameLightTransmittance(4, worldPosition, jitter);
    vec2 light5 = frameLightTransmittance(5, worldPosition, jitter);

    vec4 skyUp = frameMarch(worldPosition, frameSkyDirection, 1e20, jitter);
    vec4 skyDown = frameMarch(worldPosition, -frameSkyDirection, 1e20, jitter);

    frameTransmittance0 = vec4(frameSkyTotal(skyUp, skyDown), frameSkyTotal(skyDown, skyUp), light0.y, light1.y);
    frameTransmittance1 = vec4(light2.y, light3.y, light4.y, light5.y);
    frameTransmittance2 = vec4(light0.x, light1.x, light2.x, light3.x);
    frameTransmittance3 = vec4(light4.x, light5.x, 1.0, 1.0);
  }
`;

// NOTE Transmittance from each grid voxel to each light, through the combined extinction of all volumes
export class FrameTransmittanceMaterial extends Three.ShaderMaterial {
  name = 'FrameTransmittanceMaterial';

  constructor(sharedUniforms) {
    super({
      glslVersion: Three.GLSL3,
      uniforms: {
        ...sharedUniforms,
        frameShadowDensityMap: { value: null },
        frameSkyDirection: { value: new Three.Vector3(0.0, 1.0, 0.0) },
        frameShadowLights: {
          value: Array.from({ length: frameShadowLightSlots }, () => new Three.Vector4()),
        },
        frameShadowLightCount: { value: 0 },
        // NOTE Multiple scattering of frameRenderer.settings (core/framePhase.js). 0.0 is single scattering.
        frameMultipleScattering: { value: 0.0 },
        // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
        frameScatteringOctaves: { value: new Three.Vector4() },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      blending: Three.NoBlending,
    });
  }
}

import * as Three from 'three';
import { gridPars, noisePars } from './frameShaderChunks.js';

// NOTE Light slots: sky up, sky down, then 6 lights. Two render targets with 4 channels each.
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

  ${gridPars}
  ${noisePars}

  uniform sampler2D frameShadowDensityMap;
  uniform vec3 frameSkyDirection;
  uniform vec4 frameShadowLights[FRAME_SHADOW_SLOTS];
  uniform int frameShadowLightCount;

  float frameGridExtinction(vec3 worldPosition) {
    int cascade = frameFindCascade(worldPosition, 0);

    if (cascade < 0) {
      return 0.0;
    }

    return frameSampleGrid(frameShadowDensityMap, cascade, frameGridUvw(cascade, worldPosition)).r;
  }

  // NOTE Each step moves one voxel of the finest cascade at the probe, on the fastest axis of the direction.
  // The march goes to coarser cascades when it leaves a fine cascade.
  float frameMarch(vec3 origin, vec3 direction, float maxDistance, float jitter) {
    float opticalDepth = 0.0;
    float traveled = 0.0;
    vec3 probe = origin;

    for (int i = 0; i < FRAME_MAX_SHADOW_STEPS; i++) {
      int cascade = frameFindCascade(probe, 0);

      if (cascade < 0 || traveled >= maxDistance || opticalDepth > 6.0) {
        break;
      }

      vec3 voxelsPerUnit = abs(direction) / frameGridVoxel[cascade];
      float stepLength = 1.0 / max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z));

      stepLength = min(stepLength, maxDistance - traveled);

      opticalDepth += frameGridExtinction(probe + direction * stepLength * jitter) * stepLength;
      probe += direction * stepLength;
      traveled += stepLength;
    }

    return exp(-opticalDepth);
  }

  float frameLightTransmittance(int slot, vec3 worldPosition, float jitter) {
    if (slot >= frameShadowLightCount) {
      return 1.0;
    }

    vec4 light = frameShadowLights[slot];

    // NOTE w is 1.0 for a light direction, 2.0 for a light position
    if (light.w < 1.5) {
      return frameMarch(worldPosition, normalize(light.xyz), 1e20, jitter);
    }

    vec3 toLight = light.xyz - worldPosition;

    return frameMarch(worldPosition, normalize(toLight), length(toLight), jitter);
  }

  void main() {
    vec3 gridUvw;
    int cascade = frameGetGridCell(gl_FragCoord.xy, gridUvw);

    if (cascade >= frameGridCount) {
      frameTransmittance0 = vec4(1.0);
      frameTransmittance1 = vec4(1.0);

      return;
    }

    vec3 worldPosition = frameGridMin[cascade] + gridUvw * frameGridSize[cascade];

    // NOTE Skip voxels with no extinction near them. The lighting pass does not read them.
    float nearExtinction = 0.0;

    for (int i = 0; i < 8; i++) {
      vec3 corner = vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1)) - 0.5;

      nearExtinction += frameGridExtinction(worldPosition + corner * frameGridVoxel[cascade]);
    }

    if (nearExtinction <= 0.0) {
      frameTransmittance0 = vec4(1.0);
      frameTransmittance1 = vec4(1.0);

      return;
    }

    float jitter = frameNoise(gl_FragCoord.xy);

    frameTransmittance0 = vec4(
      frameMarch(worldPosition, frameSkyDirection, 1e20, jitter),
      frameMarch(worldPosition, -frameSkyDirection, 1e20, jitter),
      frameLightTransmittance(0, worldPosition, jitter),
      frameLightTransmittance(1, worldPosition, jitter)
    );

    frameTransmittance1 = vec4(
      frameLightTransmittance(2, worldPosition, jitter),
      frameLightTransmittance(3, worldPosition, jitter),
      frameLightTransmittance(4, worldPosition, jitter),
      frameLightTransmittance(5, worldPosition, jitter)
    );
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
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      blending: Three.NoBlending,
    });
  }
}

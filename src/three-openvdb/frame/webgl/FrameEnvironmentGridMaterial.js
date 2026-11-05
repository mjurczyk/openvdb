import * as Three from 'three';
import { gridPars, environmentPars, environmentGridPars, shadowPars } from './frameShaderChunks.js';
import { frameMaxEnvironmentLights } from '../core/frameEnvironment.js';

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  #define FRAME_MAX_STEPS 1024

  ${gridPars}
  ${environmentPars}
  ${environmentGridPars}
  ${shadowPars}

  uniform sampler2D frameShadowDensityMap;
  uniform int frameLightCount;
  uniform vec3 frameLightDirections[FRAME_MAX_ENVIRONMENT_LIGHTS];
  uniform vec3 frameLightColors[FRAME_MAX_ENVIRONMENT_LIGHTS];

  // NOTE (extinction, absorption)
  vec2 frameExtinctionAt(vec3 gridUvw) {
    return frameSampleGrid(frameShadowDensityMap, frameEnvironmentGridCascade, gridUvw).rg;
  }

  void main() {
    int cascade = frameEnvironmentGridCascade;
    float resolution = frameGridResolution;
    vec2 tile = floor(gl_FragCoord.xy / resolution);
    float z = tile.y * frameEnvironmentGridColumns + tile.x;
    vec3 gridUvw = vec3(gl_FragCoord.xy - tile * resolution, z + 0.5) / resolution;
    vec3 voxel = frameGridVoxel[cascade];
    vec3 gridMin = frameGridMin[cascade];
    vec3 gridSize = frameGridSize[cascade];
    vec3 worldPosition = gridMin + gridUvw * gridSize;

    // NOTE Octaves: unshadowed light also gets the octaves
    gl_FragColor = vec4(frameEnvironmentUnshadowed * frameShadowTotal(1.0), 1.0);

    if (z >= resolution) {
      return;
    }

    // NOTE Skip voxels with no extinction near them. The density pass does not read them.
    float nearExtinction = 0.0;

    for (int i = 0; i < 8; i++) {
      vec3 corner = vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1)) - 0.5;

      nearExtinction += frameExtinctionAt((worldPosition + corner * voxel - gridMin) / gridSize).x;
    }

    if (nearExtinction <= 0.0) {
      return;
    }

    vec3 irradiance = vec3(0.0);

    for (int i = 0; i < FRAME_MAX_ENVIRONMENT_LIGHTS; i++) {
      if (i >= frameLightCount) {
        break;
      }

      vec3 direction = frameLightDirections[i];
      vec3 voxelsPerUnit = abs(direction) / voxel;
      float stepLength = 1.0 / max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z));
      vec3 marchStep = direction * stepLength;
      vec3 probe = worldPosition + marchStep * 0.5;
      vec3 depths = vec3(0.0);

      for (int j = 0; j < FRAME_MAX_STEPS; j++) {
        vec3 uvw = (probe - gridMin) / gridSize;

        if (any(lessThan(uvw, vec3(0.0))) || any(greaterThan(uvw, vec3(1.0))) || frameShadowMarchDepth(depths) > 6.0) {
          break;
        }

        vec2 extinction = frameExtinctionAt(uvw);

        depths += frameShadowStep(extinction.x, extinction.y) * stepLength;
        probe += marchStep;
      }

      // NOTE Environment lights are isotropic: total transmittance, no phase
      irradiance += frameLightColors[i] * frameShadowTotal(frameShadowTransmittance(depths).y);
    }

    gl_FragColor = vec4(max(irradiance, vec3(0.0)), 1.0);
  }
`;

// NOTE Environment light of each voxel of the last shadow grid cascade, from the environment lights with no shadow slot.
// NOTE Sum of color * transmittance. The march stays in the last cascade, with one voxel steps.
// NOTE The last cascade fits all casters and does not follow the camera.
// NOTE The renderer draws this pass only when the casters or the environment lights change.
export class FrameEnvironmentGridMaterial extends Three.ShaderMaterial {
  name = 'FrameEnvironmentGridMaterial';

  constructor(sharedUniforms) {
    super({
      uniforms: {
        ...sharedUniforms,
        frameShadowDensityMap: { value: null },
        frameLightCount: { value: 0 },
        frameLightDirections: {
          value: Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3(0.0, 1.0, 0.0)),
        },
        frameLightColors: {
          value: Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3()),
        },
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

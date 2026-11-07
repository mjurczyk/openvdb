import * as Three from 'three';
import { gridPars, noisePars, shadowPars, spectralPars } from './frameShaderChunks.js';
import { neuralPars } from './frameNeuralChunks.js';
import { frameNeuralLevels } from '../core/frameNeuralIndirect.js';

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

// NOTE The network code is in the source only when it is used (neural)
const createFragmentShader = (neural) => `
  precision highp float;

  #define FRAME_SHADOW_SLOTS ${frameShadowLightSlots}
  #define FRAME_MAX_SHADOW_STEPS 1024

  layout(location = 0) out highp vec4 frameTransmittance0;
  layout(location = 1) out highp vec4 frameTransmittance1;
  layout(location = 2) out highp vec4 frameTransmittance2;

  // NOTE Spectral: 3 targets of one slot group (core/frameSpectrum.js)
  #ifndef FRAME_SPECTRAL
    layout(location = 3) out highp vec4 frameTransmittance3;
  #endif

  ${gridPars}
  ${noisePars}
  ${shadowPars}
  ${spectralPars}

  uniform sampler2D frameShadowDensityMap;
  uniform vec3 frameSkyDirection;
  uniform vec4 frameShadowLights[FRAME_SHADOW_SLOTS];
  uniform int frameShadowLightCount;

  // NOTE multipleScattering 'neural' (not spectral): scattered light of the light slots from the network.
  // frameMarch writes the direct optical depth to frameMarchOpticalDepth. Local inputs are the same for all slots.
  #ifdef FRAME_NEURAL
    ${neural ? neuralPars : ''}

    float frameMarchOpticalDepth;
    vec4 frameNeuralLocal0;
    vec4 frameNeuralLocal1;
  #endif

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

    #ifdef FRAME_NEURAL
      frameMarchOpticalDepth = depths.x;
    #endif

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
    vec3 toLight = light.xyz - worldPosition;
    // NOTE w is 1.0 for a light direction, 2.0 for a light position
    bool isDirection = light.w < 1.5;
    vec3 direction = isDirection ? normalize(light.xyz) : normalize(toLight);
    vec4 front = frameMarch(worldPosition, direction, isDirection ? 1e20 : length(toLight), jitter);
    vec2 shadow = front.xy;

    // NOTE Two-sided: diffusion of the slab between the light side and the far side (frameTwoSidedDiffusion)
    if (frameTwoSided > 0.5) {
      vec4 back = frameMarch(worldPosition, -direction, 1e20, jitter);

      shadow.y = frameTwoSidedDiffusion(front.x, front.z, front.w, back.z);
    }

    // NOTE Neural: total is direct + the network light
    #ifdef FRAME_NEURAL
      shadow.y = shadow.x + frameNeuralLight(worldPosition, direction, frameMarchOpticalDepth, frameNeuralLocal0, frameNeuralLocal1);
    #endif

    return shadow;
  }

  #ifdef FRAME_SPECTRAL
    // NOTE Spectral: the absorption target of the grid, and the slot group of this pass (core/frameSpectrum.js).
    // The renderer draws this pass one time for each group in use, into its own targets.
    uniform sampler2D frameShadowAbsorptionMap;
    uniform int frameSpectralGroup;

    // NOTE The same march as frameMarch, with the depths of each channel. Stops when all channels are dark.
    FrameSpectralDepths frameSpectralMarchDepths(vec3 origin, vec3 direction, float maxDistance, float jitter) {
      FrameSpectralDepths depths = FrameSpectralDepths(vec3(0.0), vec3(0.0), vec3(0.0));
      float traveled = 0.0;
      vec3 probe = origin;

      for (int i = 0; i < FRAME_MAX_SHADOW_STEPS; i++) {
        int cascade = frameFindCascade(probe, 0);

        if (cascade < 0 || traveled >= maxDistance || frameMinComponent(frameSpectralShadowMarchDepth(depths)) > 6.0) {
          break;
        }

        vec3 voxelsPerUnit = abs(direction) / frameGridVoxel[cascade];
        float stepLength = 1.0 / max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z));

        stepLength = min(stepLength, maxDistance - traveled);

        vec3 samplePosition = probe + direction * stepLength * jitter;
        int sampleCascade = frameFindCascade(samplePosition, 0);

        if (sampleCascade >= 0) {
          vec3 uvw = frameGridUvw(sampleCascade, samplePosition);
          FrameSpectralDepths marchDepths = frameSpectralShadowStep(
            frameSampleGrid(frameShadowDensityMap, sampleCascade, uvw).rgb,
            frameSampleGrid(frameShadowAbsorptionMap, sampleCascade, uvw).rgb
          );

          depths.extinction += marchDepths.extinction * stepLength;
          depths.effective += marchDepths.effective * stepLength;
          depths.reduced += marchDepths.reduced * stepLength;
        }

        probe += direction * stepLength;
        traveled += stepLength;
      }

      return depths;
    }

    FrameSpectralShadow frameSpectralMarch(bool enabled, vec3 origin, vec3 direction, float maxDistance, float jitter) {
      if (!enabled) {
        return FrameSpectralShadow(vec3(1.0), vec3(1.0));
      }

      return frameSpectralShadowTransmittance(frameSpectralMarchDepths(origin, direction, maxDistance, jitter));
    }

    // NOTE Sky up and down are isotropic, and opposite. Diffusion: two-sided total of each channel (frameIsotropicDiffusion).
    vec3 frameSpectralSkyTotal(FrameSpectralDepths front, FrameSpectralDepths back) {
      if (frameMultipleScattering > 0.0) {
        return frameIsotropicDiffusion(front.reduced, back.reduced, front.effective);
      }

      return frameSpectralShadowTransmittance(front).total;
    }

    // NOTE March of a light slot. Slot 6 (group 3) is off.
    FrameSpectralShadow frameSpectralLightMarch(bool enabled, int slot, vec3 worldPosition, float jitter) {
      if (!enabled || slot >= frameShadowLightCount || slot >= FRAME_SHADOW_SLOTS) {
        return FrameSpectralShadow(vec3(1.0), vec3(1.0));
      }

      vec4 light = frameShadowLights[slot];
      vec3 toLight = light.xyz - worldPosition;
      // NOTE w is 1.0 for a light direction, 2.0 for a light position
      bool isDirection = light.w < 1.5;
      vec3 direction = isDirection ? normalize(light.xyz) : normalize(toLight);
      FrameSpectralDepths front = frameSpectralMarchDepths(worldPosition, direction, isDirection ? 1e20 : length(toLight), jitter);
      FrameSpectralShadow shadow = frameSpectralShadowTransmittance(front);

      // NOTE Two-sided: diffusion of the slab between the light side and the far side, for each channel
      if (frameTwoSided > 0.5) {
        FrameSpectralDepths back = frameSpectralMarchDepths(worldPosition, -direction, 1e20, jitter);

        shadow.total = frameTwoSidedDiffusion(shadow.direct, front.reduced, front.effective, back.reduced);
      }

      return shadow;
    }

    void main() {
      frameTransmittance0 = vec4(1.0);
      frameTransmittance1 = vec4(1.0);
      frameTransmittance2 = vec4(1.0);

      vec3 gridUvw;
      int cascade = frameGetGridCell(gl_FragCoord.xy, gridUvw);

      if (cascade >= frameGridCount) {
        return;
      }

      vec3 worldPosition = frameGridMin[cascade] + gridUvw * frameGridSize[cascade];

      // NOTE Skip voxels with no extinction near them. The lighting pass does not read them.
      float nearExtinction = 0.0;

      for (int i = 0; i < 8; i++) {
        vec3 corner = vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1)) - 0.5;
        vec3 position = worldPosition + corner * frameGridVoxel[cascade];
        int nearCascade = frameFindCascade(position, 0);

        if (nearCascade >= 0) {
          nearExtinction += dot(frameSampleGrid(frameShadowDensityMap, nearCascade, frameGridUvw(nearCascade, position)).rgb, vec3(1.0));
        }
      }

      if (nearExtinction <= 0.0) {
        return;
      }

      float jitter = frameNoise(gl_FragCoord.xy);
      bool isSkyGroup = frameSpectralGroup == 0;
      int slotA = frameSpectralGroup * 2 - 1;

      // NOTE Group 0: sky up, sky down, slot 0. Other groups: slots 2g - 1 and 2g.
      vec3 skyUpTotal = vec3(1.0);
      vec3 skyDownTotal = vec3(1.0);

      if (isSkyGroup) {
        FrameSpectralDepths skyUp = frameSpectralMarchDepths(worldPosition, frameSkyDirection, 1e20, jitter);
        FrameSpectralDepths skyDown = frameSpectralMarchDepths(worldPosition, -frameSkyDirection, 1e20, jitter);

        skyUpTotal = frameSpectralSkyTotal(skyUp, skyDown);
        skyDownTotal = frameSpectralSkyTotal(skyDown, skyUp);
      }

      FrameSpectralShadow first = frameSpectralLightMarch(!isSkyGroup, max(slotA, 0), worldPosition, jitter);
      FrameSpectralShadow second = frameSpectralLightMarch(true, isSkyGroup ? 0 : slotA + 1, worldPosition, jitter);

      // NOTE Entries (x, y): sky (up, down) or a slot (total, direct)
      vec3 ax = isSkyGroup ? skyUpTotal : first.total;
      vec3 ay = isSkyGroup ? skyDownTotal : first.direct;
      vec3 bx = second.total;
      vec3 by = second.direct;

      frameTransmittance0 = vec4(ax, ay.x);
      frameTransmittance1 = vec4(ay.y, ay.z, bx.x, bx.y);
      frameTransmittance2 = vec4(bx.z, by);
    }
  #else
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

      #ifdef FRAME_NEURAL
        frameNeuralLocalInputs(worldPosition, frameNeuralLocal0, frameNeuralLocal1);
      #endif

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
  #endif
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
        frameShadowAbsorptionMap: { value: null },
        frameSpectralGroup: { value: 0 },
        frameSkyDirection: { value: new Three.Vector3(0.0, 1.0, 0.0) },
        frameShadowLights: {
          value: Array.from({ length: frameShadowLightSlots }, () => new Three.Vector4()),
        },
        frameShadowLightCount: { value: 0 },
        // NOTE Multiple scattering of frameRenderer.settings (core/framePhase.js). 0.0 is single scattering.
        frameMultipleScattering: { value: 0.0 },
        // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
        frameScatteringOctaves: { value: new Three.Vector4() },
        // NOTE multipleScattering 'two-sided' (core/framePhase.js). 1.0 marches the light slots both ways.
        frameTwoSided: { value: 0.0 },
        // NOTE multipleScattering 'neural': mips of the last cascade (FrameGridMipMaterial), levels 1 and up
        ...Object.fromEntries(
          Array.from({ length: frameNeuralLevels - 1 }, (_, i) => [`frameNeuralMipMap${i + 1}`, { value: null }]),
        ),
      },
      vertexShader,
      fragmentShader: createFragmentShader(false),
      depthTest: false,
      depthWrite: false,
      blending: Three.NoBlending,
    });

    // NOTE frameRenderer.settings.spectral: one pass for each slot group in use
    this.spectral = false;
    // NOTE multipleScattering 'neural' (not spectral): the network gives the scattered light of the light slots
    this.neural = false;
  }

  updateDefines() {
    this.fragmentShader = createFragmentShader(this.neural && !this.spectral);
    this.defines = {
      ...(this.spectral ? { FRAME_SPECTRAL: '' } : {}),
      ...(this.neural && !this.spectral ? { FRAME_NEURAL: '' } : {}),
    };
    this.needsUpdate = true;
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.updateDefines();
    }
  }

  setNeural(neural) {
    if (neural !== this.neural) {
      this.neural = neural;
      this.updateDefines();
    }
  }
}

import * as Three from 'three';
import {
  froxelPars,
  volumePars,
  gridPars,
  noisePars,
  environmentPars,
  environmentGridPars,
  phasePars,
  shadowPars,
  scatteringPars,
  spectralPars,
  tileQuadVertexShader,
  createVolumeUniforms,
} from './frameShaderChunks.js';

// NOTE Environment in the density pass: outward direction, none (only the slot light, in the lighting pass),
// or the environment grid
export const frameDensityEnvironment = { outward: 0, none: 1, grid: 2 };

const fragmentShader = `
  precision highp float;

  #define FRAME_DENSITY_ENVIRONMENT_OUTWARD ${frameDensityEnvironment.outward}
  #define FRAME_DENSITY_ENVIRONMENT_GRID ${frameDensityEnvironment.grid}

  layout(location = 0) out highp vec4 frameDensityAlbedo;
  layout(location = 1) out highp vec4 frameDensityEmission;

  // NOTE Spectral: target 2 is the extinction of each channel. No light slots: they need 3 values each,
  // so the lighting pass samples the shadow grid at the froxel.
  #ifdef FRAME_SPECTRAL
    layout(location = 2) out highp vec4 frameDensityExtinction;

    // NOTE Targets 0 and 1 of slot group 0: sky up (0.rgb) and sky down (0.a, 1.rg), core/frameSpectrum.js
    uniform sampler2D frameSkyTransmittanceMap0;
    uniform sampler2D frameSkyTransmittanceMap1;
  #else
    layout(location = 2) out highp vec4 frameDensityShadow0;
    layout(location = 3) out highp vec4 frameDensityShadow1;
  #endif

  ${froxelPars}
  ${volumePars}
  ${gridPars}
  ${noisePars}
  ${environmentPars}
  ${environmentGridPars}
  ${phasePars}
  ${shadowPars}
  ${scatteringPars}
  ${spectralPars}

  #define FRAME_SHADOW_SLOTS 6

  uniform sampler2D frameTransmittanceMap0;
  uniform sampler2D frameTransmittanceMap1;
  // NOTE Direct transmittance of the 6 light slots
  uniform sampler2D frameTransmittanceMap2;
  uniform sampler2D frameTransmittanceMap3;
  // NOTE World-space shadow lights. Scene lights get the phase here, at the visible position of each volume.
  uniform vec4 frameShadowLights[FRAME_SHADOW_SLOTS];
  uniform int frameShadowSceneLightCount;
  uniform sampler2D frameEnvironmentGridMap;
  uniform int frameEnvironmentMode;
  // NOTE 1 with diffusion multiple scattering. Then sky up and down have two-sided totals (frameIsotropicDiffusion).
  uniform int frameDiffusion;
  uniform bool frameUseShadows;
  uniform mat4 frameCameraMatrixWorld;
  uniform vec3 frameSkyDirection;

  #include <common>
  #include <lights_pars_begin>
  #include <envmap_common_pars_fragment>
  #include <envmap_physical_pars_fragment>

  #ifdef FRAME_SPECTRAL
    // NOTE Targets: (albedo * extinction of each channel, weight), (emission * weight, visibleT * weight),
    // (extinction of each channel, 0). Weight is the mean extinction of the channels.
    void main() {
      vec2 tile = floor(gl_FragCoord.xy / froxelGrid.xy);
      float slice = tile.y * froxelColumns + tile.x;
      vec2 uv = (gl_FragCoord.xy - tile * froxelGrid.xy) / froxelGrid.xy;

      float sliceNear = frameSliceDepth(slice / froxelGrid.z);
      float sliceFar = frameSliceDepth((slice + 1.0) / froxelGrid.z);
      vec3 viewNear = frameGetViewPosition(uv, sliceNear);
      vec3 viewFar = frameGetViewPosition(uv, sliceFar);
      vec3 localNear = (frameViewToLocal * vec4(viewNear, 1.0)).xyz;
      vec3 localFar = (frameViewToLocal * vec4(viewFar, 1.0)).xyz;

      vec2 boxSegment = frameBoxSegment(localNear, localFar);

      if (boxSegment.x >= boxSegment.y) {
        discard;
      }

      // NOTE Pick the mip level from the froxel width or the sub-step length, the larger one
      float segment = boxSegment.y - boxSegment.x;
      float sliceMiddle = (sliceNear + sliceFar) * 0.5;
      float froxelWidth = length(
        frameGetViewPosition(uv + vec2(1.0 / froxelGrid.x, 0.0), sliceMiddle) -
        frameGetViewPosition(uv, sliceMiddle)
      );
      float widthLod = frameLod(froxelWidth / frameWorldScale);
      int steps = frameBoxSteps(localNear, localFar, segment, widthLod, froxelSubSteps);
      float subStepLength = length(viewFar - viewNear) * segment / float(steps);
      float lod = max(widthLod, frameLod(subStepLength / frameWorldScale));

      // NOTE The visible position uses the mean transmittance of the channels
      float extinctionSum = 0.0;
      vec3 transmittance = vec3(1.0);
      float visibleWeight = 0.0;
      float visibleTSum = 0.0;
      float jitter = frameNoise(gl_FragCoord.xy);

      for (int i = 0; i < steps; i++) {
        float t = boxSegment.x + segment * (float(i) + jitter) / float(steps);
        float extinction = frameSampleExtinction(mix(localNear, localFar, t), lod) * frameOpacity *
          frameDistanceFade(mix(viewNear, viewFar, t));
        vec3 stepTransmittance = exp(-frameExtinctionSpectrum * extinction * subStepLength);
        float weight = frameMeanComponent(transmittance * (1.0 - stepTransmittance));

        visibleWeight += weight;
        visibleTSum += weight * t;
        extinctionSum += extinction;
        transmittance *= stepTransmittance;
      }

      // NOTE The mean over the whole slice: the box part's mean, weighted by its share of the slice
      vec3 extinction = frameExtinctionSpectrum * (extinctionSum / float(steps) * segment);
      float weight = frameMeanComponent(extinction);

      if (weight <= 0.0) {
        discard;
      }

      float visibleT = visibleWeight > 0.0 ? visibleTSum / visibleWeight : 0.5;
      vec3 visiblePosition = mix(localNear, localFar, visibleT);
      vec3 albedo = frameSampleAlbedo(visiblePosition, lod);
      vec3 emission = frameSampleEmission(visiblePosition, lod) + frameScatterColor;
      vec3 visibleWorldPosition = (frameCameraMatrixWorld * vec4(mix(viewNear, viewFar, visibleT), 1.0)).xyz;

      // NOTE Environment along the outward direction from the volume center, the same as per-volume lighting.
      // NOTE Its shadow is between the sky down and sky up transmittance of each channel.
      #if defined( USE_ENVMAP )
        if (frameEnvironmentMode == FRAME_DENSITY_ENVIRONMENT_OUTWARD) {
          vec4 sky0 = vec4(1.0);
          vec4 sky1 = vec4(1.0);
          vec4 unused0 = vec4(1.0);
          vec4 unused1 = vec4(1.0);

          if (frameUseShadows) {
            frameSampleShadows(
              frameSkyTransmittanceMap0,
              frameSkyTransmittanceMap1,
              frameSkyTransmittanceMap1,
              frameSkyTransmittanceMap1,
              visibleWorldPosition,
              sky0,
              sky1,
              unused0,
              unused1
            );
          }

          vec3 skyUp = frameSpectralShadowTotal(sky0.rgb, albedo);
          vec3 skyDown = frameSpectralShadowTotal(vec3(sky0.a, sky1.r, sky1.g), albedo);
          vec3 skyDirection = normalize(frameSkyDirection);
          vec3 outwardDirection = length(visiblePosition) > 1e-4
            ? normalize(mat3(frameCameraMatrixWorld) * (mat3(frameLocalToView) * visiblePosition))
            : skyDirection;
          float skyBlend = dot(outwardDirection, skyDirection) * 0.5 + 0.5;
          vec3 environmentShadow = mix(skyDown, skyUp, skyBlend);
          // NOTE getIBLIrradiance takes a view-space normal
          vec3 viewOutward = normalize(mat3(viewMatrix) * outwardDirection);

          if (frameDiffusion == 1) {
            // NOTE Diffusion: the outward and the inward irradiance, each with its two-sided total. Uniform light then gives E.
            vec3 inwardShadow = mix(skyUp, skyDown, skyBlend);

            emission += albedo * 0.5 * (
              getIBLIrradiance(viewOutward) * environmentShadow + getIBLIrradiance(-viewOutward) * inwardShadow
            ) * RECIPROCAL_PI;
          } else {
            emission += albedo * getIBLIrradiance(viewOutward) * environmentShadow * RECIPROCAL_PI;
          }
        }
      #endif

      // NOTE Environment light of the environment grid at the visible position
      if (frameEnvironmentMode == FRAME_DENSITY_ENVIRONMENT_GRID) {
        vec3 environment = frameSampleEnvironmentGrid(
          frameEnvironmentGridMap,
          visibleWorldPosition,
          vec4(frameEnvironmentUnshadowed * frameSpectralShadowTotal(vec3(1.0), albedo), 1.0)
        ).rgb;

        emission += albedo * environment * RECIPROCAL_PI;
      }

      // NOTE Values are weighted. Additive blending then gives weighted means, and the sum of the extinction.
      frameDensityAlbedo = vec4(albedo * extinction, weight);
      frameDensityEmission = vec4(emission * weight, visibleT * weight);
      frameDensityExtinction = vec4(extinction, 0.0);
    }
  #else
    void main() {
      vec2 tile = floor(gl_FragCoord.xy / froxelGrid.xy);
      float slice = tile.y * froxelColumns + tile.x;
      vec2 uv = (gl_FragCoord.xy - tile * froxelGrid.xy) / froxelGrid.xy;

      float sliceNear = frameSliceDepth(slice / froxelGrid.z);
      float sliceFar = frameSliceDepth((slice + 1.0) / froxelGrid.z);
      vec3 viewNear = frameGetViewPosition(uv, sliceNear);
      vec3 viewFar = frameGetViewPosition(uv, sliceFar);
      vec3 localNear = (frameViewToLocal * vec4(viewNear, 1.0)).xyz;
      vec3 localFar = (frameViewToLocal * vec4(viewFar, 1.0)).xyz;

      vec2 boxSegment = frameBoxSegment(localNear, localFar);

      if (boxSegment.x >= boxSegment.y) {
        discard;
      }

      // NOTE Pick the mip level from the froxel width or the sub-step length, the larger one
      float segment = boxSegment.y - boxSegment.x;
      float sliceMiddle = (sliceNear + sliceFar) * 0.5;
      float froxelWidth = length(
        frameGetViewPosition(uv + vec2(1.0 / froxelGrid.x, 0.0), sliceMiddle) -
        frameGetViewPosition(uv, sliceMiddle)
      );
      float widthLod = frameLod(froxelWidth / frameWorldScale);
      int steps = frameBoxSteps(localNear, localFar, segment, widthLod, froxelSubSteps);
      float subStepLength = length(viewFar - viewNear) * segment / float(steps);
      float lod = max(widthLod, frameLod(subStepLength / frameWorldScale));

      // NOTE Mean extinction of the slice. The visibility-weighted mean position is the light position in the lighting pass.
      float extinctionSum = 0.0;
      float transmittance = 1.0;
      float visibleWeight = 0.0;
      float visibleTSum = 0.0;
      float jitter = frameNoise(gl_FragCoord.xy);

      for (int i = 0; i < steps; i++) {
        float t = boxSegment.x + segment * (float(i) + jitter) / float(steps);
        float extinction = frameSampleExtinction(mix(localNear, localFar, t), lod) * frameOpacity *
          frameDistanceFade(mix(viewNear, viewFar, t));
        float stepTransmittance = exp(-extinction * subStepLength);
        float weight = transmittance * (1.0 - stepTransmittance);

        visibleWeight += weight;
        visibleTSum += weight * t;
        extinctionSum += extinction;
        transmittance *= stepTransmittance;
      }

      // NOTE The mean over the whole slice: the box part's mean, weighted by its share of the slice
      float extinction = extinctionSum / float(steps) * segment;

      if (extinction <= 0.0) {
        discard;
      }

      float visibleT = visibleWeight > 0.0 ? visibleTSum / visibleWeight : 0.5;
      vec3 visiblePosition = mix(localNear, localFar, visibleT);
      vec3 albedo = frameSampleAlbedo(visiblePosition, lod);
      vec3 emission = frameSampleEmission(visiblePosition, lod) + frameScatterColor;

      // NOTE Shadows at the visible position of this volume, not of other volumes in the froxel
      // NOTE shadow0, shadow1: total transmittance. direct0, direct1: direct transmittance of the 6 light slots.
      vec4 shadow0 = vec4(1.0);
      vec4 shadow1 = vec4(1.0);
      vec4 direct0 = vec4(1.0);
      vec4 direct1 = vec4(1.0);
      vec3 visibleWorldPosition = (frameCameraMatrixWorld * vec4(mix(viewNear, viewFar, visibleT), 1.0)).xyz;

      if (frameUseShadows) {
        frameSampleShadows(
          frameTransmittanceMap0,
          frameTransmittanceMap1,
          frameTransmittanceMap2,
          frameTransmittanceMap3,
          visibleWorldPosition,
          shadow0,
          shadow1,
          direct0,
          direct1
        );
      }

      // NOTE Scene light slots store phase * direct + scattered (frameShadowedLight), green channel.
      // Phases of each channel: the lighting pass adds the red and blue phase.
      // NOTE Other slots (sky up and down, the environment light) store the isotropic total transmittance.
      vec3 rayDirection = normalize(mat3(frameCameraMatrixWorld) * (viewFar - viewNear));
      float slotTotal[FRAME_SHADOW_SLOTS] = float[](shadow0.z, shadow0.w, shadow1.x, shadow1.y, shadow1.z, shadow1.w);
      float slotDirect[FRAME_SHADOW_SLOTS] = float[](direct0.x, direct0.y, direct0.z, direct0.w, direct1.x, direct1.y);

      for (int i = 0; i < FRAME_SHADOW_SLOTS; i++) {
        if (i >= frameShadowSceneLightCount) {
          slotTotal[i] = frameShadowTotal(slotTotal[i]);

          continue;
        }

        vec4 light = frameShadowLights[i];
        vec3 lightDirection = light.w < 1.5 ? light.xyz : normalize(light.xyz - visibleWorldPosition);

        slotTotal[i] = frameShadowedLight(rayDirection, lightDirection, vec2(slotDirect[i], slotTotal[i])).g;
      }

      shadow0 = vec4(frameShadowTotal(shadow0.x), frameShadowTotal(shadow0.y), slotTotal[0], slotTotal[1]);
      shadow1 = vec4(slotTotal[2], slotTotal[3], slotTotal[4], slotTotal[5]);

      // NOTE Environment along the outward direction from the volume center, the same as per-volume lighting.
      // NOTE Its shadow is between the sky down and sky up transmittance of the shadow grid.
      #if defined( USE_ENVMAP )
        if (frameEnvironmentMode == FRAME_DENSITY_ENVIRONMENT_OUTWARD) {
          vec3 skyDirection = normalize(frameSkyDirection);
          vec3 outwardDirection = length(visiblePosition) > 1e-4
            ? normalize(mat3(frameCameraMatrixWorld) * (mat3(frameLocalToView) * visiblePosition))
            : skyDirection;
          float skyBlend = dot(outwardDirection, skyDirection) * 0.5 + 0.5;
          float environmentShadow = mix(shadow0.y, shadow0.x, skyBlend);
          // NOTE getIBLIrradiance takes a view-space normal
          vec3 viewOutward = normalize(mat3(viewMatrix) * outwardDirection);

          if (frameDiffusion == 1) {
            // NOTE Diffusion: the outward and the inward irradiance, each with its two-sided total. Uniform light then gives E.
            float inwardShadow = mix(shadow0.x, shadow0.y, skyBlend);

            emission += albedo * 0.5 * (
              getIBLIrradiance(viewOutward) * environmentShadow + getIBLIrradiance(-viewOutward) * inwardShadow
            ) * RECIPROCAL_PI;
          } else {
            emission += albedo * getIBLIrradiance(viewOutward) * environmentShadow * RECIPROCAL_PI;
          }
        }
      #endif

      // NOTE Environment light of the environment grid at the visible position
      if (frameEnvironmentMode == FRAME_DENSITY_ENVIRONMENT_GRID) {
        vec3 worldPosition = (frameCameraMatrixWorld * vec4(mix(viewNear, viewFar, visibleT), 1.0)).xyz;
        vec3 environment = frameSampleEnvironmentGrid(
          frameEnvironmentGridMap,
          worldPosition,
          vec4(frameEnvironmentUnshadowed * frameShadowTotal(1.0), 1.0)
        ).rgb;

        emission += albedo * environment * RECIPROCAL_PI;
      }

      // NOTE Values are weighted by extinction. Additive blending then gives extinction-weighted means.
      frameDensityAlbedo = vec4(albedo * extinction, extinction);
      frameDensityEmission = vec4(emission * extinction, visibleT * extinction);
      // NOTE Light slots can be more than 1 (phase). The limit keeps them below the half float maximum.
      frameDensityShadow0 = min(shadow0 * extinction, vec4(6.0e4));
      frameDensityShadow1 = min(shadow1 * extinction, vec4(6.0e4));
    }
  #endif
`;

// NOTE Writes the extinction and material of one volume into the froxel grid. Lights are added in the lighting pass.
// NOTE The environment is added here, along the outward direction of each volume.
// NOTE MeshStandardMaterial gives the PMREM environment. The shader is fully replaced. GLSL3 keeps the 4 outputs.
export class FrameDensityMaterial extends Three.MeshStandardMaterial {
  name = 'FrameDensityMaterial';
  customProgramCacheKey = () => `FrameDensityMaterial|${this.spectral ? 1 : 0}`;
  // NOTE frameRenderer.settings.spectral: three targets, no light slots
  spectral = false;

  constructor(sharedUniforms) {
    super();

    this.frameUniforms = {
      ...sharedUniforms,
      ...createVolumeUniforms(),
      frameRect: { value: new Three.Vector4() },
      frameSliceStart: { value: 0.0 },
      // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
      frameScatteringOctaves: { value: new Three.Vector4() },
      frameDiffusion: { value: 0 },
    };

    this.glslVersion = Three.GLSL3;
    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;
    this.blending = Three.CustomBlending;
    this.blendEquation = Three.AddEquation;
    this.blendSrc = Three.OneFactor;
    this.blendDst = Three.OneFactor;
    this.blendSrcAlpha = Three.OneFactor;
    this.blendDstAlpha = Three.OneFactor;

    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.frameUniforms);

      shader.vertexShader = tileQuadVertexShader;
      shader.fragmentShader = fragmentShader;
    };
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.defines = { ...this.defines };

      if (spectral) {
        this.defines.FRAME_SPECTRAL = '';
      } else {
        delete this.defines.FRAME_SPECTRAL;
      }

      this.needsUpdate = true;
    }
  }
}

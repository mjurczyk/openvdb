import * as Three from 'three';
import {
  tileQuadVertexShader,
  froxelPars,
  phasePars,
  shadowPars,
  scatteringPars,
  spectralPars,
  spectralScatteringPars,
  gridPars,
  environmentPars,
  frameMieTexture,
} from './frameShaderChunks.js';
import { frameSpectralGroupCount } from '../core/frameSpectrum.js';

const fragmentShader = `
  precision highp float;

  // NOTE Spectral: atlas target 0 is (color, green alpha), target 1 is (red alpha, blue alpha, 0, green alpha)
  #ifdef FRAME_SPECTRAL
    layout(location = 0) out highp vec4 frameLightingColor;
    layout(location = 1) out highp vec4 frameLightingAlpha;
  #endif

  ${froxelPars}
  ${phasePars}
  ${shadowPars}
  ${scatteringPars}
  ${spectralPars}
  ${spectralScatteringPars}
  ${environmentPars}

  // NOTE Spectral: extinction of each channel (density target 2), and the 3 transmittance targets of each slot group
  // (core/frameSpectrum.js), in group order. Groups from frameSpectralGroups are not read.
  #ifdef FRAME_SPECTRAL
    ${gridPars}

    #define FRAME_SHADOW_SLOTS 6
    #define FRAME_SPECTRAL_GROUPS ${frameSpectralGroupCount}

    uniform sampler2D frameDensityExtinctionMap;
    uniform sampler2D frameSpectralTransmittanceMaps[FRAME_SPECTRAL_GROUPS * 3];
    uniform int frameSpectralGroups;
    uniform bool frameUseShadows;
    uniform mat4 frameCameraMatrixWorld;

    // NOTE Total and direct transmittance of each channel of the 6 light slots
    vec3 frameSlotTotal[FRAME_SHADOW_SLOTS];
    vec3 frameSlotDirect[FRAME_SHADOW_SLOTS];
  #endif

  uniform sampler2D frameDensityAlbedoMap;
  uniform sampler2D frameDensityEmissionMap;
  uniform sampler2D frameDensityShadowMap0;
  uniform sampler2D frameDensityShadowMap1;
  uniform vec3 frameSkyDirection;
  uniform int frameShadowLightCount;
  uniform int frameShadowPointOffset;
  uniform int frameShadowSpotOffset;
  uniform int frameEnvironmentLightCount;
  uniform int frameEnvironmentShadowSlot;

  #include <common>
  #include <lights_pars_begin>

  float frameShadowSlot(int slot, vec4 shadow0, vec4 shadow1) {
    if (slot >= frameShadowLightCount) {
      return 1.0;
    }

    if (slot == 0) return shadow0.z;
    if (slot == 1) return shadow0.w;
    if (slot == 2) return shadow1.x;
    if (slot == 3) return shadow1.y;
    if (slot == 4) return shadow1.z;
    if (slot == 5) return shadow1.w;

    return 1.0;
  }

  // NOTE A scene light with a shadow slot: the density pass stored phase * direct + scattered light.
  // A light with no shadow slot: no shadow, then octaves still add their light.
  float frameLightFactor(int slot, vec3 rayDirection, vec3 lightDirection, vec4 shadow0, vec4 shadow1) {
    if (slot < frameShadowLightCount) {
      return frameShadowSlot(slot, shadow0, shadow1);
    }

    return frameShadowedLight(rayDirection, lightDirection, vec2(1.0));
  }

  #ifdef FRAME_SPECTRAL
    // NOTE A light with a shadow slot: phase * direct + scattered light of each channel.
    // A light with no shadow slot: no shadow, then octaves still add their light.
    vec3 frameSpectralLightFactor(int slot, vec3 rayDirection, vec3 lightDirection, vec3 albedo) {
      FrameSpectralShadow shadow = FrameSpectralShadow(vec3(1.0), vec3(1.0));

      if (slot < frameShadowLightCount) {
        for (int i = 0; i < FRAME_SHADOW_SLOTS; i++) {
          if (i == slot) {
            shadow = FrameSpectralShadow(frameSlotDirect[i], frameSlotTotal[i]);
          }
        }
      }

      return frameSpectralShadowedLight(rayDirection, lightDirection, shadow, albedo);
    }

    // NOTE Isotropic light of a slot, no phase. 1.0 with no slot.
    vec3 frameSpectralSlotTotal(int slot, vec3 albedo) {
      vec3 total = vec3(1.0);

      if (slot >= frameShadowLightCount) {
        return total;
      }

      for (int i = 0; i < FRAME_SHADOW_SLOTS; i++) {
        if (i == slot) {
          total = frameSpectralShadowTotal(frameSlotTotal[i], albedo);
        }
      }

      return total;
    }

    // NOTE Spectral lighting. The density pass has no light slots, so the slots are sampled here,
    // at the extinction-weighted visible position of all volumes in the froxel.
    void main() {
      ivec2 texel = ivec2(gl_FragCoord.xy);
      vec4 densityAlbedo = texelFetch(frameDensityAlbedoMap, texel, 0);
      float weight = densityAlbedo.a;

      if (weight <= 0.0) {
        discard;
      }

      vec4 densityEmission = texelFetch(frameDensityEmissionMap, texel, 0);
      vec3 extinction = texelFetch(frameDensityExtinctionMap, texel, 0).rgb;

      vec2 tile = floor(gl_FragCoord.xy / froxelGrid.xy);
      float slice = tile.y * froxelColumns + tile.x;
      vec2 uv = (gl_FragCoord.xy - tile * froxelGrid.xy) / froxelGrid.xy;

      float sliceNear = frameSliceDepth(slice / froxelGrid.z);
      float sliceFar = frameSliceDepth((slice + 1.0) / froxelGrid.z);
      vec3 viewNear = frameGetViewPosition(uv, sliceNear);
      vec3 viewFar = frameGetViewPosition(uv, sliceFar);

      float visibleT = clamp(densityEmission.a / weight, 0.0, 1.0);
      vec3 viewPosition = mix(viewNear, viewFar, visibleT);
      vec3 worldPosition = (frameCameraMatrixWorld * vec4(viewPosition, 1.0)).xyz;
      vec3 rayDirection = normalize(viewFar - viewNear);
      vec3 albedo = densityAlbedo.rgb / max(extinction, vec3(1e-8));

      // NOTE Targets of the slot groups in use. 1.0 outside the grid, with no shadows and for other groups.
      vec4 maps[FRAME_SPECTRAL_GROUPS * 3];
      vec4 unused = vec4(1.0);

      for (int i = 0; i < FRAME_SPECTRAL_GROUPS * 3; i++) {
        maps[i] = vec4(1.0);
      }

      if (frameUseShadows) {
        frameSampleShadows(
          frameSpectralTransmittanceMaps[0],
          frameSpectralTransmittanceMaps[1],
          frameSpectralTransmittanceMaps[2],
          frameSpectralTransmittanceMaps[2],
          worldPosition,
          maps[0],
          maps[1],
          maps[2],
          unused
        );

        if (frameSpectralGroups > 1) {
          frameSampleShadows(
            frameSpectralTransmittanceMaps[3],
            frameSpectralTransmittanceMaps[4],
            frameSpectralTransmittanceMaps[5],
            frameSpectralTransmittanceMaps[5],
            worldPosition,
            maps[3],
            maps[4],
            maps[5],
            unused
          );
        }

        if (frameSpectralGroups > 2) {
          frameSampleShadows(
            frameSpectralTransmittanceMaps[6],
            frameSpectralTransmittanceMaps[7],
            frameSpectralTransmittanceMaps[8],
            frameSpectralTransmittanceMaps[8],
            worldPosition,
            maps[6],
            maps[7],
            maps[8],
            unused
          );
        }

        if (frameSpectralGroups > 3) {
          frameSampleShadows(
            frameSpectralTransmittanceMaps[9],
            frameSpectralTransmittanceMaps[10],
            frameSpectralTransmittanceMaps[11],
            frameSpectralTransmittanceMaps[11],
            worldPosition,
            maps[9],
            maps[10],
            maps[11],
            unused
          );
        }
      }

      // NOTE Group entries (x, y) from (a.x, a.y.r), (a.y.gb, b.x.rg), (b.x.b, b.y).
      // Group 0: sky (up, down) and slot 0. Group g: slots 2g - 1 and 2g. Slot entries are (total, direct).
      vec3 entryAX[FRAME_SPECTRAL_GROUPS];
      vec3 entryAY[FRAME_SPECTRAL_GROUPS];
      vec3 entryBX[FRAME_SPECTRAL_GROUPS];
      vec3 entryBY[FRAME_SPECTRAL_GROUPS];

      for (int g = 0; g < FRAME_SPECTRAL_GROUPS; g++) {
        vec4 map0 = maps[g * 3];
        vec4 map1 = maps[g * 3 + 1];
        vec4 map2 = maps[g * 3 + 2];

        entryAX[g] = map0.rgb;
        entryAY[g] = vec3(map0.a, map1.r, map1.g);
        entryBX[g] = vec3(map1.b, map1.a, map2.r);
        entryBY[g] = map2.gba;
      }

      frameSlotTotal[0] = entryBX[0];
      frameSlotDirect[0] = entryBY[0];

      for (int slot = 1; slot < FRAME_SHADOW_SLOTS; slot++) {
        int g = (slot + 1) / 2;
        bool first = slot - (slot / 2) * 2 == 1;

        frameSlotTotal[slot] = first ? entryAX[g] : entryBX[g];
        frameSlotDirect[slot] = first ? entryAY[g] : entryBY[g];
      }

      vec3 skyUp = frameSpectralShadowTotal(entryAX[0], albedo);
      vec3 skyDown = frameSpectralShadowTotal(entryAY[0], albedo);
      vec3 skyDirection = normalize(mat3(viewMatrix) * frameSkyDirection);
      vec3 irradiance = getAmbientLightIrradiance(ambientLightColor);

      #if defined( USE_LIGHT_PROBES )
        irradiance += 0.5 * getLightProbeIrradiance(lightProbe, skyDirection) * skyUp;
        irradiance += 0.5 * getLightProbeIrradiance(lightProbe, -skyDirection) * skyDown;
      #endif

      #if NUM_HEMI_LIGHTS > 0
        for (int i = 0; i < NUM_HEMI_LIGHTS; i++) {
          HemisphereLight hemiLight = hemisphereLights[i];

          irradiance += 0.5 * hemiLight.skyColor * skyUp;
          irradiance += 0.5 * hemiLight.groundColor * skyDown;
        }
      #endif

      #if NUM_DIR_LIGHTS > 0
        for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
          DirectionalLight directionalLight = directionalLights[i];

          irradiance += directionalLight.color * frameSpectralLightFactor(i, rayDirection, directionalLight.direction, albedo);
        }
      #endif

      #if NUM_POINT_LIGHTS > 0
        for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
          PointLight pointLight = pointLights[i];
          vec3 lightVector = pointLight.position - viewPosition;
          float distanceAttenuation = getDistanceAttenuation(length(lightVector), pointLight.distance, pointLight.decay);

          irradiance += pointLight.color * distanceAttenuation * frameSpectralLightFactor(frameShadowPointOffset + i, rayDirection, normalize(lightVector), albedo);
        }
      #endif

      #if NUM_SPOT_LIGHTS > 0
        for (int i = 0; i < NUM_SPOT_LIGHTS; i++) {
          SpotLight spotLight = spotLights[i];
          vec3 lightVector = spotLight.position - viewPosition;
          float angleCos = dot(normalize(lightVector), spotLight.direction);
          float spotAttenuation = getSpotAttenuation(spotLight.coneCos, spotLight.penumbraCos, angleCos);
          float distanceAttenuation = getDistanceAttenuation(length(lightVector), spotLight.distance, spotLight.decay);

          irradiance += spotLight.color * spotAttenuation * distanceAttenuation * frameSpectralLightFactor(frameShadowSpotOffset + i, rayDirection, normalize(lightVector), albedo);
        }
      #endif

      // NOTE Environment lights with a shadow slot (0 or 1: the dominant directional light). Isotropic, no phase.
      for (int i = 0; i < FRAME_MAX_ENVIRONMENT_LIGHTS; i++) {
        if (i >= frameEnvironmentLightCount) {
          break;
        }

        irradiance += frameEnvironmentColors[i] * frameSpectralSlotTotal(frameEnvironmentShadowSlot + i, albedo);
      }

      vec3 emission = densityEmission.rgb / weight;
      vec3 radiance = albedo * irradiance * RECIPROCAL_PI + emission;
      vec3 alpha = 1.0 - exp(-extinction * length(viewFar - viewNear));

      frameLightingColor = vec4(radiance * alpha, alpha.y);
      frameLightingAlpha = vec4(alpha.x, alpha.z, 0.0, alpha.y);
    }
  #else
  void main() {
    ivec2 texel = ivec2(gl_FragCoord.xy);
    vec4 densityAlbedo = texelFetch(frameDensityAlbedoMap, texel, 0);
    float extinction = densityAlbedo.a;

    if (extinction <= 0.0) {
      discard;
    }

    vec4 densityEmission = texelFetch(frameDensityEmissionMap, texel, 0);

    vec2 tile = floor(gl_FragCoord.xy / froxelGrid.xy);
    float slice = tile.y * froxelColumns + tile.x;
    vec2 uv = (gl_FragCoord.xy - tile * froxelGrid.xy) / froxelGrid.xy;

    float sliceNear = frameSliceDepth(slice / froxelGrid.z);
    float sliceFar = frameSliceDepth((slice + 1.0) / froxelGrid.z);
    vec3 viewNear = frameGetViewPosition(uv, sliceNear);
    vec3 viewFar = frameGetViewPosition(uv, sliceFar);

    // NOTE Spot light angles and light falloff use the extinction-weighted visible position of all volumes
    float visibleT = clamp(densityEmission.a / extinction, 0.0, 1.0);
    vec3 viewPosition = mix(viewNear, viewFar, visibleT);
    vec3 rayDirection = normalize(viewFar - viewNear);

    // NOTE Extinction-weighted mean transmittance. Each volume sampled its own visible position.
    vec4 shadow0 = texelFetch(frameDensityShadowMap0, texel, 0) / extinction;
    vec4 shadow1 = texelFetch(frameDensityShadowMap1, texel, 0) / extinction;

    vec3 skyDirection = normalize(mat3(viewMatrix) * frameSkyDirection);
    vec3 irradiance = getAmbientLightIrradiance(ambientLightColor);

    #if defined( USE_LIGHT_PROBES )
      irradiance += 0.5 * getLightProbeIrradiance(lightProbe, skyDirection) * shadow0.x;
      irradiance += 0.5 * getLightProbeIrradiance(lightProbe, -skyDirection) * shadow0.y;
    #endif

    #if NUM_HEMI_LIGHTS > 0
      for (int i = 0; i < NUM_HEMI_LIGHTS; i++) {
        HemisphereLight hemiLight = hemisphereLights[i];

        irradiance += 0.5 * hemiLight.skyColor * shadow0.x;
        irradiance += 0.5 * hemiLight.groundColor * shadow0.y;
      }
    #endif

    #if NUM_DIR_LIGHTS > 0
      for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
        DirectionalLight directionalLight = directionalLights[i];

        irradiance += directionalLight.color * frameLightFactor(i, rayDirection, directionalLight.direction, shadow0, shadow1);
      }
    #endif

    #if NUM_POINT_LIGHTS > 0
      for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
        PointLight pointLight = pointLights[i];
        vec3 lightVector = pointLight.position - viewPosition;
        float distanceAttenuation = getDistanceAttenuation(length(lightVector), pointLight.distance, pointLight.decay);

        irradiance += pointLight.color * distanceAttenuation * frameLightFactor(frameShadowPointOffset + i, rayDirection, normalize(lightVector), shadow0, shadow1);
      }
    #endif

    #if NUM_SPOT_LIGHTS > 0
      for (int i = 0; i < NUM_SPOT_LIGHTS; i++) {
        SpotLight spotLight = spotLights[i];
        vec3 lightVector = spotLight.position - viewPosition;
        float angleCos = dot(normalize(lightVector), spotLight.direction);
        float spotAttenuation = getSpotAttenuation(spotLight.coneCos, spotLight.penumbraCos, angleCos);
        float distanceAttenuation = getDistanceAttenuation(length(lightVector), spotLight.distance, spotLight.decay);

        irradiance += spotLight.color * spotAttenuation * distanceAttenuation * frameLightFactor(frameShadowSpotOffset + i, rayDirection, normalize(lightVector), shadow0, shadow1);
      }
    #endif

    // NOTE Environment lights with a shadow slot (0 or 1: the dominant directional light). Isotropic, no phase.
    for (int i = 0; i < FRAME_MAX_ENVIRONMENT_LIGHTS; i++) {
      if (i >= frameEnvironmentLightCount) {
        break;
      }

      irradiance += frameEnvironmentColors[i] * frameShadowSlot(frameEnvironmentShadowSlot + i, shadow0, shadow1);
    }

    vec3 albedo = densityAlbedo.rgb / extinction;
    vec3 emission = densityEmission.rgb / extinction;
    vec3 radiance = albedo * irradiance * RECIPROCAL_PI + emission;

    float alpha = 1.0 - exp(-extinction * length(viewFar - viewNear));

    gl_FragColor = vec4(radiance * alpha, alpha);
  }
  #endif
`;

// NOTE Lights each froxel one time from the combined data of all volumes.
// MeshStandardMaterial gives three.js light uniforms and the PMREM environment. The shader is fully replaced.
export class FrameLightingMaterial extends Three.MeshStandardMaterial {
  name = 'FrameLightingMaterial';
  customProgramCacheKey = () => `FrameLightingMaterial|${this.spectral ? 1 : 0}`;
  // NOTE frameRenderer.settings.spectral: two atlas targets
  spectral = false;

  constructor(sharedUniforms) {
    super();

    this.frameUniforms = {
      ...sharedUniforms,
      frameDensityAlbedoMap: { value: null },
      frameDensityEmissionMap: { value: null },
      frameDensityShadowMap0: { value: null },
      frameDensityShadowMap1: { value: null },
      frameSkyDirection: { value: new Three.Vector3(0.0, 1.0, 0.0) },
      frameShadowLightCount: { value: 0 },
      frameShadowPointOffset: { value: 0 },
      frameShadowSpotOffset: { value: 0 },
      frameEnvironmentLightCount: { value: 0 },
      frameEnvironmentShadowSlot: { value: 0 },
      // NOTE One phase for all volumes, from frameRenderer.settings
      framePhase: { value: new Three.Vector4() },
      frameMieMap: { value: frameMieTexture },
      // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
      frameScatteringOctaves: { value: new Three.Vector4() },
      // NOTE frameRenderer.settings.spectral
      frameDensityExtinctionMap: { value: null },
      frameSpectralTransmittanceMaps: { value: Array.from({ length: frameSpectralGroupCount * 3 }, () => null) },
      frameSpectralGroups: { value: 0 },
      frameUseShadows: { value: false },
      frameCameraMatrixWorld: { value: new Three.Matrix4() },
    };

    this.depthTest = false;
    this.depthWrite = false;
    this.side = Three.DoubleSide;
    this.blending = Three.NoBlending;

    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.frameUniforms);

      // NOTE Only the froxel area of the volumes (frameRect, frameSliceStart). Other froxels have no density.
      shader.vertexShader = tileQuadVertexShader;
      shader.fragmentShader = fragmentShader;
    };
  }

  // NOTE GLSL3 keeps the two spectral outputs
  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.glslVersion = spectral ? Three.GLSL3 : null;
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

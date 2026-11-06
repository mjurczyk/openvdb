import * as Three from 'three';
import {
  froxelPars,
  volumePars,
  noisePars,
  phasePars,
  shadowPars,
  scatteringPars,
  spectralPars,
  spectralScatteringPars,
  environmentPars,
  createVolumeUniforms,
} from './frameShaderChunks.js';
import { frameLights } from '../core/frameLights.js';

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  precision highp sampler3D;

  #define FRAME_LIGHT_AMBIENT ${frameLights.useAmbientLights}
  #define FRAME_LIGHT_POINT ${frameLights.usePointLights}
  #define FRAME_LIGHT_DIR ${frameLights.useDirectionalLights}
  #define FRAME_LIGHT_SPOT ${frameLights.useSpotLights}
  #define FRAME_LIGHT_HEMI ${frameLights.useHemisphereLights}
  #define FRAME_LIGHT_ENV ${frameLights.useEnvironment}

  uniform int frameLights;
  uniform int frameShadowSteps;

  // NOTE Spectral: atlas target 0 is (color, green alpha), target 1 is (red alpha, blue alpha, 0, green alpha).
  // NOTE Both targets blend with the green alpha (w of each output).
  #ifdef FRAME_SPECTRAL
    layout(location = 0) out highp vec4 frameInjectColor;
    layout(location = 1) out highp vec4 frameInjectAlpha;

    #define FrameLight vec3
  #else
    #define FrameLight float
  #endif

  ${froxelPars}
  ${volumePars}
  ${noisePars}
  ${phasePars}
  ${shadowPars}
  ${scatteringPars}
  ${spectralPars}
  ${spectralScatteringPars}
  ${environmentPars}

  #include <common>
  #include <lights_pars_begin>
  #include <envmap_common_pars_fragment>
  #include <envmap_physical_pars_fragment>

  // NOTE Shadow march inside the source volume only. Other volumes do not cast shadows.
  // NOTE Returns (direct, total, reduced depth, effective depth). The absorption uses the albedo at the lit position.
  vec4 frameTransmittanceDepths(vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
    if (frameAbsorbance <= 0.0 || frameShadowSteps <= 0) {
      return vec4(1.0, 1.0, 0.0, 0.0);
    }

    vec3 direction = normalize(localDirection);
    float marchDistance = min(frameBoxExit(origin, direction), maxLocalDistance);

    if (marchDistance <= 0.0) {
      return vec4(1.0, 1.0, 0.0, 0.0);
    }

    float localStep = marchDistance / float(frameShadowSteps);
    float stepLod = max(lod, frameLod(localStep));
    float worldStep = localStep * length(mat3(frameLocalToView) * direction);
    float stepScale = worldStep * frameAbsorbance;
    vec3 depths = vec3(0.0);
    vec3 probe = origin + direction * localStep * frameNoise(gl_FragCoord.xy + vec2(17.0, 31.0));

    for (int i = 0; i < frameShadowSteps; i++) {
      float extinction = frameSampleExtinction(probe, stepLod) * stepScale;

      depths += frameShadowStep(extinction, frameShadowAbsorption(extinction, albedo));

      if (frameShadowMarchDepth(depths) > 8.0) {
        break;
      }

      probe += direction * localStep;
    }

    return vec4(frameShadowTransmittance(depths), depths.z, depths.y);
  }

  // NOTE Returns shadow values (frameShadowTransmittance)
  vec2 frameTransmittance(vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
    return frameTransmittanceDepths(origin, localDirection, maxLocalDistance, lod, albedo).xy;
  }

  // NOTE Diffusion: two-sided totals of isotropic light (frameIsotropicDiffusion) for (direction, opposite direction).
  // It marches both directions.
  vec2 frameDiffusionPair(vec3 origin, vec3 localDirection, float lod, vec3 albedo) {
    vec4 front = frameTransmittanceDepths(origin, localDirection, 1e6, lod, albedo);
    vec4 back = frameTransmittanceDepths(origin, -localDirection, 1e6, lod, albedo);

    return vec2(frameIsotropicDiffusion(front.z, back.z, front.w), frameIsotropicDiffusion(back.z, front.z, back.w));
  }

  #ifdef FRAME_SPECTRAL
    // NOTE Spectral shadow march. One volume has one spectrum, so the march sums one optical depth.
    // Then the depths of each channel are linear in it (frameSpectralShadowDepths). Returns the depths.
    FrameSpectralDepths frameSpectralTransmittanceDepths(vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
      FrameSpectralDepths unshadowed = FrameSpectralDepths(vec3(0.0), vec3(0.0), vec3(0.0));

      if (frameAbsorbance <= 0.0 || frameShadowSteps <= 0) {
        return unshadowed;
      }

      vec3 direction = normalize(localDirection);
      float marchDistance = min(frameBoxExit(origin, direction), maxLocalDistance);

      if (marchDistance <= 0.0) {
        return unshadowed;
      }

      float localStep = marchDistance / float(frameShadowSteps);
      float stepLod = max(lod, frameLod(localStep));
      float worldStep = localStep * length(mat3(frameLocalToView) * direction);
      float stepScale = worldStep * frameAbsorbance;
      FrameSpectralDepths unit = frameSpectralShadowUnit(frameExtinctionSpectrum, albedo);
      float opticalDepth = 0.0;
      vec3 probe = origin + direction * localStep * frameNoise(gl_FragCoord.xy + vec2(17.0, 31.0));

      for (int i = 0; i < frameShadowSteps; i++) {
        opticalDepth += frameSampleExtinction(probe, stepLod) * stepScale;

        // NOTE Stop when all channels are dark
        if (frameMinComponent(frameSpectralShadowMarchDepth(frameSpectralShadowDepths(unit, opticalDepth))) > 8.0) {
          break;
        }

        probe += direction * localStep;
      }

      return frameSpectralShadowDepths(unit, opticalDepth);
    }

    // NOTE Returns shadow values of each channel (frameSpectralShadowTransmittance)
    FrameSpectralShadow frameSpectralTransmittance(vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
      return frameSpectralShadowTransmittance(
        frameSpectralTransmittanceDepths(origin, localDirection, maxLocalDistance, lod, albedo)
      );
    }

    // NOTE Diffusion: two-sided totals of each channel (frameIsotropicDiffusion) for the direction and the opposite direction.
    // It marches both directions.
    void frameDiffusionLight(vec3 origin, vec3 localDirection, float lod, vec3 albedo, out vec3 forward, out vec3 opposite) {
      FrameSpectralDepths front = frameSpectralTransmittanceDepths(origin, localDirection, 1e6, lod, albedo);
      FrameSpectralDepths back = frameSpectralTransmittanceDepths(origin, -localDirection, 1e6, lod, albedo);

      forward = frameIsotropicDiffusion(front.reduced, back.reduced, front.effective);
      opposite = frameIsotropicDiffusion(back.reduced, front.reduced, back.effective);
    }

    // NOTE Isotropic light (no phase): total transmittance
    vec3 frameTotalLight(vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
      return frameSpectralShadowTotal(frameSpectralTransmittance(origin, localDirection, maxLocalDistance, lod, albedo).total, albedo);
    }

    // NOTE Light of a directional, point or spot light, divided by the light color
    vec3 frameDirectLight(vec3 rayDirection, vec3 lightDirection, vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
      return frameSpectralShadowedLight(
        rayDirection,
        lightDirection,
        frameSpectralTransmittance(origin, localDirection, maxLocalDistance, lod, albedo),
        albedo
      );
    }
  #else
    // NOTE Isotropic light (no phase): total transmittance
    float frameTotalLight(vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
      return frameShadowTotal(frameTransmittance(origin, localDirection, maxLocalDistance, lod, albedo).y);
    }

    // NOTE Light of a directional, point or spot light, divided by the light color
    float frameDirectLight(vec3 rayDirection, vec3 lightDirection, vec3 origin, vec3 localDirection, float maxLocalDistance, float lod, vec3 albedo) {
      return frameShadowedLight(rayDirection, lightDirection, frameTransmittance(origin, localDirection, maxLocalDistance, lod, albedo));
    }

    // NOTE Diffusion: two-sided totals for the direction and the opposite direction (frameDiffusionPair)
    void frameDiffusionLight(vec3 origin, vec3 localDirection, float lod, vec3 albedo, out float forward, out float opposite) {
      vec2 pair = frameDiffusionPair(origin, localDirection, lod, albedo);

      forward = pair.x;
      opposite = pair.y;
    }
  #endif

  // NOTE Isotropic light of one direction (no phase): total transmittance. Diffusion: two-sided.
  FrameLight frameIsotropicLight(vec3 origin, vec3 localDirection, float lod, vec3 albedo) {
    if (frameMultipleScattering > 0.0) {
      FrameLight forward;
      FrameLight opposite;

      frameDiffusionLight(origin, localDirection, lod, albedo, forward, opposite);

      return forward;
    }

    return frameTotalLight(origin, localDirection, 1e6, lod, albedo);
  }

  void main() {
    vec2 tile = floor(gl_FragCoord.xy / froxelGrid.xy);
    float slice = tile.y * froxelColumns + tile.x;

    if (slice >= froxelGrid.z) {
      discard;
    }

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

    // NOTE Pre-integrate the slice along the view ray. Light the visibility-weighted mean position, not the froxel center.
    // NOTE Spectral: transmittance of each channel. The visible position uses the mean of the channels.
    FrameLight transmittance = FrameLight(1.0);
    float visibleWeight = 0.0;
    float visibleTSum = 0.0;
    float jitter = frameNoise(gl_FragCoord.xy);

    for (int i = 0; i < steps; i++) {
      float t = boxSegment.x + segment * (float(i) + jitter) / float(steps);
      vec3 probe = mix(localNear, localFar, t);
      float opticalDepth = frameSampleExtinction(probe, lod) * frameOpacity * subStepLength;
      #ifdef FRAME_SPECTRAL
        vec3 stepTransmittance = exp(-frameExtinctionSpectrum * opticalDepth);
        float weight = frameMeanComponent(transmittance * (1.0 - stepTransmittance));
      #else
        float stepTransmittance = exp(-opticalDepth);
        float weight = transmittance * (1.0 - stepTransmittance);
      #endif

      visibleWeight += weight;
      visibleTSum += weight * t;
      transmittance *= stepTransmittance;
    }

    FrameLight alpha = 1.0 - transmittance;

    #ifdef FRAME_SPECTRAL
      float maxAlpha = frameMaxComponent(alpha);
    #else
      float maxAlpha = alpha;
    #endif

    if (visibleWeight <= 0.0 || maxAlpha <= 1e-5) {
      discard;
    }

    vec3 localPosition = mix(localNear, localFar, visibleTSum / visibleWeight);
    vec3 viewPosition = (frameLocalToView * vec4(localPosition, 1.0)).xyz;
    vec3 rayDirection = normalize(viewFar - viewNear);

    mat3 viewToLocalDirection = mat3(frameViewToLocal);

    vec3 outwardNormal = length(localPosition) > 1e-4
      ? normalize(mat3(frameLocalToView) * localPosition)
      : normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);

    vec3 albedo = frameSampleAlbedo(localPosition, lod);
    vec3 irradiance = vec3(0.0);

    if ((frameLights & FRAME_LIGHT_AMBIENT) != 0) {
      irradiance += getAmbientLightIrradiance(ambientLightColor);

      #if defined( USE_LIGHT_PROBES )
        irradiance += getLightProbeIrradiance(lightProbe, outwardNormal);
      #endif
    }

    // NOTE Environment lights replace the outward direction: one shadow march for each light, no phase
    if ((frameLights & FRAME_LIGHT_ENV) != 0 && frameEnvironmentCount > 0) {
      mat3 worldToLocalDirection = viewToLocalDirection * mat3(viewMatrix);
      vec3 environment = vec3(0.0);

      for (int i = 0; i < FRAME_MAX_ENVIRONMENT_LIGHTS; i++) {
        if (i >= frameEnvironmentCount) {
          break;
        }

        environment += frameEnvironmentColors[i] * frameIsotropicLight(
          localPosition,
          worldToLocalDirection * frameEnvironmentDirections[i],
          lod,
          albedo
        );
      }

      irradiance += max(environment, vec3(0.0));
    }

    #if defined( USE_ENVMAP )
      if ((frameLights & FRAME_LIGHT_ENV) != 0 && frameEnvironmentCount == 0) {
        vec3 outwardDirection = viewToLocalDirection * outwardNormal;

        if (frameMultipleScattering > 0.0) {
          // NOTE Diffusion: the outward and the inward irradiance, each with its two-sided total. Uniform light then gives E.
          FrameLight forward;
          FrameLight opposite;

          frameDiffusionLight(localPosition, outwardDirection, lod, albedo, forward, opposite);

          irradiance += 0.5 * (getIBLIrradiance(outwardNormal) * forward + getIBLIrradiance(-outwardNormal) * opposite);
        } else {
          FrameLight envTransmittance = frameTotalLight(localPosition, outwardDirection, 1e6, lod, albedo);

          irradiance += getIBLIrradiance(outwardNormal) * envTransmittance;
        }
      }
    #endif

    #if NUM_HEMI_LIGHTS > 0
      if ((frameLights & FRAME_LIGHT_HEMI) != 0) {
        for (int i = 0; i < NUM_HEMI_LIGHTS; i++) {
          HemisphereLight hemiLight = hemisphereLights[i];
          vec3 upDirection = viewToLocalDirection * hemiLight.direction;

          FrameLight skyTotal;
          FrameLight groundTotal;

          // NOTE Diffusion: sky and ground are an opposite pair, two-sided totals
          if (frameMultipleScattering > 0.0) {
            frameDiffusionLight(localPosition, upDirection, lod, albedo, skyTotal, groundTotal);
          } else {
            skyTotal = frameTotalLight(localPosition, upDirection, 1e6, lod, albedo);
            groundTotal = frameTotalLight(localPosition, -upDirection, 1e6, lod, albedo);
          }

          irradiance += 0.5 * hemiLight.skyColor * skyTotal;
          irradiance += 0.5 * hemiLight.groundColor * groundTotal;
        }
      }
    #endif

    #if NUM_DIR_LIGHTS > 0
      if ((frameLights & FRAME_LIGHT_DIR) != 0) {
        for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
          DirectionalLight directionalLight = directionalLights[i];

          irradiance += directionalLight.color * frameDirectLight(
            rayDirection,
            directionalLight.direction,
            localPosition,
            viewToLocalDirection * directionalLight.direction,
            1e6,
            lod,
            albedo
          );
        }
      }
    #endif

    // NOTE Point and spot lights have no distance falloff

    #if NUM_POINT_LIGHTS > 0
      if ((frameLights & FRAME_LIGHT_POINT) != 0) {
        for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
          PointLight pointLight = pointLights[i];
          vec3 toLight = (frameViewToLocal * vec4(pointLight.position, 1.0)).xyz - localPosition;

          irradiance += pointLight.color * frameDirectLight(
            rayDirection,
            normalize(pointLight.position - viewPosition),
            localPosition,
            toLight,
            length(toLight),
            lod,
            albedo
          );
        }
      }
    #endif

    #if NUM_SPOT_LIGHTS > 0
      if ((frameLights & FRAME_LIGHT_SPOT) != 0) {
        for (int i = 0; i < NUM_SPOT_LIGHTS; i++) {
          SpotLight spotLight = spotLights[i];
          float angleCos = dot(normalize(spotLight.position - viewPosition), spotLight.direction);
          float spotAttenuation = getSpotAttenuation(spotLight.coneCos, spotLight.penumbraCos, angleCos);

          if (spotAttenuation > 0.0) {
            vec3 toLight = (frameViewToLocal * vec4(spotLight.position, 1.0)).xyz - localPosition;

            irradiance += spotLight.color * spotAttenuation * frameDirectLight(
              rayDirection,
              normalize(spotLight.position - viewPosition),
              localPosition,
              toLight,
              length(toLight),
              lod,
              albedo
            );
          }
        }
      }
    #endif

    vec3 radiance = max(frameScatterColor, albedo * irradiance * RECIPROCAL_PI);

    radiance += frameSampleEmission(localPosition, lod);

    // NOTE Premultiplied slice color and alpha. Linear filtering of these values gives transparent edges.
    #ifdef FRAME_SPECTRAL
      frameInjectColor = vec4(radiance * alpha, alpha.y);
      frameInjectAlpha = vec4(alpha.x, alpha.z, 0.0, alpha.y);
    #else
      gl_FragColor = vec4(radiance * alpha, alpha);
    #endif
  }
`;

// NOTE MeshStandardMaterial gives three.js light uniforms and the PMREM environment. The shader is fully replaced.
export class FrameInjectMaterial extends Three.MeshStandardMaterial {
  name = 'FrameInjectMaterial';
  customProgramCacheKey = () => `FrameInjectMaterial|${this.spectral ? 1 : 0}`;
  // NOTE frameRenderer.settings.spectral: extinction and multiple scattering of each channel, two atlas targets
  spectral = false;

  constructor(froxelUniforms) {
    super();

    this.frameUniforms = {
      ...froxelUniforms,
      ...createVolumeUniforms(),
      frameLights: { value: 0 },
      frameShadowSteps: { value: 32 },
      // NOTE Multiple scattering of this volume (core/framePhase.js). 0.0 is single scattering.
      frameMultipleScattering: { value: 0.0 },
      // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
      frameScatteringOctaves: { value: new Three.Vector4() },
    };

    this.transparent = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.side = Three.DoubleSide;

    // NOTE Premultiplied "over" blend. Overlapping volumes in one froxel multiply their transmittance.
    this.blending = Three.CustomBlending;
    this.blendEquation = Three.AddEquation;
    this.blendSrc = Three.OneFactor;
    this.blendDst = Three.OneMinusSrcAlphaFactor;
    this.blendSrcAlpha = Three.OneFactor;
    this.blendDstAlpha = Three.OneMinusSrcAlphaFactor;

    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.frameUniforms);

      shader.vertexShader = vertexShader;
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

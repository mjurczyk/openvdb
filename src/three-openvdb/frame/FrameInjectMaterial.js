import * as Three from 'three';
import { froxelPars, volumePars, noisePars, createVolumeUniforms } from './frameShaderChunks';

// NOTE Bit values are the same as the FogVolume light flags
export const frameLights = {
  useAmbientLights: 0b100000,
  usePointLights: 0b010000,
  useDirectionalLights: 0b001000,
  useSpotLights: 0b000100,
  useHemisphereLights: 0b000010,
  useEnvironment: 0b000001,
};

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

  ${froxelPars}
  ${volumePars}
  ${noisePars}

  #include <common>
  #include <lights_pars_begin>
  #include <envmap_common_pars_fragment>
  #include <cube_uv_reflection_fragment>
  #include <envmap_physical_pars_fragment>

  // NOTE Shadow march inside the source volume only. Other volumes do not cast shadows.
  float frameTransmittance(vec3 origin, vec3 localDirection, float maxLocalDistance, float lod) {
    if (frameAbsorbance <= 0.0 || frameShadowSteps <= 0) {
      return 1.0;
    }

    vec3 direction = normalize(localDirection);
    float marchDistance = min(frameBoxExit(origin, direction), maxLocalDistance);

    if (marchDistance <= 0.0) {
      return 1.0;
    }

    float localStep = marchDistance / float(frameShadowSteps);
    float stepLod = max(lod, frameLod(localStep));
    float worldStep = localStep * length(mat3(frameLocalToView) * direction);
    float stepScale = worldStep * frameAbsorbance;
    float opticalDepth = 0.0;
    vec3 probe = origin + direction * localStep * frameNoise(gl_FragCoord.xy + vec2(17.0, 31.0));

    for (int i = 0; i < frameShadowSteps; i++) {
      opticalDepth += frameSampleExtinction(probe, stepLod) * stepScale;

      if (opticalDepth > 8.0) {
        break;
      }

      probe += direction * localStep;
    }

    return exp(-opticalDepth);
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
    float subStepLength = length(viewFar - viewNear) / float(froxelSubSteps);
    float sliceMiddle = (sliceNear + sliceFar) * 0.5;
    float froxelWidth = length(
      frameGetViewPosition(uv + vec2(1.0 / froxelGrid.x, 0.0), sliceMiddle) -
      frameGetViewPosition(uv, sliceMiddle)
    );
    float lod = frameLod(max(froxelWidth, subStepLength) / frameWorldScale);

    // NOTE Pre-integrate the slice along the view ray. Light the visibility-weighted mean position, not the froxel center.
    float transmittance = 1.0;
    float visibleWeight = 0.0;
    float visibleTSum = 0.0;
    float jitter = frameNoise(gl_FragCoord.xy);

    for (int i = 0; i < froxelSubSteps; i++) {
      float t = (float(i) + jitter) / float(froxelSubSteps);

      if (t < boxSegment.x || t > boxSegment.y) {
        continue;
      }

      vec3 probe = mix(localNear, localFar, t);
      float opticalDepth = frameSampleExtinction(probe, lod) * frameOpacity * subStepLength;
      float stepTransmittance = exp(-opticalDepth);
      float weight = transmittance * (1.0 - stepTransmittance);

      visibleWeight += weight;
      visibleTSum += weight * t;
      transmittance *= stepTransmittance;
    }

    float alpha = 1.0 - transmittance;

    if (visibleWeight <= 0.0 || alpha <= 1e-5) {
      discard;
    }

    vec3 localPosition = mix(localNear, localFar, visibleTSum / visibleWeight);
    vec3 viewPosition = (frameLocalToView * vec4(localPosition, 1.0)).xyz;

    mat3 viewToLocalDirection = mat3(frameViewToLocal);

    vec3 outwardNormal = length(localPosition) > 1e-4
      ? normalize(mat3(frameLocalToView) * localPosition)
      : normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);

    vec3 irradiance = vec3(0.0);

    if ((frameLights & FRAME_LIGHT_AMBIENT) != 0) {
      irradiance += getAmbientLightIrradiance(ambientLightColor);

      #if defined( USE_LIGHT_PROBES )
        irradiance += getLightProbeIrradiance(lightProbe, outwardNormal);
      #endif
    }

    #if defined( USE_ENVMAP )
      if ((frameLights & FRAME_LIGHT_ENV) != 0) {
        float envTransmittance = frameTransmittance(localPosition, viewToLocalDirection * outwardNormal, 1e6, lod);

        irradiance += getIBLIrradiance(outwardNormal) * envTransmittance;
      }
    #endif

    #if NUM_HEMI_LIGHTS > 0
      if ((frameLights & FRAME_LIGHT_HEMI) != 0) {
        for (int i = 0; i < NUM_HEMI_LIGHTS; i++) {
          HemisphereLight hemiLight = hemisphereLights[i];
          vec3 upDirection = viewToLocalDirection * hemiLight.direction;

          irradiance += 0.5 * hemiLight.skyColor * frameTransmittance(localPosition, upDirection, 1e6, lod);
          irradiance += 0.5 * hemiLight.groundColor * frameTransmittance(localPosition, -upDirection, 1e6, lod);
        }
      }
    #endif

    #if NUM_DIR_LIGHTS > 0
      if ((frameLights & FRAME_LIGHT_DIR) != 0) {
        for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
          DirectionalLight directionalLight = directionalLights[i];

          irradiance += directionalLight.color * frameTransmittance(
            localPosition,
            viewToLocalDirection * directionalLight.direction,
            1e6,
            lod
          );
        }
      }
    #endif

    // NOTE Point and spot lights have no distance falloff. This is the same as FogVolume.

    #if NUM_POINT_LIGHTS > 0
      if ((frameLights & FRAME_LIGHT_POINT) != 0) {
        for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
          PointLight pointLight = pointLights[i];
          vec3 toLight = (frameViewToLocal * vec4(pointLight.position, 1.0)).xyz - localPosition;

          irradiance += pointLight.color * frameTransmittance(localPosition, toLight, length(toLight), lod);
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

            irradiance += spotLight.color * spotAttenuation * frameTransmittance(localPosition, toLight, length(toLight), lod);
          }
        }
      }
    #endif

    vec3 albedo = frameSampleAlbedo(localPosition, lod);
    vec3 radiance = max(frameScatterColor, albedo * irradiance * RECIPROCAL_PI);

    radiance += frameSampleEmission(localPosition, lod);

    // NOTE Premultiplied slice color and alpha. Linear filtering of these values gives transparent edges.
    gl_FragColor = vec4(radiance * alpha, alpha);
  }
`;

// NOTE MeshStandardMaterial gives three.js light uniforms and the PMREM environment. The shader is fully replaced.
export class FrameInjectMaterial extends Three.MeshStandardMaterial {
  name = 'FrameInjectMaterial';
  customProgramCacheKey = () => 'FrameInjectMaterial';

  constructor(froxelUniforms) {
    super();

    this.frameUniforms = {
      ...froxelUniforms,
      ...createVolumeUniforms(),
      frameLights: { value: 0 },
      frameShadowSteps: { value: 32 },
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
}

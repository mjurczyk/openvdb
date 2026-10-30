import * as Three from 'three';
import { froxelPars } from './frameShaderChunks';

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  ${froxelPars}

  uniform sampler2D frameDensityAlbedoMap;
  uniform sampler2D frameDensityEmissionMap;
  uniform sampler2D frameDensityShadowMap0;
  uniform sampler2D frameDensityShadowMap1;
  uniform vec3 frameSkyDirection;
  uniform int frameShadowLightCount;
  uniform int frameShadowPointOffset;
  uniform int frameShadowSpotOffset;

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
        irradiance += directionalLights[i].color * frameShadowSlot(i, shadow0, shadow1);
      }
    #endif

    #if NUM_POINT_LIGHTS > 0
      for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
        PointLight pointLight = pointLights[i];
        float distanceAttenuation = getDistanceAttenuation(length(pointLight.position - viewPosition), pointLight.distance, pointLight.decay);

        irradiance += pointLight.color * distanceAttenuation * frameShadowSlot(frameShadowPointOffset + i, shadow0, shadow1);
      }
    #endif

    #if NUM_SPOT_LIGHTS > 0
      for (int i = 0; i < NUM_SPOT_LIGHTS; i++) {
        SpotLight spotLight = spotLights[i];
        vec3 lightVector = spotLight.position - viewPosition;
        float angleCos = dot(normalize(lightVector), spotLight.direction);
        float spotAttenuation = getSpotAttenuation(spotLight.coneCos, spotLight.penumbraCos, angleCos);
        float distanceAttenuation = getDistanceAttenuation(length(lightVector), spotLight.distance, spotLight.decay);

        irradiance += spotLight.color * spotAttenuation * distanceAttenuation * frameShadowSlot(frameShadowSpotOffset + i, shadow0, shadow1);
      }
    #endif

    vec3 albedo = densityAlbedo.rgb / extinction;
    vec3 emission = densityEmission.rgb / extinction;
    vec3 radiance = albedo * irradiance * RECIPROCAL_PI + emission;

    float alpha = 1.0 - exp(-extinction * length(viewFar - viewNear));

    gl_FragColor = vec4(radiance * alpha, alpha);
  }
`;

// NOTE Lights each froxel one time from the combined data of all volumes.
// MeshStandardMaterial gives three.js light uniforms and the PMREM environment. The shader is fully replaced.
export class FrameLightingMaterial extends Three.MeshStandardMaterial {
  name = 'FrameLightingMaterial';
  customProgramCacheKey = () => 'FrameLightingMaterial';

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
    };

    this.depthTest = false;
    this.depthWrite = false;
    this.side = Three.DoubleSide;
    this.blending = Three.NoBlending;

    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.frameUniforms);

      shader.vertexShader = vertexShader;
      shader.fragmentShader = fragmentShader;
    };
  }
}

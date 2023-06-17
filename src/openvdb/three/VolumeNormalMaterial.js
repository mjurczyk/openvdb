import * as Three from 'three';
import { getUuid } from '../utils/uuid';
import { lights } from '../utils/lights';
import { getDepthUniforms } from '../utils/depth';

export class VolumeNormalMaterial extends Three.MeshStandardMaterial {
  name = 'VolumeNormalMaterial';
  isVolumetricFogMaterial = true;
  customProgramCacheKey = () => getUuid(this);

  _uniforms = {
    baseColor: { value: new Three.Color(0xffffff) },
    scatterColor: { value: new Three.Color(0x000000) },
    densityMap3D: { value: null },
    emissiveMap3D: { value: null },
    baseColorMap3D: { value: null },
    maskMap3D: { value: null },
    steps: { value: 100 },
    absorbance: { value: 1.0 },
    densityScale: { value: 1.0 },
    resolution: { value: 100 },
    offset3D: { value: new Three.Vector3(0.0, 0.0, 0.0) },
    wrap3D: { value: Three.ClampToEdgeWrapping },
    lights: { value:
      lights.useDirectionalLights |
      lights.usePointLights |
      lights.useSpotLights |
      lights.useHemisphereLights |
      lights.useEnvironment
    },
    cameraPosition: { value: new Three.Vector3(0.0, 0.0, 0.0) },
    cameraNear: { value: 1.0 },
    cameraFar: { value: 1.0 },
  };

  set baseColor(value) {
    this._uniforms.baseColor.value.set(value);
  }

  get baseColor() {
    return this._uniforms.baseColor.value;
  }

  set scatterColor(value) {
    this._uniforms.scatterColor.value.set(value);
  }

  get scatterColor() {
    return this._uniforms.scatterColor.value;
  }

  set densityMap3D(value) {
    this._uniforms.densityMap3D.value = value;
    value.offset3D = this._uniforms.offset3D.value;
  }

  get densityMap3D() {
    return this._uniforms.densityMap3D.value;
  }

  set emissiveMap3D(value) {
    this._uniforms.emissiveMap3D.value = value;
    value.offset3D = this._uniforms.offset3D.value;

    this.needsUpdate = true;
  }

  get emissiveMap3D() {
    return this._uniforms.emissiveMap3D.value;
  }

  set maskMap3D(value) {
    this._uniforms.maskMap3D.value = value;

    this.needsUpdate = true;
  }

  get maskMap3D() {
    return this._uniforms.maskMap3D.value;
  }

  set baseColorMap3D(value) {
    this._uniforms.baseColorMap3D.value = value;
    value.offset3D = this._uniforms.offset3D.value;

    this.needsUpdate = true;
  }

  get baseColorMap3D() {
    return this._uniforms.baseColorMap3D.value;
  }

  set steps(value) {
    this._uniforms.steps.value = value;
  }

  get steps() {
    return this._uniforms.steps.value;
  }

  set absorbance(value) {
    this._uniforms.absorbance.value = value;
  }

  get absorbance() {
    return this._uniforms.absorbance.value;
  }

  set resolution(value) {
    this._uniforms.resolution.value = value;
  }

  get resolution() {
    return this._uniforms.resolution.value;
  }

  set offset3D(value) {
    this._uniforms.offset3D.value.copy(value);
  }

  get offset3D() {
    return this._uniforms.offset3D.value;
  }

  set wrap3D(value) {
    this._uniforms.wrap3D.value = value;

    this.needsUpdate = true;
  }

  get wrap3D() {
    return this._uniforms.wrap3D.value;
  }

  set densityScale(value) {
    this._uniforms.densityScale.value = value;
  }

  get densityScale() {
    return this._uniforms.densityScale.value;
  }

  set lights(value) {
    this._uniforms.lights.value = value;

    this.needsUpdate = true;
  }

  get lights() {
    return this._uniforms.lights.value;
  }

  set useDirectionalLights(value = true) {
    if (value) {
      this._uniforms.lights.value |= lights.useDirectionalLights;
    } else {
      this._uniforms.lights.value &= ~lights.useDirectionalLights;
    }

    this.needsUpdate = true;
  }

  get useDirectionalLights() {
    return (this._uniforms.lights.value & lights.useDirectionalLights) !== 0;
  }

  set usePointLights(value = true) {
    if (value) {
      this._uniforms.lights.value |= lights.usePointLights;
    } else {
      this._uniforms.lights.value &= ~lights.usePointLights;
    }

    this.needsUpdate = true;
  }

  get usePointLights() {
    return (this._uniforms.lights.value & lights.usePointLights) !== 0;
  }

  set useHemisphereLights(value = true) {
    if (value) {
      this._uniforms.lights.value |= lights.useHemisphereLights;
    } else {
      this._uniforms.lights.value &= ~lights.useHemisphereLights;
    }

    this.needsUpdate = true;
  }

  get useHemisphereLights() {
    return (this._uniforms.lights.value & lights.useHemisphereLights) !== 0;
  }

  set useSpotLights(value = true) {
    if (value) {
      this._uniforms.lights.value |= lights.useSpotLights;
    } else {
      this._uniforms.lights.value &= ~lights.useSpotLights;
    }

    this.needsUpdate = true;
  }

  get useSpotLights() {
    return (this._uniforms.lights.value & lights.useSpotLights) !== 0;
  }

  set useEnvironment(value = true) {
    if (value) {
      this._uniforms.lights.value |= lights.useEnvironment;
    } else {
      this._uniforms.lights.value &= ~lights.useEnvironment;
    }

    this.needsUpdate = true;
  }

  get useEnvironment() {
    return (this._uniforms.lights.value & lights.useEnvironment) !== 0;
  }

  constructor(props = {}) {
    super();

    this.side = Three.BackSide;
    this.depthWrite = false;
    this.depthTest = false;
    this.transparent = true;

    Object.keys(this._uniforms).forEach(key => {
      if (typeof props[key] !== 'undefined' && props[key] !== null) {
        this[key] = props[key];

        if (props[key] instanceof Three.Texture) {
          props[key].offset3D = this._uniforms.offset3D.value;
        }
      }
    });

    this.onBeforeCompile = (shader, renderer) => {
      const depthInfo = getDepthUniforms(renderer);

      Object.entries({
        ...this._uniforms,
        ...depthInfo,
      }).forEach(([key, value]) => {
        shader.uniforms[key] = value;
      });

      const shaderProperties = `
        #define VOLUME_BBOX_SPAN 0.5
        ${props.emissiveMap3D ? '#define USE_EMISSIVE_GRID 1' : ''}
        ${props.baseColorMap3D ? '#define USE_BASE_COLOR_GRID 1' : ''}
        ${props.maskMap3D ? '#define USE_MASK_GRID 1' : ''}

        #define VOLUME_USE_ENVIRONMENT ${Number(this.useEnvironment)} != 0
        #define VOLUME_USE_HEMI_LIGHTS ${Number(this.useHemisphereLights)} != 0
        #define VOLUME_USE_POINT_LIGHTS ${Number(this.usePointLights)} != 0
        #define VOLUME_USE_DIR_LIGHTS ${Number(this.useDirectionalLights)} != 0
        #define VOLUME_USE_SPOT_LIGHTS ${Number(this.useSpotLights)} != 0
      `;

      const shaderVaryings = `
         varying mat4 mModelMatrix;
         varying mat4 mViewMatrix;
         varying mat4 mProjectionMatrix;
         varying mat4 mModelViewMatrix;
         varying mat4 mInverseModelViewMatrix;
         varying mat3 mInverseNormalMatrix;
      `;

      shader.vertexUvs = true;

      shader.vertexShader = shader.vertexShader
        .replace(
          `#include <common>`,
          `
            ${shaderVaryings}

            out vec3 vOrigin;
            out vec3 vDirection;
            out vec3 vPosition;

            #include <common>
          `
        )
        .replace(
          `#include <worldpos_vertex>`,
          `
            #include <worldpos_vertex>

            vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
            vDirection = position - vOrigin;
            vPosition = position;

            mModelMatrix = modelMatrix;
            mViewMatrix = viewMatrix;
            mProjectionMatrix = projectionMatrix;
            mModelViewMatrix = modelViewMatrix;
            mInverseModelViewMatrix = inverse(modelViewMatrix);
            mInverseNormalMatrix = inverse(normalMatrix);
          `
        );

      const volumeLightsConfig = `
        float lightMarchLimit = resolution + 2.;
        int iLightMarchLimit = int(lightMarchLimit);

        vec3 vUnit = (mModelMatrix * vec4(1., 0., 0., 0.)).xyz;
        float vUnitLength = length(vUnit);
        
        geometry.position = vPoint;

        vec3 iblIrradiance = vec3(0.0);
      `;

      const volumePointLights = `
        PointLight pointLight;
        lightAlbedo = vec3(0.);
        
        for (int lightIndex = 0; lightIndex < NUM_POINT_LIGHTS; lightIndex++) {
          pointLight = pointLights[lightIndex];
          getPointLightInfo(pointLight, geometry, directLight);

          vLightProbe = vec3(vPoint);
          lightAbsorbance = 0.;
          stepAccumulation = 1.;

          lightDirection = vPoint - (mInverseModelViewMatrix * vec4(pointLight.position, 1.)).xyz;
          lightDistance = length(lightDirection) * vUnitLength;
          lightDirection = normalize(lightDirection);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          for (int lightMarch = 0; lightMarch < iLightMarchLimit; lightMarch++) {
            vLightProbe -= vLightStep;
            stepAccumulation += 1.;
            
            lightSample = clampedTexture(densityMap3D, vLightProbe);
            
            lightAbsorbance += blendSample(lightSample) * eInverseAbsorbance;

            if (lightAbsorbance >= 1.) {
              lightAbsorbance = 1.;
              break;
            }
          }

          lightAlbedo += (1. - lightAbsorbance) * pointLight.color;
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `;

      const volumeDirLights = `
        DirectionalLight directionalLight;
        lightAlbedo = vec3(0.);

        for (int lightIndex = 0; lightIndex < NUM_DIR_LIGHTS; lightIndex++) {
          directionalLight = directionalLights[lightIndex];
          getDirectionalLightInfo(directionalLight, geometry, directLight);

          vLightProbe = vec3(vPoint);
          lightAbsorbance = 0.0;
          stepAccumulation = 1.;

          lightDirection = -normalize((vec4(directionalLight.direction, 1.) * viewMatrix).xyz);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          for (int lightMarch = 0; lightMarch < iLightMarchLimit; lightMarch++) {
            vLightProbe -= vLightStep;
            stepAccumulation += 1.;
            
            float lightSample = clampedTexture(densityMap3D, vLightProbe);

            lightAbsorbance += blendSample(lightSample) * eInverseAbsorbance;

            if (lightAbsorbance >= 1.) {
              lightAbsorbance = 1.;
              break;
            }
          }

          lightAlbedo += (1. - lightAbsorbance) * directionalLight.color;
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `;

      const volumeSpotLights = `
        SpotLight spotLight;
        lightAlbedo = vec3(0.);

        float angleCos;
        float spotAttenuation;
        
        for (int lightIndex = 0; lightIndex < NUM_SPOT_LIGHTS; lightIndex++) {
          spotLight = spotLights[lightIndex];
          getSpotLightInfo(spotLight, geometry, directLight);

          vLightProbe = vec3(vPoint);
          lightAbsorbance = 0.0;
          stepAccumulation = 1.;

          lightDirection = vPoint - (mInverseModelViewMatrix * vec4(spotLight.position, 1.)).xyz;
          lightDistance = length(lightDirection) * vUnitLength;
          lightDirection = normalize(lightDirection);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          angleCos = dot(normalize(-lightDirection), normalize(mInverseNormalMatrix * spotLight.direction));
          spotAttenuation = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);

          if (spotAttenuation > 0.) {
            for (int lightMarch = 0; lightMarch < iLightMarchLimit; lightMarch++) {
              vLightProbe -= vLightStep;
              stepAccumulation += 1.;
              
              lightSample = clampedTexture(densityMap3D, vLightProbe);
              
              lightAbsorbance += blendSample(lightSample) * eInverseAbsorbance;

              if (lightAbsorbance >= 1.) {
                lightAbsorbance = 1.;
                break;
              }
            }

            lightAlbedo += (1. - lightAbsorbance) * spotAttenuation * spotLight.color;
          }
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `;

      const volumeHemiLights = `
        lightAlbedo = vec3(0.);
        vec3 textureProbe;

        float absorbanceUp;
        float absorbanceDown;
        float stepAccumulationUp;
        float stepAccumulationDown;

        for (int lightIndex = 0; lightIndex < NUM_HEMI_LIGHTS; lightIndex++) {

          HemisphereLight hemiLight = hemisphereLights[lightIndex];
          vLightProbe = vec3(vPoint);

          absorbanceUp = 0.0;
          absorbanceDown = 0.0;

          stepAccumulationUp = 0.;
          stepAccumulationDown = 0.;

          lightDirection = -normalize((vec4(hemiLight.direction, 1.) * viewMatrix).xyz);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          for (int lightMarch = 1; lightMarch < int(lightMarchLimit / 2.); lightMarch++) {
            if (absorbanceUp < 1.) {
              textureProbe = vLightProbe - float(lightMarch) * vLightStep;
              lightSample = clampedTexture(densityMap3D, textureProbe);

              absorbanceUp += lightSample * eInverseAbsorbance;
              stepAccumulationUp += 1.;
            }
            
            if (absorbanceDown < 1.) {
              textureProbe = vLightProbe + float(lightMarch) * vLightStep;
              lightSample = clampedTexture(densityMap3D, textureProbe);

              absorbanceDown += blendSample(lightSample) * eInverseAbsorbance;
              stepAccumulationDown += 1.;
            }
          }

          absorbanceUp = min(1., absorbanceUp);
          absorbanceDown = min(1., absorbanceDown);

          lightAlbedo += mix(
            (1. - absorbanceUp) * hemiLight.skyColor,
            (1. - absorbanceDown) * hemiLight.groundColor,
            0.5
          );
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `;

      const volumeAmbientLight = `
        vec3 baseColorSample = baseColor.rgb;

        #ifdef USE_BASE_COLOR_GRID
          baseColorSample *= clampedTextureRGB(baseColorMap3D, vPoint);
        #endif

        albedo += ambientLightColor;
      `;

      const volumeEnvMap = `
        vec3 viewDir = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
        vec3 vUVCoords = normalize(lastNonSolidPoint * mInverseNormalMatrix).xyz;

        #if defined( USE_ENVMAP )
          vEnvMapScatter = getIBLIrradiance(vUVCoords) * RECIPROCAL_PI;

          albedo += density * getIBLRadiance(viewDir, vUVCoords, .5) * RECIPROCAL_PI;
        #endif
      `;

      const shaderHelpers = `
        vec2 getVolumeBbox(vec3 vPointOfReference) {
          const vec3 vBoxMin = vec3(-0.5);
          const vec3 vBoxMax = vec3(0.5);
          vec3 vInvPointOfReference = 1.0 / vPointOfReference;
          
          vec3 vMinRange = (-vOrigin - VOLUME_BBOX_SPAN) * vInvPointOfReference;
          vec3 vMaxRange = (-vOrigin + VOLUME_BBOX_SPAN) * vInvPointOfReference;
          
          vec3 vMin = min(vMinRange, vMaxRange);
          vec3 vMax = max(vMinRange, vMaxRange);

          return vec2(
            max(vMin.x, max(vMin.y, vMin.z)),
            min(vMax.x, min(vMax.y, vMax.z))
          );
        }

        vec3 radiation = vec3(0.);
        vec3 getBlackBodyRadiation(float temperature) {
          if (temperature == 0.) {
            return vec3(0.);
          }

          #ifndef USE_EMISSIVE_GRID
            return vec3(0.);
          #endif

          // NOTE Blackbody radiation source - https://www.shadertoy.com/view/4tdGWM
          float temperatureScaled = temperature * 1000.;

          radiation.r += 1. / (exp(19E3 * 1. / temperatureScaled) - 1.);
          radiation.g += 3.375 / (exp(19E3 * 1.5 / temperatureScaled) - 1.);
          radiation.b += 8. / (exp(19E3 * 2. / temperatureScaled) - 1.);

          return (radiation / max(radiation.r,max(radiation.g,radiation.b)));
        }

        float loopUV(float x) {
          if (abs(mod(floor(x), 2.)) == 1.) {
            return ceil(x) - x;
          } else {
            return x - floor(x);
          }
        }

        vec3 mapTextureSample0(vec3 position){
          vec3 uv = position + VOLUME_BBOX_SPAN;

          ${this.wrap3D === Three.RepeatWrapping ? `return mod(uv, 1.);` : ''}
          ${this.wrap3D === 0 || this.wrap3D === Three.ClampToEdgeWrapping ? `// NOTE Return UV` : ''}
          ${this.wrap3D === Three.MirroredRepeatWrapping ? `
            uv.x = loopUV(uv.x);
            uv.y = loopUV(uv.y);
            uv.z = loopUV(uv.z);
          ` : ''}

          return uv;
        }

        vec3 mapTextureSample(vec3 position, vec3 offset){
          vec3 uv = position + VOLUME_BBOX_SPAN + offset;

          ${this.wrap3D === Three.RepeatWrapping ? `return mod(uv, 1.);` : ''}
          ${this.wrap3D === 0 || this.wrap3D === Three.ClampToEdgeWrapping ? `// NOTE Return UV` : ''}
          ${this.wrap3D === Three.MirroredRepeatWrapping ? `
            uv.x = loopUV(uv.x);
            uv.y = loopUV(uv.y);
            uv.z = loopUV(uv.z);
          ` : ''}

          return uv;
        }

        float blendSample(float value) {
          float fSmoothingThreshold = 0.25;
          float fSmoothingBlend = 0.25;

          return smoothstep(
            fSmoothingThreshold - fSmoothingBlend,
            fSmoothingThreshold + fSmoothingBlend,
            value
          ) * densityScale;
        }

        float clampedTexture(sampler3D source, vec3 position) {
          ${this.wrap3D === 0 || this.wrap3D === Three.ClampToEdgeWrapping ? `
            vec3 vAbs = abs(position);

            if (max(vAbs.x, max(vAbs.y, vAbs.z)) > .5) {
              return 0.;
            }
          ` : ''}

          return texture(source, mapTextureSample(position, offset3D)).r;
        }

        float clampedMaskTexture(sampler3D source, vec3 position) {
          ${this.wrap3D === 0 || this.wrap3D === Three.ClampToEdgeWrapping ? `
            vec3 vAbs = abs(position);

            if (max(vAbs.x, max(vAbs.y, vAbs.z)) > .5) {
              return 0.;
            }
          ` : ''}

          return texture(source, mapTextureSample0(position)).r;
        }

        vec3 clampedTextureRGB(sampler3D source, vec3 position) {
          return texture(source, mapTextureSample(position, offset3D)).rgb;
        }
      `;

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <uv_pars_fragment>', `// NOTE Override UV calculations`)
        .replace('#include <packing>', '')
        .replace(
          `#include <common>`,
          `
            precision highp float;
            precision highp sampler2D;
            precision highp sampler3D;

            in vec3 vOrigin;
            in vec3 vDirection;
            in vec3 vPosition;

            uniform sampler3D densityMap3D;
            uniform sampler3D emissiveMap3D;
            uniform sampler3D baseColorMap3D;
            uniform sampler3D maskMap3D;
            uniform vec3 offset3D;
            uniform int wrap3D;

            uniform float steps;
            uniform float absorbance;
            uniform float densityScale;
            uniform vec3 baseColor;
            uniform vec3 scatterColor;
            uniform float resolution;

            uniform float cameraNear;
            uniform float cameraFar;
            uniform sampler2D depthScreenMap;
            uniform vec4 depthView;

            ${shaderProperties}
            ${shaderVaryings}

            #include <common>
            #include <packing>
            #include <uv_pars_fragment>

            ${shaderHelpers}
          `
        )
        .replace(`#include <lights_fragment_begin>`, `// NOTE Override light calculations`)
        .replace(`#include <lights_fragment_maps>`, `// NOTE Override light calculations`)
        .replace(`#include <lights_fragment_end>`, `// NOTE Override light calculations`)
        .replace(
          `#include <output_fragment>`,
            `
            vec3 vWorld = -vViewPosition;

            vec3 vRayDirection = normalize(vDirection);
            vec2 vBounds = getVolumeBbox(vRayDirection);
            vec2 vMaxBounds = getVolumeBbox(vOrigin);
            
            if (vBounds.x > vBounds.y) {
              discard;
            }

            vBounds.x = max(vBounds.x, 0.0);
            vMaxBounds.x = max(vMaxBounds.x, 0.0);

            // Volume movement

            vec3 vPoint = vOrigin + vBounds.x * vRayDirection;
            vec3 vPointStep = 1.0 / abs(vRayDirection);
            float delta = min(vPointStep.x, min(vPointStep.y, vPointStep.z)) / steps;
            vec3 vDirectionDeltaStep = vRayDirection * delta;

            // Density calculations

            float density = 0.0;
            vec3 albedo = vec3(0.);
            vec3 emissive = vec3(0.);
            GeometricContext geometry;
            float volumeSample;
            float emissiveSample;
            float maskSample = 1.;
            float noiseSample;
            float noiseFactor;
            vec3 fTest;

            // Light calculations
            
            vec3 lightAlbedo = vec3(0.);
            vec3 vLightProbe;
            vec3 lightDirection;
            vec3 vLightStep;
            vec3 vEnvMapScatter = vec3(0.0);
            float lightSample;
            float lightAbsorbance;
            float lightDistance;
            float stepAccumulation;
            
            IncidentLight directLight;

            // Utils

            float absorbanceDensityRatio = min(absorbance, densityScale); // NOTE When reducing densityScale, automatically reduce absorbance
            float inverseAbsorbance = 1.0 / absorbanceDensityRatio;
            float inverseDensityScale = 1.0 / densityScale;
            float eInverseAbsorbance = exp(-1. - inverseAbsorbance); // NOTE Wrong, but looks kinda better than exp(-inverseAbsorbance)
            float eDensityAbsorbance = exp(-absorbanceDensityRatio * delta);
            float eInverseDensityScale = exp(-1. - inverseDensityScale);

            // Depth Testing

            vec2 screenUV = gl_FragCoord.xy / depthView.zw;
            float worldDepth = unpackRGBAToDepth(texture2D(depthScreenMap, screenUV));
            float fogDepth = 0.;
            vec3 vProjPoint;

            ${volumeLightsConfig}

            vec3 lastNonSolidPoint = vec3(vPoint);

            for (float i = vBounds.x; i < vBounds.y; i += delta) {
              volumeSample = clampedTexture(densityMap3D, vPoint);
              
              #ifdef USE_MASK_GRID
                maskSample = clampedMaskTexture(maskMap3D, vPoint);
              #endif

              density += blendSample(volumeSample) * eDensityAbsorbance * maskSample;

              #ifdef USE_EMISSIVE_GRID
                emissiveSample = clampedTexture(emissiveMap3D, vPoint);
                emissive = max(emissive, density * vec3(emissiveSample));
              #endif

              if (density < 1.) {
                lastNonSolidPoint = vPoint;
              }

              if (density >= 1.) {
                break;
              }

              vProjPoint = (mModelMatrix * vec4(vPoint, 1.0)).xyz;
              fogDepth = length(vProjPoint - cameraPosition);
              fogDepth = (fogDepth - cameraNear) / (cameraFar - cameraNear);
              fogDepth = saturate(fogDepth);
              
              if (worldDepth < fogDepth) {
                break;
              }

              vPoint += vDirectionDeltaStep;
            }

            density = clamp(density, 0.0, 1.0);

            vPoint = lastNonSolidPoint;

            if (density > 0.) {

              ${volumeAmbientLight}

              #if VOLUME_USE_ENVIRONMENT
                ${volumeEnvMap}
              #endif

              #if NUM_HEMI_LIGHTS > 0 && VOLUME_USE_HEMI_LIGHTS
                ${volumeHemiLights}
              #endif

              #if NUM_POINT_LIGHTS > 0 && VOLUME_USE_POINT_LIGHTS
                ${volumePointLights}
              #endif

              #if NUM_DIR_LIGHTS > 0 && VOLUME_USE_DIR_LIGHTS
                ${volumeDirLights}
              #endif

              #if NUM_SPOT_LIGHTS > 0 && VOLUME_USE_SPOT_LIGHTS
                ${volumeSpotLights}
              #endif

              albedo *= baseColorSample;
            }
 
            emissive = getBlackBodyRadiation(emissive.r);
            albedo += emissive;

            outgoingLight.rgb = vPoint.xyz;
            diffuseColor.a = saturate(density * opacity);

            if (density <= 0.) {
              discard;
            }

            #include <output_fragment>
          `
        );
    };
  }
}

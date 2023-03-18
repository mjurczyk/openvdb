import * as Three from 'three';

export class VolumeBasicMaterial extends Three.MeshStandardMaterial {
  _uniforms = {
    baseColor: { value: new Three.Color() },
    volumeMap: { value: null },
    emissiveMap: { value: null },
    steps: { value: 100 },
    absorbance: { value: 1.0 },
    resolution: { value: 100 }
  };

  set baseColor(value) {
    this._uniforms.baseColor.value.set(value);
  }

  set volumeMap3D(value) {
    this._uniforms.volumeMap.value = value;
  }

  set emissiveMap3D(value) {
    this._uniforms.emissiveMap.value = value;
  }

  set steps(value) {
    this._uniforms.steps.value = value;
  }

  set absorbance(value) {
    this._uniforms.absorbance.value = value;
  }

  set resolution(value) {
    this._uniforms.resolution.value = value;
  }

  constructor(props) {
    super(props);

    this.side = Three.BackSide;
    this.depthWrite = false;
    this.depthTest = false;
    this.transparent = true;
    this.customProgramCacheKey = () => Math.random();

    Object.keys(this._uniforms).forEach(key => {
      if (props[key]) {
        this._uniforms[key].value = props[key];
      }
    });

    this.onBeforeCompile = (shader) => {
      Object.keys(this._uniforms).forEach(key => {
        shader.uniforms[key] = this._uniforms[key];
      });

      shader.isVolumetricFogMaterial = true;

      const shaderProperties = `
        #define VOLUME_BBOX_SPAN 0.5
        ${props.emissiveMap3D ? '#define USE_EMISSIVE_GRID' : ''}
      `;

      const shaderVaryings = `
         varying mat4 mModelMatrix;
         varying mat4 mInverseModelViewMatrix;
         varying mat3 mInverseNormalMatrix;
      `;

      shader.vertexShader = shader.vertexShader
        .replace(
          `#include <common>`,
          `
            ${shaderVaryings}

            out vec3 vOrigin;
            out vec3 vDirection;

            #include <common>
          `
        )
        .replace(
          `#include <worldpos_vertex>`,
          `
            #include <worldpos_vertex>

            vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
            vDirection = position - vOrigin;

            mModelMatrix = modelMatrix;
            mInverseModelViewMatrix = inverse(modelViewMatrix);
            mInverseNormalMatrix = inverse(normalMatrix);
          `
        );

      const volumeLightsConfig = `
        float lightMarchLimit = steps / 2.;

        vec3 vUnit = (mModelMatrix * vec4(1., 0., 0., 0.)).xyz;
        
        geometry.position = vPoint;
      `;

      const volumePointLights = `
        PointLight pointLight;
        lightAlbedo = vec3(0.);
        
        for (int lightIndex = 0; lightIndex < NUM_POINT_LIGHTS; lightIndex++) {
          pointLight = pointLights[lightIndex];
          getPointLightInfo(pointLight, geometry, directLight);

          vec3 vLightProbe = vec3(vPoint);
          float lightAbsorbance = 0.;

          vec3 lightDirection = vPoint - (mInverseModelViewMatrix * vec4(pointLight.position, 1.)).xyz;
          float lightDistance = length(lightDirection) * length(vUnit);
          lightDirection = normalize(lightDirection);
          vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          float stepAccumulation = 1.;

          for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
            vLightProbe -= vLightStep;
            stepAccumulation += 1.;
            
            float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
            
            lightAbsorbance += lightSample * exp(-inverseAbsorbance);

            if (lightAbsorbance >= 1.) {
              lightAbsorbance = 1.;
              break;
            }
          }

          lightAlbedo += (1. / stepAccumulation) * (1. - lightAbsorbance) * pointLight.color;
        }

        lightAlbedo *= volumeSample;
        albedo += lightAlbedo * baseColor.rgb;;
      `;

      const volumeDirLights = `
        DirectionalLight directionalLight;
        lightAlbedo = vec3(0.);

        for (int lightIndex = 0; lightIndex < NUM_DIR_LIGHTS; lightIndex++) {
          directionalLight = directionalLights[lightIndex];
          getDirectionalLightInfo(directionalLight, geometry, directLight);

          vec3 vLightProbe = vec3(vPoint);
          float lightAbsorbance = 0.0;

          vec3 lightDirection = -normalize((vec4(directionalLight.direction, 1.) * viewMatrix).xyz);
          vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          float stepAccumulation = 1.;

          for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
            vLightProbe -= vLightStep;
            stepAccumulation += 1.;
            
            float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
            
            lightAbsorbance += lightSample * exp(-inverseAbsorbance);

            if (lightAbsorbance >= 1.) {
              lightAbsorbance = 1.;
              break;
            }
          }

          lightAlbedo += (1. / stepAccumulation) * (1. - lightAbsorbance) * directionalLight.color;
        }

        lightAlbedo *= volumeSample;
        albedo += lightAlbedo * baseColor.rgb;;
      `;

      const volumeSpotLights = `
        SpotLight spotLight;
        lightAlbedo = vec3(0.);
        
        for (int lightIndex = 0; lightIndex < NUM_SPOT_LIGHTS; lightIndex++) {

          spotLight = spotLights[lightIndex];
          getSpotLightInfo(spotLight, geometry, directLight);

          vec3 vLightProbe = vec3(vPoint);
          float lightAbsorbance = 0.0;

          vec3 lightDirection = vPoint - (mInverseModelViewMatrix * vec4(spotLight.position, 1.)).xyz;
          float lightDistance = length(lightDirection) * length(vUnit);
          lightDirection = normalize(lightDirection);
          vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          float angleCos = dot(normalize(-lightDirection), normalize(mInverseNormalMatrix * spotLight.direction));
          float spotAttenuation = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);

          if (spotAttenuation > 0.) {
            float stepAccumulation = 1.;

            for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
              vLightProbe -= vLightStep;
              stepAccumulation += 1.;
              
              float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
              
              lightAbsorbance += lightSample * exp(-inverseAbsorbance);

              if (lightAbsorbance >= 1.) {
                lightAbsorbance = 1.;
                break;
              }
            }

            lightAlbedo += (1. / stepAccumulation) * (1. - lightAbsorbance) * spotAttenuation * spotLight.color;
          }
        }

        lightAlbedo *= volumeSample;
        albedo += lightAlbedo * baseColor.rgb;;
      `;

      const volumeHemiLights = `
        lightAlbedo = vec3(0.);

        for (int lightIndex = 0; lightIndex < NUM_HEMI_LIGHTS; lightIndex++) {
          HemisphereLight hemiLight = hemisphereLights[lightIndex];

          vec3 vLightProbe = vec3(vPoint);
          float absorbanceUp = 0.0;
          float absorbanceDown = 0.0;

          float stepAccumulationUp = 1.;
          float stepAccumulationDown = 1.;

          vec3 lightDirection = -normalize((vec4(hemiLight.direction, 1.) * viewMatrix).xyz);
          vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;
          float lightSample;

          for (int lightMarch = 1; lightMarch < int(lightMarchLimit / 2.); lightMarch++) {
            vec3 textureProbe = vLightProbe + VOLUME_BBOX_SPAN - float(lightMarch) * vLightStep;

            if (!isOutsideVolume(textureProbe)) {
              lightSample = texture(volumeMap, textureProbe).r;
            
              if (absorbanceUp < 1.) {
                absorbanceUp += exp(-1. / absorbance) * lightSample;
                stepAccumulationUp += 1.;
              }
            }

            textureProbe = vLightProbe + VOLUME_BBOX_SPAN + float(lightMarch) * vLightStep;

            if (!isOutsideVolume(textureProbe)) {
              lightSample = texture(volumeMap, textureProbe).r;
              
              if (absorbanceDown < 1.) {
                absorbanceDown += exp(-1. / absorbance) * lightSample;
                stepAccumulationDown += 1.;
              }
            }
          }

          absorbanceUp = min(1., absorbanceUp);
          absorbanceDown = min(1., absorbanceDown);

          lightAlbedo += mix(
            (1. / stepAccumulationUp) * (1. - absorbanceUp) * hemiLight.skyColor,
            (1. / stepAccumulationDown) * (1. - absorbanceDown) * hemiLight.groundColor,
            0.5
          );
        }

        lightAlbedo *= volumeSample;
        albedo += lightAlbedo * baseColor.rgb;;
      `;

      const volumeAmbientLight = `
        albedo += ambientLightColor * baseColor.rgb;
      `;

      const shaderHelpers = `
        bool isOutsideVolume(vec3 source) {
          return (
            source.x >= 1. ||
            source.y >= 1. ||
            source.z >= 1. ||
            source.x <= 0. ||
            source.y <= 0. ||
            source.z <= 0.
          );
        }

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
          float temperatureScaled = temperature * 16000.;

          radiation.r += 1. / (exp(19E3 * 1. / temperatureScaled) - 1.);
          radiation.g += 3.375 / (exp(19E3 * 1.5 / temperatureScaled) - 1.);
          radiation.b += 8. / (exp(19E3 * 2. / temperatureScaled) - 1.);

          return (radiation / max(radiation.r,max(radiation.g,radiation.b)));
        }
      `;

      shader.fragmentShader = shader.fragmentShader
        .replace(
          `#include <common>`,
          `
            precision highp float;
            precision highp sampler3D;

            in vec3 vOrigin;
            in vec3 vDirection;

            uniform sampler3D volumeMap;
            uniform sampler3D emissiveMap;

            uniform float steps;
            uniform float absorbance;
            uniform vec3 baseColor;
            uniform float resolution;

            ${shaderProperties}
            ${shaderVaryings}
            ${shaderHelpers}

            #include <common>
          `
        )
        .replace(`#include <lights_fragment_begin>`, `// NOTE Override light calculations`)
        .replace(`#include <lights_fragment_end>`, `// NOTE Override light calculations`)
        .replace(
          `#include <output_fragment>`,
            `
            vec3 vWorld = -vViewPosition;

            GeometricContext geometry;

            IncidentLight directLight;

            vec3 vRayDirection = normalize(vDirection);
            vec2 vBounds = getVolumeBbox(vRayDirection);
            
            if (vBounds.x > vBounds.y) {
              discard;
            }

            vBounds.x = max(vBounds.x, 0.0);

            vec3 vPoint = vOrigin + vBounds.x * vRayDirection;
            vec3 vPointStep = 1.0 / abs(vRayDirection);

            float delta = min(vPointStep.x, min(vPointStep.y, vPointStep.z)) / steps;
            vec3 vDirectionDeltaStep = vRayDirection * delta;

            float density = 0.0;
            vec3 albedo = vec3(0.);
            vec3 emissive = vec3(0.);
            
            vec3 lightAlbedo = vec3(0.);

            float inverseAbsorbance = 1.0 / absorbance;

            ${volumeLightsConfig}

            for (float i = vBounds.x; i < vBounds.y; i += delta) {
              float volumeSample = texture(volumeMap, vPoint + VOLUME_BBOX_SPAN).r;

              density += volumeSample * exp(-inverseAbsorbance) / 3.;

              #ifdef USE_EMISSIVE_GRID
                float emissiveSample = texture(emissiveMap, vPoint + VOLUME_BBOX_SPAN).r;
                emissive = max(emissive, vec3(emissiveSample));
              #endif

              ${volumeAmbientLight}

              #if NUM_HEMI_LIGHTS > 0
                ${volumeHemiLights}
              #endif

              #if NUM_POINT_LIGHTS > 0
                ${volumePointLights}
              #endif

              #if NUM_DIR_LIGHTS > 0
                ${volumeDirLights}
              #endif

              #if NUM_SPOT_LIGHTS > 0
                ${volumeSpotLights}
              #endif

              // TODO Emissive based on temperature
              // TODO Light probes
              // TODO RectArea lights

              vPoint += vDirectionDeltaStep;

              if (density >= 1.) {
                density = 1.;
                break;
              }
            }

            emissive = getBlackBodyRadiation(emissive.r);

            outgoingLight.rgb = max(albedo, emissive);
            diffuseColor.a = density * opacity;

            if (density <= 0.) {
              discard;
            }

            #include <output_fragment>
          `
        );
    };
  }
}

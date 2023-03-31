import * as Three from 'three';

export class VolumeNormalMaterial extends Three.MeshPhongMaterial {
  _uniforms = {
    baseColor: { value: new Three.Color(0xffffff) },
    scatterColor: { value: new Three.Color(0x000000) },
    densityMap3D: { value: null },
    emissiveMap3D: { value: null },
    steps: { value: 100 },
    absorbance: { value: 1.0 },
    densityScale: { value: 1.0 },
    resolution: { value: 100 },
    offset3D: { value: new Three.Vector3(0.0, 0.0, 0.0) },
    wrap3D: { value: Three.ClampToEdgeWrapping },
    noiseScale: { value: 0.5 },
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
  }

  get emissiveMap3D() {
    return this._uniforms.emissiveMap3D.value;
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

  set noiseScale(value) {
    this._uniforms.noiseScale.value = value;
  }

  get noiseScale() {
    return this._uniforms.noiseScale.value;
  }

  constructor(props = {}) {
    super();

    this.side = Three.BackSide;
    this.depthWrite = false;
    this.depthTest = true;
    this.transparent = true;
    this.customProgramCacheKey = () => Math.random();

    Object.keys(this._uniforms).forEach(key => {
      if (props[key]) {
        this[key] = props[key];

        if (props[key] instanceof Three.Texture) {
          props[key].offset3D = this._uniforms.offset3D.value;
        }
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

      shader.vertexUvs = true;

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
            
            lightSample = texture(densityMap3D, mapTextureSample(vLightProbe)).r;
            
            lightAbsorbance += lightSample * eInverseAbsorbance;

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
            
            lightSample = texture(densityMap3D, mapTextureSample(vLightProbe)).r;
            
            lightAbsorbance += lightSample * eInverseAbsorbance;

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
              
              lightSample = texture(densityMap3D, mapTextureSample(vLightProbe)).r;
              
              lightAbsorbance += lightSample * eInverseAbsorbance;

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
              lightSample = texture(densityMap3D, mapTextureSample(textureProbe)).r;

              absorbanceUp += lightSample * eInverseAbsorbance;
              stepAccumulationUp += 1.;
            }
            
            if (absorbanceDown < 1.) {
              textureProbe = vLightProbe + float(lightMarch) * vLightStep;
              lightSample = texture(densityMap3D, mapTextureSample(textureProbe)).r;

              absorbanceDown += lightSample * eInverseAbsorbance;
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

        vec3 mapTextureSample(vec3 position) {
          vec3 uv = position + VOLUME_BBOX_SPAN + offset3D;

          if (wrap3D == 1000) {
            uv = mod(uv, 1.);
          } else if (wrap3D == 0 || wrap3D == 1001) {
            return uv;
          } else if (wrap3D == 1002) {
            uv.x = loopUV(uv.x);
            uv.y = loopUV(uv.y);
            uv.z = loopUV(uv.z);
          }

          return uv;
        }

        // NOTE GLSL Noise source - https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1. + 3.0 * C.xxx;

          i = mod(i, 289.0 ); 
          vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          float n_ = 1.0/7.0; // N=7
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        float fbm(vec3 x) {
          vec3 y = vec3(x);
          float v = 0.0;
          float a = 0.75;
          vec3 shift = vec3(1000.);
          for (int i = 0; i < 3; ++i) {
            y = y * 10000.0 + shift;
            v += a * snoise(y);
            a *= 0.5;
          }
          return v;
        }
      `;

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <uv_pars_fragment>', `// NOTE Override UV calculations`)
        .replace('#include <uv2_pars_fragment>', `// NOTE Override UV calculations`)
        .replace(
          `#include <common>`,
          `
            precision highp float;
            precision highp sampler3D;

            in vec3 vOrigin;
            in vec3 vDirection;

            uniform sampler3D densityMap3D;
            uniform sampler3D emissiveMap3D;
            uniform vec3 offset3D;
            uniform int wrap3D;

            uniform float steps;
            uniform float absorbance;
            uniform float densityScale;
            uniform vec3 baseColor;
            uniform vec3 scatterColor;
            uniform float resolution;
            uniform float noiseScale;

            ${shaderProperties}
            ${shaderVaryings}
            ${shaderHelpers}

            #include <common>
            #include <uv_pars_fragment>
            #include <uv2_pars_fragment>
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
            
            if (vBounds.x > vBounds.y) {
              discard;
            }

            vBounds.x = max(vBounds.x, 0.0);

            // Volume movement

            vec3 vPoint = vOrigin + vBounds.x * vRayDirection;
            vec3 vPointStep = 1.0 / abs(vRayDirection);
            float delta = min(vPointStep.x, min(vPointStep.y, vPointStep.z)) / steps;
            vec3 vDirectionDeltaStep = vRayDirection * delta;

            // Density calculations

            float density = 0.0;
            float smoothness = 0.0;
            vec3 albedo = vec3(0.);
            vec3 emissive = vec3(0.);
            GeometricContext geometry;
            float volumeSample;
            float emissiveSample;
            float noiseSample;

            // Light calculations
            
            vec3 lightAlbedo = vec3(0.);
            vec3 vLightProbe;
            vec3 lightDirection;
            vec3 vLightStep;
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

            ${volumeLightsConfig}

            vec3 lastNonSolidPoint = vec3(vPoint);

            for (float i = vBounds.x; i < vBounds.y; i += delta) {
              volumeSample = texture(densityMap3D, mapTextureSample(vPoint)).r;
              
              density += volumeSample * eDensityAbsorbance;
              smoothness += volumeSample * eInverseDensityScale;

              #ifdef USE_EMISSIVE_GRID
                emissiveSample = texture(emissiveMap3D, mapTextureSample(vPoint)).r;
                emissive = max(emissive, density * vec3(emissiveSample));
              #endif

              if (density < 1.) {
                lastNonSolidPoint = vPoint;
              }

              if (density >= 1. && smoothness >= 1.) {
                break;
              }

              vPoint += vDirectionDeltaStep;
            }

            density = clamp(density, 0.0, 1.0);
            smoothness = clamp(smoothness, 0.0, 1.0);

            vPoint = lastNonSolidPoint;

            emissive = getBlackBodyRadiation(emissive.r);
            albedo += emissive;

            float smoothnessBlend = smoothstep(0.0, 1.0, smoothness);
            float opacityNoise = noiseScale > 0. ? smoothness + (abs(fbm(mapTextureSample(vPoint))) * noiseScale + (1. - noiseScale)) : smoothness + 1.;

            outgoingLight.rgb = vPoint.xyz;
            diffuseColor.a = smoothnessBlend * saturate(density * opacity) * opacityNoise;

            if (density <= 0.) {
              discard;
            }

            #include <output_fragment>
          `
        );
    };
  }
}

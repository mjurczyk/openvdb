import * as Three from 'three';
import { getUuid } from '../utils/uuid';

export class VolumeBasicMaterial extends Three.MeshPhongMaterial {
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
    this.customProgramCacheKey = () => getUuid();

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
          lightAbsorbance = 0.1;
          stepAccumulation = 1.;

          lightDirection = -normalize((vec4(directionalLight.direction, 1.) * viewMatrix).xyz);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          for (int lightMarch = 0; lightMarch < iLightMarchLimit; lightMarch++) {
            stepAccumulation += 1.;
            vLightProbe -= vLightStep;
            
            float lightSample = clampedTexture(densityMap3D, vLightProbe);

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
              
              lightSample = clampedTexture(densityMap3D, vLightProbe);
              
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
              lightSample = clampedTexture(densityMap3D, textureProbe);

              absorbanceUp += lightSample * eInverseAbsorbance;
              stepAccumulationUp += 1.;
            }
            
            if (absorbanceDown < 1.) {
              textureProbe = vLightProbe + float(lightMarch) * vLightStep;
              lightSample = clampedTexture(densityMap3D, textureProbe);

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

        vec3 mapTextureSample(vec3 position){
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

        float clampedTexture(sampler3D source, vec3 position) {
          vec3 vAbs = abs(position);

          if (
            (wrap3D == 0 || wrap3D == 1001) &&
            max(vAbs.x, max(vAbs.y, vAbs.z)) > .5
          ) {
            return 0.0;
          } else {
            return texture(source, mapTextureSample(position)).r;
          }
        }

        #define NUM_RADIAL_RINGS 1
        #define NUM_RADIAL_SAMPLES 8

        vec2 rotateSamplingVector(vec2 v, float a) {
          float s = sin(a);
          float c = cos(a);
          mat2 m = mat2(c, -s, s, c);
          return m * v;
        }

        vec3 vRadN(float x, float y, float z) {
          return normalize(vec3(x, y, z)) * max(abs(z), max(abs(x), abs(y)));
        }

        float averageTextureAround(sampler3D densityMap3D, vec3 vCenter, vec3 vDirection, float fStepSize) {
          // NOTE Radial density sampling around the centre point

          float s = 1. / resolution;
          float n = 1.;

          float sampleA1 = texture(densityMap3D, mapTextureSample(vCenter)).r;
          float sampleA2 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, 0., 0.))).r;
          float sampleA3 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, 0., 0.))).r * n;
          float sampleA4 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., 0., s))).r;
          float sampleA5 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., 0., -s))).r * n;
          float sampleA6 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., s, 0.))).r;
          float sampleA7 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., -s, 0.))).r;

          // center
          // float sampleA1 = texture(densityMap3D, mapTextureSample(vCenter)).r;
          // float sampleA2 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, 0., 0.))).r;
          // float sampleA3 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, 0., 0.))).r * n;
          // float sampleA4 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., 0., s))).r;
          // float sampleA5 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., 0., -s))).r * n;
          // float sampleA6 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, 0., -s))).r;
          // float sampleA7 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, 0., s))).r * n;
          // float sampleA8 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, 0., s))).r;
          // float sampleA9 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, 0., -s))).r * n;

          return sampleA1;

          return round(max(
            sampleA1, max(
              sampleA2, max(
                sampleA3, max(
                  sampleA4, max(
                    sampleA5, max(
                      sampleA6,
                      sampleA7
                    )
                  )
                )
              )
            )
          ));

          // top
          // float sampleB1 = 0.;
          // float sampleB2 = 0.;
          // float sampleB3 = 0.;
          // float sampleB4 = 0.;
          // float sampleB5 = 0.;
          // float sampleB6 = 0.;
          // float sampleB7 = 0.;
          // float sampleB8 = 0.;
          // float sampleB9 = 0.;

          // if (vCenter.y + s < .5) {
          //   sampleB1 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., s, 0.))).r * n;
          //   sampleB2 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, s, 0.))).r;
          //   sampleB3 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, s, 0.))).r * n;
          //   sampleB4 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., s, s))).r;
          //   sampleB5 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., s, -s))).r * n;
          //   sampleB6 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, s, s))).r;
          //   sampleB7 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, s, -s))).r * n;
          //   sampleB8 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, s, s))).r;
          //   sampleB9 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, s, -s))).r * n;
          // }

          // bottom
          // float sampleC1 = 0.;
          // float sampleC2 = 0.;
          // float sampleC3 = 0.;
          // float sampleC4 = 0.;
          // float sampleC5 = 0.;
          // float sampleC6 = 0.;
          // float sampleC7 = 0.;
          // float sampleC8 = 0.;
          // float sampleC9 = 0.;

          // if (vCenter.y - s > -.5) {
          //   sampleC1 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., -s, 0.))).r * n;
          //   sampleC2 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, -s, 0.))).r;
          //   sampleC3 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, -s, 0.))).r * n;
          //   sampleC4 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., -s, s))).r;
          //   sampleC5 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(0., -s, -s))).r * n;
          //   sampleC6 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, -s, s))).r;
          //   sampleC7 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(s, -s, -s))).r * n;
          //   sampleC8 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, -s, s))).r;
          //   sampleC9 = texture(densityMap3D, mapTextureSample(vCenter + vRadN(-s, -s, -s))).r * n;
          // }

          // return (
          //   sampleA1 +
          //   sampleA2 +
          //   sampleA3 +
          //   sampleA4 +
          //   sampleA5 +
          //   sampleA6 +
          //   sampleA7 +
          //   sampleA8 +
          //   sampleA9 +
          //   sampleB1 +
          //   sampleB2 +
          //   sampleB3 +
          //   sampleB4 +
          //   sampleB5 +
          //   sampleB6 +
          //   sampleB7 +
          //   sampleB8 +
          //   sampleB9 +
          //   sampleC1 +
          //   sampleC2 +
          //   sampleC3 +
          //   sampleC4 +
          //   sampleC5 +
          //   sampleC6 +
          //   sampleC7 +
          //   sampleC8 +
          //   sampleC9
          // ) / 27.;
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
          float a = .5;
          vec3 shift = vec3(10.);
          for (int i = 0; i < 3; ++i) {
            y = y * 10000.0 + shift;
            v += a * snoise(y);
            a *= 0.33;
          }
          return v;
        }

        vec3 permute(vec3 x) {
          return mod((34.0 * x + 1.0) * x, 289.0);
        }
        
        vec3 dist(vec3 x, vec3 y, vec3 z,  bool manhattanDistance) {
          return manhattanDistance ?  abs(x) + abs(y) + abs(z) :  (x * x + y * y + z * z);
        }
        
        vec2 worley(vec3 P, float jitter, bool manhattanDistance) {
        float K = 0.142857142857; // 1/7
        float Ko = 0.428571428571; // 1/2-K/2
        float  K2 = 0.020408163265306; // 1/(7*7)
        float Kz = 0.166666666667; // 1/6
        float Kzo = 0.416666666667; // 1/2-1/6*2
        
          vec3 Pi = mod(floor(P), 289.0);
           vec3 Pf = fract(P) - 0.5;
        
          vec3 Pfx = Pf.x + vec3(1.0, 0.0, -1.0);
          vec3 Pfy = Pf.y + vec3(1.0, 0.0, -1.0);
          vec3 Pfz = Pf.z + vec3(1.0, 0.0, -1.0);
        
          vec3 p = permute(Pi.x + vec3(-1.0, 0.0, 1.0));
          vec3 p1 = permute(p + Pi.y - 1.0);
          vec3 p2 = permute(p + Pi.y);
          vec3 p3 = permute(p + Pi.y + 1.0);
        
          vec3 p11 = permute(p1 + Pi.z - 1.0);
          vec3 p12 = permute(p1 + Pi.z);
          vec3 p13 = permute(p1 + Pi.z + 1.0);
        
          vec3 p21 = permute(p2 + Pi.z - 1.0);
          vec3 p22 = permute(p2 + Pi.z);
          vec3 p23 = permute(p2 + Pi.z + 1.0);
        
          vec3 p31 = permute(p3 + Pi.z - 1.0);
          vec3 p32 = permute(p3 + Pi.z);
          vec3 p33 = permute(p3 + Pi.z + 1.0);
        
          vec3 ox11 = fract(p11*K) - Ko;
          vec3 oy11 = mod(floor(p11*K), 7.0)*K - Ko;
          vec3 oz11 = floor(p11*K2)*Kz - Kzo; // p11 < 289 guaranteed
        
          vec3 ox12 = fract(p12*K) - Ko;
          vec3 oy12 = mod(floor(p12*K), 7.0)*K - Ko;
          vec3 oz12 = floor(p12*K2)*Kz - Kzo;
        
          vec3 ox13 = fract(p13*K) - Ko;
          vec3 oy13 = mod(floor(p13*K), 7.0)*K - Ko;
          vec3 oz13 = floor(p13*K2)*Kz - Kzo;
        
          vec3 ox21 = fract(p21*K) - Ko;
          vec3 oy21 = mod(floor(p21*K), 7.0)*K - Ko;
          vec3 oz21 = floor(p21*K2)*Kz - Kzo;
        
          vec3 ox22 = fract(p22*K) - Ko;
          vec3 oy22 = mod(floor(p22*K), 7.0)*K - Ko;
          vec3 oz22 = floor(p22*K2)*Kz - Kzo;
        
          vec3 ox23 = fract(p23*K) - Ko;
          vec3 oy23 = mod(floor(p23*K), 7.0)*K - Ko;
          vec3 oz23 = floor(p23*K2)*Kz - Kzo;
        
          vec3 ox31 = fract(p31*K) - Ko;
          vec3 oy31 = mod(floor(p31*K), 7.0)*K - Ko;
          vec3 oz31 = floor(p31*K2)*Kz - Kzo;
        
          vec3 ox32 = fract(p32*K) - Ko;
          vec3 oy32 = mod(floor(p32*K), 7.0)*K - Ko;
          vec3 oz32 = floor(p32*K2)*Kz - Kzo;
        
          vec3 ox33 = fract(p33*K) - Ko;
          vec3 oy33 = mod(floor(p33*K), 7.0)*K - Ko;
          vec3 oz33 = floor(p33*K2)*Kz - Kzo;
        
          vec3 dx11 = Pfx + jitter*ox11;
          vec3 dy11 = Pfy.x + jitter*oy11;
          vec3 dz11 = Pfz.x + jitter*oz11;
        
          vec3 dx12 = Pfx + jitter*ox12;
          vec3 dy12 = Pfy.x + jitter*oy12;
          vec3 dz12 = Pfz.y + jitter*oz12;
        
          vec3 dx13 = Pfx + jitter*ox13;
          vec3 dy13 = Pfy.x + jitter*oy13;
          vec3 dz13 = Pfz.z + jitter*oz13;
        
          vec3 dx21 = Pfx + jitter*ox21;
          vec3 dy21 = Pfy.y + jitter*oy21;
          vec3 dz21 = Pfz.x + jitter*oz21;
        
          vec3 dx22 = Pfx + jitter*ox22;
          vec3 dy22 = Pfy.y + jitter*oy22;
          vec3 dz22 = Pfz.y + jitter*oz22;
        
          vec3 dx23 = Pfx + jitter*ox23;
          vec3 dy23 = Pfy.y + jitter*oy23;
          vec3 dz23 = Pfz.z + jitter*oz23;
        
          vec3 dx31 = Pfx + jitter*ox31;
          vec3 dy31 = Pfy.z + jitter*oy31;
          vec3 dz31 = Pfz.x + jitter*oz31;
        
          vec3 dx32 = Pfx + jitter*ox32;
          vec3 dy32 = Pfy.z + jitter*oy32;
          vec3 dz32 = Pfz.y + jitter*oz32;
        
          vec3 dx33 = Pfx + jitter*ox33;
          vec3 dy33 = Pfy.z + jitter*oy33;
          vec3 dz33 = Pfz.z + jitter*oz33;
        
          vec3 d11 = dist(dx11, dy11, dz11, manhattanDistance);
          vec3 d12 =dist(dx12, dy12, dz12, manhattanDistance);
          vec3 d13 = dist(dx13, dy13, dz13, manhattanDistance);
          vec3 d21 = dist(dx21, dy21, dz21, manhattanDistance);
          vec3 d22 = dist(dx22, dy22, dz22, manhattanDistance);
          vec3 d23 = dist(dx23, dy23, dz23, manhattanDistance);
          vec3 d31 = dist(dx31, dy31, dz31, manhattanDistance);
          vec3 d32 = dist(dx32, dy32, dz32, manhattanDistance);
          vec3 d33 = dist(dx33, dy33, dz33, manhattanDistance);
        
          vec3 d1a = min(d11, d12);
          d12 = max(d11, d12);
          d11 = min(d1a, d13); // Smallest now not in d12 or d13
          d13 = max(d1a, d13);
          d12 = min(d12, d13); // 2nd smallest now not in d13
          vec3 d2a = min(d21, d22);
          d22 = max(d21, d22);
          d21 = min(d2a, d23); // Smallest now not in d22 or d23
          d23 = max(d2a, d23);
          d22 = min(d22, d23); // 2nd smallest now not in d23
          vec3 d3a = min(d31, d32);
          d32 = max(d31, d32);
          d31 = min(d3a, d33); // Smallest now not in d32 or d33
          d33 = max(d3a, d33);
          d32 = min(d32, d33); // 2nd smallest now not in d33
          vec3 da = min(d11, d21);
          d21 = max(d11, d21);
          d11 = min(da, d31); // Smallest now in d11
          d31 = max(da, d31); // 2nd smallest now not in d31
          d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;
          d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx; // d11.x now smallest
          d12 = min(d12, d21); // 2nd smallest now not in d21
          d12 = min(d12, d22); // nor in d22
          d12 = min(d12, d31); // nor in d31
          d12 = min(d12, d32); // nor in d32
          d11.yz = min(d11.yz,d12.xy); // nor in d12.yz
          d11.y = min(d11.y,d12.z); // Only two more to go
          d11.y = min(d11.y,d11.z); // Done! (Phew!)
          return sqrt(d11.xy); // F1, F2
        
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
            in vec3 vPosition;

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
            float smoothness = 0.0;
            vec3 albedo = vec3(0.);
            vec3 emissive = vec3(0.);
            GeometricContext geometry;
            float volumeSample;
            float emissiveSample;
            float noiseSample;
            float noiseFactor;

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

            noiseSample = fbm(vPoint * 100.);
            noiseFactor = abs(noiseSample) * noiseScale + (1. - noiseScale);

            float samples = 1.;
            float maxSamples = 1.;

            for (float i = vMaxBounds.x; i < vMaxBounds.y; i += delta) {
              maxSamples += 1.;
            }

            for (float i = vBounds.x; i < vBounds.y; i += delta) {
              if (density < 1.) {
                // volumeSample = averageTextureAround(densityMap3D, vPoint, noiseFactor, delta);
                volumeSample = texture(densityMap3D, mapTextureSample(vPoint)).r;
              } else {
                volumeSample = 1.;
              }

              density += volumeSample;
              // smoothness += .01;

              #ifdef USE_EMISSIVE_GRID
                emissiveSample = texture(emissiveMap3D, mapTextureSample(vPoint)).r;
                emissive = max(emissive, density * vec3(emissiveSample));
              #endif

              if (density < 1.) {
                lastNonSolidPoint = vPoint;
              }

              if (volumeSample  > .1) {
                samples += 1.;
              }

              if (density >= 1.) {
                break;
              }

              vPoint += vDirectionDeltaStep;
            }

            density = clamp(density, 0.0, 1.0);
            // smoothness = clamp(smoothness, 0.0, 1.0);
            
            vPoint = lastNonSolidPoint;

            if (density > 0.) {

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

            }

            float fauxBeer = (1. - (samples / maxSamples) / steps * 4.0) * (1. - absorbance);
            float smoothnessBlend = smoothness;
            float opacityNoise = saturate(noiseScale > 0. ? smoothness + noiseFactor : smoothness + 1.);

            emissive = getBlackBodyRadiation(emissive.r);
            albedo += emissive;
            // albedo += mix(scatterColor, baseColor, fauxBeer);

            outgoingLight.rgb = vPoint;
            // outgoingLight.rgb = max(scatterColor, albedo);
            diffuseColor.a = density * opacity;
            // diffuseColor.a = density * opacity;

            if (diffuseColor.a <= 0.) {
              discard;
            }

            #include <output_fragment>
          `
        );
    };
  }
}

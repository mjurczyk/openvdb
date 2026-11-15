import * as Three from 'three';
import { buildPointData } from '../pointsCore.js';
import {
  liquidWater,
  liquidRoughness,
  liquidMaxLights,
  liquidMaxPoints,
  liquidFilterSigma,
  liquidFilterDepthRange,
  liquidFilterIterations,
  liquidFilterMaxRadius,
  liquidThicknessResolution,
  liquidThicknessSigma,
  liquidLodSpacing,
  createLiquidGeometry,
  createLiquidLightState,
  collectLiquidLights,
  getLiquidWorldScale,
  getLiquidEdgeThickness,
  getLiquidPixelScale,
} from '../liquidCore.js';

const drawingSize = new Three.Vector2();
const clearColor = new Three.Color();

const f0 = ((liquidWater.ior - 1.0) / (liquidWater.ior + 1.0)) ** 2;

// NOTE Instanced fullscreen triangle. instanceCount 0 skips the draw (no points yet).
const createCompositeGeometry = () => {
  const geometry = new Three.InstancedBufferGeometry();

  geometry.setAttribute('position', new Three.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geometry.instanceCount = 0;

  return geometry;
};

const createTarget = (type, format, depthBuffer, filter = Three.NearestFilter) =>
  new Three.WebGLRenderTarget(1, 1, {
    type,
    format,
    minFilter: filter,
    magFilter: filter,
    generateMipmaps: false,
    depthBuffer,
  });

const createPassScene = (material, geometry) => {
  const scene = new Three.Scene();
  const mesh = new Three.Mesh(geometry, material);

  scene.matrixWorldAutoUpdate = false;
  mesh.matrixAutoUpdate = false;
  mesh.frustumCulled = false;
  scene.add(mesh);

  return { scene, mesh };
};

// NOTE Uniforms of all passes of one liquid object
const createUniforms = () => ({
  liquidWorldScale: { value: 1.0 },
  liquidSpacing: { value: 1.0 },
  liquidTargetSize: { value: new Three.Vector2(1.0, 1.0) },
  liquidProjectionInverse: { value: new Three.Matrix4() },
  liquidOrthographic: { value: 0.0 },
  liquidNear: { value: 0.1 },
  liquidFar: { value: 1000.0 },
  liquidPixelScale: { value: 1.0 },
  liquidFilterSigma: { value: 1.0 },
  liquidDepthSigma: { value: 1.0 },
  liquidThicknessSize: { value: new Three.Vector2(1.0, 1.0) },
  liquidThicknessPixelScale: { value: 1.0 },
  liquidThicknessSigma: { value: 1.0 },
  liquidAbsorption: { value: liquidWater.absorption.clone() },
  liquidTint: { value: new Three.Color(1.0, 1.0, 1.0) },
  liquidEdgeThickness: { value: 1.0 },
  liquidRadiusScale: { value: 1.0 },
  liquidLod: { value: 0.0 },
});

// NOTE Distance detail scale at a view distance: 1.0 near, larger where the point spacing on screen is below
// liquidLodSpacing. The shader declares liquidSpacing, liquidWorldScale, liquidPixelScale and liquidOrthographic.
const lodChunk = `
  uniform float liquidLod;

  float liquidLodScale(float viewDistance) {
    float distanceScale = liquidOrthographic > 0.5 ? 1.0 : viewDistance;
    float pixelSpacing = liquidSpacing * liquidWorldScale * liquidPixelScale / distanceScale;

    return liquidLod > 0.5 ? max(${liquidLodSpacing.toFixed(1)} / pixelSpacing, 1.0) : 1.0;
  }
`;

const commonChunk = `
  uniform float liquidOrthographic;
  uniform float liquidNear;
  uniform float liquidFar;

  // NOTE Window depth of a view z, for perspective and orthographic cameras
  float liquidWindowDepth(float viewZ) {
    if (liquidOrthographic > 0.5) {
      return (viewZ + liquidNear) / (liquidNear - liquidFar);
    }

    return ((liquidNear + viewZ) * liquidFar) / ((liquidFar - liquidNear) * viewZ);
  }
`;

// NOTE Sphere impostors. The square faces the camera, the fragment adds the sphere depth (Green, GDC 2010).
// NOTE Distance detail: points with a rank above 1 / lodScale^3 are moved out of the clip volume.
// Spheres grow by lodScale. The volume scale (point volume / sphere volume) does not change with it.
const splatVertexShader = `
  #include <common>

  attribute vec3 liquidCenter;
  attribute float liquidRadius;
  attribute float liquidRank;

  #ifdef USE_COLOR_ATTRIBUTE
    attribute vec3 liquidColor;
    varying vec3 vLiquidColor;
  #endif

  uniform float liquidWorldScale;
  uniform float liquidSpacing;
  uniform float liquidPixelScale;
  uniform float liquidOrthographic;
  uniform float liquidRadiusScale;

  ${lodChunk}

  varying vec2 vLiquidCorner;
  varying float vLiquidCenterZ;
  varying float vLiquidRadius;
  varying float vLiquidVdbRadius;
  varying float vLiquidVolumeScale;

  void main() {
    vec3 viewCenter = (modelViewMatrix * vec4(liquidCenter, 1.0)).xyz;
    float radius = liquidRadius * liquidRadiusScale;
    float lodScale = liquidLodScale(-viewCenter.z);
    float lodRadius = radius * lodScale;
    float viewRadius = lodRadius * liquidWorldScale;

    vLiquidCorner = position.xy;
    vLiquidCenterZ = viewCenter.z;
    vLiquidRadius = viewRadius;
    vLiquidVdbRadius = lodRadius;
    vLiquidVolumeScale = pow(liquidSpacing, 3.0) / (pow(radius, 3.0) * (4.0 / 3.0) * PI);

    #ifdef USE_COLOR_ATTRIBUTE
      vLiquidColor = liquidColor;
    #endif

    gl_Position = liquidRank < 1.0 / pow(lodScale, 3.0)
      ? projectionMatrix * vec4(viewCenter + vec3(position.xy * viewRadius, 0.0), 1.0)
      : vec4(0.0, 0.0, 2.0, 1.0);
  }
`;

const splatHeightChunk = `
  varying vec2 vLiquidCorner;
  varying float vLiquidCenterZ;
  varying float vLiquidRadius;
  varying float vLiquidVdbRadius;
  varying float vLiquidVolumeScale;

  float liquidHeight() {
    float distance2 = dot(vLiquidCorner, vLiquidCorner);

    if (distance2 > 1.0) {
      discard;
    }

    return sqrt(1.0 - distance2);
  }
`;

// NOTE R: view distance of the nearest sphere surface. The depth buffer keeps the nearest.
const depthFragmentShader = `
  ${commonChunk}
  ${splatHeightChunk}

  void main() {
    float surfaceZ = vLiquidCenterZ + vLiquidRadius * liquidHeight();

    gl_FragColor = vec4(-surfaceZ, 0.0, 0.0, 1.0);
    gl_FragDepth = liquidWindowDepth(surfaceZ);
  }
`;

// NOTE RGB: Cd * thickness (Cd is white without the attribute), then RGB / A is the mean Cd. A: thickness in VDB units.
// NOTE Spheres overlap, so each chord is scaled by the volume of one point (spacing^3) / the sphere volume.
const thicknessFragmentShader = `
  #include <common>

  ${splatHeightChunk}

  #ifdef USE_COLOR_ATTRIBUTE
    varying vec3 vLiquidColor;
  #endif

  void main() {
    float chord = vLiquidVdbRadius * 2.0 * liquidHeight() * vLiquidVolumeScale;
    vec3 color = vec3(1.0);

    #ifdef USE_COLOR_ATTRIBUTE
      color = vLiquidColor;
    #endif

    gl_FragColor = vec4(color * chord, chord);
  }
`;

const fullscreenVertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// NOTE One axis of a separable filter. Kernel size is in world units (sigma in pixels at each depth), 2 sigma wide.
// DEPTH_FILTER: bilateral filter of the view distance (R). Empty pixels (0.0) are not used and stay empty.
// Else: Gaussian filter of the half-resolution thickness (RGBA). Sigma from the filtered depth.
const filterFragmentShader = `
  uniform sampler2D liquidSourceMap;
  uniform sampler2D liquidDistanceMap;
  uniform vec2 liquidTargetSize;
  uniform vec2 liquidThicknessSize;
  uniform vec2 liquidDirection;
  uniform float liquidOrthographic;
  uniform float liquidPixelScale;
  uniform float liquidFilterSigma;
  uniform float liquidDepthSigma;
  uniform float liquidThicknessPixelScale;
  uniform float liquidThicknessSigma;
  uniform float liquidSpacing;
  uniform float liquidWorldScale;

  ${lodChunk}

  // NOTE Distance detail spheres are larger, so the sigma is too
  float liquidPixelSigma(float worldSigma, float pixelScale, float viewDistance) {
    float distanceScale = liquidOrthographic > 0.5 ? 1.0 : viewDistance;

    return max(worldSigma * liquidLodScale(viewDistance) * pixelScale / distanceScale, 0.5);
  }

  void main() {
    ivec2 texel = ivec2(gl_FragCoord.xy);
    vec4 center = texelFetch(liquidSourceMap, texel, 0);

    #ifdef DEPTH_FILTER
      ivec2 maxTexel = ivec2(liquidTargetSize) - 1;
      float viewDistance = center.r;

      if (viewDistance <= 0.0) {
        discard;
      }

      float sigma = liquidPixelSigma(liquidFilterSigma, liquidPixelScale, viewDistance);
    #else
      ivec2 maxTexel = ivec2(liquidThicknessSize) - 1;
      ivec2 depthTexel = clamp(ivec2((vec2(texel) + 0.5) * liquidTargetSize / liquidThicknessSize), ivec2(0), ivec2(liquidTargetSize) - 1);
      float viewDistance = texelFetch(liquidDistanceMap, depthTexel, 0).r;

      if (viewDistance <= 0.0 || center.a <= 0.0) {
        discard;
      }

      float sigma = liquidPixelSigma(liquidThicknessSigma, liquidThicknessPixelScale, viewDistance);
    #endif

    float radius = min(ceil(sigma * 2.0), ${liquidFilterMaxRadius}.0);
    vec4 sum = center;
    float weightSum = 1.0;

    for (int i = 1; i <= ${liquidFilterMaxRadius}; i++) {
      float offset = float(i);

      if (offset > radius) {
        break;
      }

      float spatial = exp(-offset * offset / (2.0 * sigma * sigma));

      for (int side = -1; side <= 1; side += 2) {
        ivec2 sampleTexel = clamp(texel + ivec2(liquidDirection) * i * side, ivec2(0), maxTexel);
        vec4 sampleValue = texelFetch(liquidSourceMap, sampleTexel, 0);

        #ifdef DEPTH_FILTER
          float difference = (sampleValue.r - viewDistance) / (liquidDepthSigma * liquidLodScale(viewDistance));
          float weight = sampleValue.r > 0.0 ? spatial * exp(-0.5 * difference * difference) : 0.0;
        #else
          float weight = spatial;
        #endif

        sum += sampleValue * weight;
        weightSum += weight;
      }
    }

    #ifdef DEPTH_FILTER
      gl_FragColor = vec4(sum.r / weightSum, 0.0, 0.0, 1.0);
    #else
      gl_FragColor = sum / weightSum;
    #endif
  }
`;

// NOTE Shades the smoothed surface. Fresnel (IOR), environment reflection, specular of the scene lights,
// refraction of the scene behind and Beer-Lambert absorption by thickness. Writes the surface depth.
// NOTE three.js gives the PMREM environment (envMap) and the scene behind (transmissionSamplerMap, linear, opaque objects).
const compositeFragmentShader = `
  #include <common>
  #include <envmap_common_pars_fragment>

  ${commonChunk}

  uniform mat4 projectionMatrix;
  uniform sampler2D transmissionSamplerMap;
  uniform sampler2D liquidDistanceMap;
  uniform sampler2D liquidThicknessMap;
  uniform vec2 liquidTargetSize;
  uniform mat4 liquidProjectionInverse;
  uniform float liquidWorldScale;
  uniform vec3 liquidAbsorption;
  uniform vec3 liquidTint;
  uniform float liquidEdgeThickness;
  uniform float liquidSpacing;
  uniform float liquidPixelScale;
  uniform int liquidLightCount;
  uniform vec4 liquidLightPositions[${liquidMaxLights}];
  uniform vec4 liquidLightColors[${liquidMaxLights}];
  uniform vec4 liquidLightSpots[${liquidMaxLights}];
  uniform vec4 liquidLightParams[${liquidMaxLights}];
  uniform vec3 liquidAmbientColor;
  uniform vec3 liquidHemiSkyColor;
  uniform vec3 liquidHemiGroundColor;
  uniform vec3 liquidHemiUp;

  ${lodChunk}

  // NOTE View position on the pixel ray at view distance. Two NDC points: z 0.0 and 1.0 are in the frustum.
  vec3 liquidViewPosition(vec2 uv, float viewDistance) {
    vec2 ndc = uv * 2.0 - 1.0;
    vec4 nearPoint = liquidProjectionInverse * vec4(ndc, 0.0, 1.0);
    vec4 farPoint = liquidProjectionInverse * vec4(ndc, 1.0, 1.0);
    vec3 near = nearPoint.xyz / nearPoint.w;
    vec3 far = farPoint.xyz / farPoint.w;

    return mix(near, far, (-viewDistance - near.z) / (far.z - near.z));
  }

  // NOTE Neighbour position, or the center when the neighbour is empty
  vec3 liquidNeighbour(ivec2 texel, ivec2 offset, vec3 center) {
    ivec2 sampleTexel = clamp(texel + offset, ivec2(0), ivec2(liquidTargetSize) - 1);
    float sampleDistance = texelFetch(liquidDistanceMap, sampleTexel, 0).r;

    if (sampleDistance <= 0.0) {
      return center;
    }

    return liquidViewPosition((vec2(sampleTexel) + 0.5) / liquidTargetSize, sampleDistance);
  }

  // NOTE Of the two one-sided differences, the one with the smaller depth step (no edge)
  vec3 liquidPickDifference(vec3 forward, vec3 backward) {
    bool useForward = (abs(forward.z) < abs(backward.z) && dot(forward, forward) > 0.0) || dot(backward, backward) == 0.0;

    return useForward ? forward : backward;
  }

  float liquidDistanceAttenuation(float lightDistance, float cutoffDistance, float decayExponent) {
    float falloff = 1.0 / max(pow(lightDistance, decayExponent), 0.01);

    if (cutoffDistance > 0.0) {
      falloff *= pow2(saturate(1.0 - pow4(lightDistance / cutoffDistance)));
    }

    return falloff;
  }

  void main() {
    ivec2 texel = ivec2(gl_FragCoord.xy);
    float surfaceDistance = texelFetch(liquidDistanceMap, texel, 0).r;

    if (surfaceDistance <= 0.0) {
      discard;
    }

    vec3 position = liquidViewPosition(gl_FragCoord.xy / liquidTargetSize, surfaceDistance);

    gl_FragDepth = liquidWindowDepth(position.z);

    vec3 ddx = liquidPickDifference(
      liquidNeighbour(texel, ivec2(1, 0), position) - position,
      position - liquidNeighbour(texel, ivec2(-1, 0), position)
    );
    vec3 ddy = liquidPickDifference(
      liquidNeighbour(texel, ivec2(0, 1), position) - position,
      position - liquidNeighbour(texel, ivec2(0, -1), position)
    );
    vec3 crossNormal = cross(ddx, ddy);
    vec3 normal = normalize(dot(crossNormal, crossNormal) > 0.0 ? crossNormal : vec3(0.0, 0.0, 1.0));

    normal = dot(normal, position) > 0.0 ? -normal : normal;

    vec3 viewDirection = normalize(-position);
    float dotNV = clamp(dot(normal, viewDirection), 1e-4, 1.0);
    float fresnel = ${f0} + ${1.0 - f0} * pow(1.0 - dotNV, 5.0);

    // NOTE Reflection: environment along the reflected ray, ambient and hemisphere lights as uniform sky radiance
    vec3 reflected = reflect(-viewDirection, normal);
    float hemiMix = dot(reflected, liquidHemiUp) * 0.5 + 0.5;
    vec3 reflection = (liquidAmbientColor + mix(liquidHemiGroundColor, liquidHemiSkyColor, hemiMix)) * RECIPROCAL_PI;

    #if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
      vec3 reflectedWorld = inverseTransformDirection(reflected, viewMatrix);

      reflection += textureLod(envMap, envMapRotation * reflectedWorld, 0.0).rgb * envMapIntensity;
    #endif

    // NOTE Specular of the scene lights, GGX (same terms as three.js BRDF_GGX)
    float alpha = ${liquidRoughness * liquidRoughness};
    float alpha2 = alpha * alpha;
    vec3 specular = vec3(0.0);

    for (int i = 0; i < ${liquidMaxLights}; i++) {
      if (i >= liquidLightCount) {
        break;
      }

      vec4 lightPosition = liquidLightPositions[i];
      vec4 lightColor = liquidLightColors[i];
      vec4 lightSpot = liquidLightSpots[i];
      vec4 lightParams = liquidLightParams[i];
      vec3 toLight = lightPosition.xyz - position;
      vec3 lightDirection = lightPosition.w < 0.5 ? normalize(lightPosition.xyz) : normalize(toLight);
      float attenuation = 1.0;

      if (lightPosition.w > 0.5) {
        attenuation = liquidDistanceAttenuation(length(toLight), lightColor.w, lightParams.y);
      }

      if (lightPosition.w > 1.5) {
        attenuation *= smoothstep(lightSpot.w, lightParams.x, dot(-lightDirection, lightSpot.xyz));
      }

      vec3 halfVector = normalize(lightDirection + viewDirection);
      float dotNL = saturate(dot(normal, lightDirection));
      float dotNH = saturate(dot(normal, halfVector));
      float dotVH = saturate(dot(viewDirection, halfVector));
      float lightFresnel = ${f0} + ${1.0 - f0} * pow(1.0 - dotVH, 5.0);
      float smithV = dotNL * sqrt(alpha2 + (1.0 - alpha2) * dotNV * dotNV);
      float smithL = dotNV * sqrt(alpha2 + (1.0 - alpha2) * dotNL * dotNL);
      float visibility = 0.5 / max(smithV + smithL, 1e-6);
      float denominator = dotNH * dotNH * (alpha2 - 1.0) + 1.0;
      float distribution = RECIPROCAL_PI * alpha2 / (denominator * denominator);

      specular += lightColor.rgb * attenuation * dotNL * lightFresnel * visibility * distribution;
    }

    // NOTE Refraction: the scene behind, where the refracted ray leaves the liquid. Absorption by thickness.
    vec2 screenUv = gl_FragCoord.xy / liquidTargetSize;
    vec4 thicknessData = textureLod(liquidThicknessMap, screenUv, 0.0);
    vec3 refracted = refract(-viewDirection, normal, ${1.0 / liquidWater.ior});
    vec3 exitPosition = position + refracted * thicknessData.a * liquidWorldScale;
    vec4 exitClip = projectionMatrix * vec4(exitPosition, 1.0);
    vec2 exitUv = clamp(exitClip.xy / exitClip.w * 0.5 + 0.5, 0.0, 1.0);
    vec3 behind = textureLod(transmissionSamplerMap, exitUv, 0.0).rgb;
    // NOTE Water absorbs by thickness. Cd (mean along the ray) and color tint the liquid one time, as a filter.
    vec3 meanColor = thicknessData.a > 0.0 ? thicknessData.rgb / max(thicknessData.a, 1e-6) : vec3(1.0);
    vec3 transmittance = exp(-liquidAbsorption * thicknessData.a) * meanColor * liquidTint;

    vec3 color = behind * transmittance * (1.0 - fresnel) + reflection * fresnel + specular;

    // NOTE Soft edge: the liquid fades into the scene where it is thinner than one point
    float coverage = saturate(thicknessData.a / (liquidEdgeThickness * liquidLodScale(surfaceDistance)));
    vec3 scene = textureLod(transmissionSamplerMap, screenUv, 0.0).rgb;

    gl_FragColor = vec4(mix(scene, color, coverage), 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// NOTE MeshPhysicalMaterial with transmission: three.js renders the scene behind and gives the PMREM environment.
// The shader is fully replaced.
class LiquidCompositeMaterial extends Three.MeshPhysicalMaterial {
  name = 'LiquidCompositeMaterial';
  customProgramCacheKey = () => 'LiquidCompositeMaterial';

  constructor(uniforms, distanceMap, thicknessMap) {
    super();

    this.lightState = createLiquidLightState();
    this.liquidUniforms = {
      ...uniforms,
      liquidDistanceMap: { value: distanceMap },
      liquidThicknessMap: { value: thicknessMap },
      liquidLightCount: { value: 0 },
      liquidLightPositions: { value: this.lightState.positions },
      liquidLightColors: { value: this.lightState.colors },
      liquidLightSpots: { value: this.lightState.spots },
      liquidLightParams: { value: this.lightState.params },
      liquidAmbientColor: { value: this.lightState.ambient },
      liquidHemiSkyColor: { value: this.lightState.hemiSky },
      liquidHemiGroundColor: { value: this.lightState.hemiGround },
      liquidHemiUp: { value: this.lightState.hemiUp },
    };

    this.transmission = 1.0;
    this.transparent = false;
    this.depthTest = true;
    this.depthWrite = true;
    this.side = Three.FrontSide;
    this.blending = Three.NoBlending;

    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.liquidUniforms);
      shader.vertexShader = fullscreenVertexShader;
      shader.fragmentShader = compositeFragmentShader;
    };
  }

  updateLights(scene, camera) {
    collectLiquidLights(scene, camera, this.lightState);
    this.liquidUniforms.liquidLightCount.value = this.lightState.count;
    this.uniformsNeedUpdate = true;
  }
}

// NOTE Screen-space passes of one liquid object: depth splat, thickness splat, depth filter, composite material.
class LiquidPasses {
  constructor() {
    const uniforms = createUniforms();

    this.uniforms = uniforms;
    this.hasColor = false;
    // NOTE depthTarget: splat depth, then the filter result (filter: depthTarget -> filterTarget -> depthTarget)
    this.depthTarget = createTarget(Three.FloatType, Three.RedFormat, true);
    this.filterTarget = createTarget(Three.FloatType, Three.RedFormat, false);
    // NOTE Half resolution. thicknessTarget -> thicknessFilterTarget -> thicknessTarget.
    this.thicknessTarget = createTarget(Three.HalfFloatType, Three.RGBAFormat, false, Three.LinearFilter);
    this.thicknessFilterTarget = createTarget(Three.HalfFloatType, Three.RGBAFormat, false, Three.LinearFilter);
    uniforms.liquidDistanceMap = { value: this.depthTarget.texture };

    // NOTE The pass meshes get the point geometry in setGeometry()
    this.depthPass = createPassScene(
      new Three.ShaderMaterial({
        name: 'LiquidDepthMaterial',
        uniforms,
        vertexShader: splatVertexShader,
        fragmentShader: depthFragmentShader,
        side: Three.DoubleSide,
        blending: Three.NoBlending,
      }),
      new Three.BufferGeometry(),
    );
    this.thicknessPass = createPassScene(this.createThicknessMaterial(false), new Three.BufferGeometry());

    const fullscreen = createCompositeGeometry();
    fullscreen.instanceCount = 1;

    const createFilter = (source, direction, isDepth) =>
      createPassScene(
        new Three.ShaderMaterial({
          name: isDepth ? 'LiquidDepthFilterMaterial' : 'LiquidThicknessFilterMaterial',
          uniforms: {
            ...uniforms,
            liquidSourceMap: { value: source.texture },
            liquidDirection: { value: direction },
          },
          defines: isDepth ? { DEPTH_FILTER: '' } : {},
          vertexShader: fullscreenVertexShader,
          fragmentShader: filterFragmentShader,
          side: Three.DoubleSide,
          depthTest: false,
          depthWrite: false,
          blending: Three.NoBlending,
        }),
        fullscreen,
      );

    this.fullscreenGeometry = fullscreen;
    this.filterPasses = [
      createFilter(this.depthTarget, new Three.Vector2(1, 0), true),
      createFilter(this.filterTarget, new Three.Vector2(0, 1), true),
    ];
    this.thicknessFilterPasses = [
      createFilter(this.thicknessTarget, new Three.Vector2(1, 0), false),
      createFilter(this.thicknessFilterTarget, new Three.Vector2(0, 1), false),
    ];

    this.material = new LiquidCompositeMaterial(uniforms, this.depthTarget.texture, this.thicknessTarget.texture);
  }

  createThicknessMaterial(hasColor) {
    return new Three.ShaderMaterial({
      name: 'LiquidThicknessMaterial',
      uniforms: this.uniforms,
      defines: hasColor ? { USE_COLOR_ATTRIBUTE: '' } : {},
      vertexShader: splatVertexShader,
      fragmentShader: thicknessFragmentShader,
      side: Three.DoubleSide,
      depthTest: false,
      depthWrite: false,
      blending: Three.CustomBlending,
      blendEquation: Three.AddEquation,
      blendSrc: Three.OneFactor,
      blendDst: Three.OneFactor,
      blendEquationAlpha: Three.AddEquation,
      blendSrcAlpha: Three.OneFactor,
      blendDstAlpha: Three.OneFactor,
    });
  }

  setSize(width, height) {
    const thicknessWidth = Math.max(1, Math.round(width * liquidThicknessResolution));
    const thicknessHeight = Math.max(1, Math.round(height * liquidThicknessResolution));

    if (this.depthTarget.width !== width || this.depthTarget.height !== height) {
      this.depthTarget.setSize(width, height);
      this.filterTarget.setSize(width, height);
      this.thicknessTarget.setSize(thicknessWidth, thicknessHeight);
      this.thicknessFilterTarget.setSize(thicknessWidth, thicknessHeight);
    }

    this.uniforms.liquidTargetSize.value.set(width, height);
    this.uniforms.liquidThicknessSize.value.set(thicknessWidth, thicknessHeight);
  }

  // NOTE The thickness material reads liquidColor only when the points have Cd
  setGeometry(geometry) {
    const hasColor = !!geometry.getAttribute('liquidColor');

    if (hasColor !== this.hasColor) {
      this.hasColor = hasColor;
      this.thicknessPass.mesh.material.dispose();
      this.thicknessPass.mesh.material = this.createThicknessMaterial(hasColor);
    }

    this.depthPass.mesh.geometry = geometry;
    this.thicknessPass.mesh.geometry = geometry;
  }

  render(renderer, scene, camera, liquid, data) {
    const { uniforms } = this;
    const currentTarget = renderer.getRenderTarget();

    if (currentTarget) {
      drawingSize.set(currentTarget.width, currentTarget.height);
    } else {
      renderer.getDrawingBufferSize(drawingSize);
    }

    this.setSize(drawingSize.x, drawingSize.y);

    const worldScale = getLiquidWorldScale(liquid);

    uniforms.liquidWorldScale.value = worldScale;
    uniforms.liquidSpacing.value = data.spacing;
    uniforms.liquidProjectionInverse.value.copy(camera.projectionMatrixInverse);
    uniforms.liquidOrthographic.value = camera.isOrthographicCamera ? 1.0 : 0.0;
    uniforms.liquidNear.value = camera.near;
    uniforms.liquidFar.value = camera.far;
    uniforms.liquidPixelScale.value = getLiquidPixelScale(camera, drawingSize.y);
    const { radiusScale, blend, lod, color } = liquid.pointSource;
    const radius = data.meanRadius * radiusScale;

    uniforms.liquidRadiusScale.value = radiusScale;
    uniforms.liquidLod.value = lod ? 1.0 : 0.0;
    uniforms.liquidFilterSigma.value = radius * worldScale * liquidFilterSigma * blend;
    uniforms.liquidDepthSigma.value = radius * worldScale * liquidFilterDepthRange;
    uniforms.liquidThicknessPixelScale.value = getLiquidPixelScale(camera, uniforms.liquidThicknessSize.value.y);
    uniforms.liquidThicknessSigma.value = radius * worldScale * liquidThicknessSigma;
    uniforms.liquidTint.value.copy(color);
    uniforms.liquidEdgeThickness.value = getLiquidEdgeThickness(radius, data.spacing);

    this.depthPass.mesh.matrixWorld.copy(liquid.matrixWorld);
    this.thicknessPass.mesh.matrixWorld.copy(liquid.matrixWorld);

    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();

    renderer.getClearColor(clearColor);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);

    renderer.setRenderTarget(this.depthTarget);
    renderer.clear(true, true, false);
    renderer.render(this.depthPass.scene, camera);

    renderer.setRenderTarget(this.thicknessTarget);
    renderer.clear(true, false, false);
    renderer.render(this.thicknessPass.scene, camera);

    for (let i = 0; i < liquidFilterIterations; i++) {
      renderer.setRenderTarget(this.filterTarget);
      renderer.clear(true, false, false);
      renderer.render(this.filterPasses[0].scene, camera);

      renderer.setRenderTarget(this.depthTarget);
      renderer.clear(true, false, false);
      renderer.render(this.filterPasses[1].scene, camera);
    }

    // NOTE After the depth filter: the thickness filter reads the filtered depth
    renderer.setRenderTarget(this.thicknessFilterTarget);
    renderer.clear(true, false, false);
    renderer.render(this.thicknessFilterPasses[0].scene, camera);

    renderer.setRenderTarget(this.thicknessTarget);
    renderer.clear(true, false, false);
    renderer.render(this.thicknessFilterPasses[1].scene, camera);

    renderer.setRenderTarget(currentTarget, currentActiveCubeFace, currentActiveMipmapLevel);
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.autoClear = currentAutoClear;

    this.material.updateLights(scene, camera);
  }

  dispose() {
    this.depthTarget.dispose();
    this.filterTarget.dispose();
    this.thicknessTarget.dispose();
    this.thicknessFilterTarget.dispose();
    this.fullscreenGeometry.dispose();
    [this.depthPass, this.thicknessPass, ...this.filterPasses, ...this.thicknessFilterPasses].forEach(({ mesh }) =>
      mesh.material.dispose(),
    );
    this.material.dispose();
  }
}

// NOTE Point data grid as a liquid surface (WebGLRenderer): screen-space fluid rendering. color: tint, a filter
// color (white is clear water). Lit by the scene lights and the environment, refracts the scene behind.
export class VDBLiquid extends Three.Mesh {
  isVDBLiquid = true;
  cancel = null;
  spacing = 1.0;
  pointCount = 0;
  // NOTE Point data of the source: { geometry, meanRadius, spacing }. Instances read it from pointSource.
  data = null;

  constructor(
    source,
    { maxPoints = liquidMaxPoints, color = 0xffffff, radiusScale = 1.0, blend = 1.0, lod = false } = {},
    onConverted,
  ) {
    // NOTE Own passes and material for each liquid object. Instances share only the point data.
    const passes = new LiquidPasses();

    super(createCompositeGeometry(), passes.material);

    this.passes = passes;
    this.color = new Three.Color(color);
    // NOTE radiusScale: sphere radius multiplier. blend: depth filter multiplier (how much spheres merge).
    // lod: distance detail, fewer and larger spheres far from the camera. Instances read these from pointSource.
    this.radiusScale = radiusScale;
    this.blend = blend;
    this.lod = lod;
    this.pointSource = this;
    this.onConverted = onConverted;
    this.frustumCulled = false;

    if (source) {
      this.cancel = buildPointData(source, { maxPoints }, (pointData) => {
        this.cancel = null;
        this.setPointData(pointData);
        this.onConverted?.(this);
      });
    }

    this.onBeforeRender = (renderer, scene, camera) => this.renderPasses(renderer, scene, camera);
  }

  setPointData(pointData) {
    this.data?.geometry.dispose();

    const { geometry, meanRadius } = createLiquidGeometry(pointData);

    this.data = { geometry, meanRadius, spacing: pointData.spacing };
    this.pointCount = pointData.count;
    this.spacing = pointData.spacing;
  }

  renderPasses(renderer, scene, camera) {
    const data = this.pointSource.data;

    // NOTE Override passes (shadows, depth) of other effects do not draw the liquid
    if (!data || data.geometry.instanceCount === 0 || scene.overrideMaterial) {
      this.geometry.instanceCount = 0;

      return;
    }

    this.passes.setGeometry(data.geometry);
    this.passes.render(renderer, scene, camera, this, data);
    this.geometry.instanceCount = 1;
  }

  createInstance() {
    return this.applyToInstance(new VDBLiquid(null));
  }

  // NOTE Makes a liquid show these points. FrameVolume instances use it for each new frame.
  applyToInstance(instance) {
    instance.pointSource = this;

    return instance;
  }

  dispose() {
    this.cancel?.();
    this.cancel = null;

    if (this.pointSource === this) {
      this.data?.geometry.dispose();
    }

    this.data = null;
    this.passes.dispose();
    this.geometry.dispose();
  }
}

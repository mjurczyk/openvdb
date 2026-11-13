import * as Three from 'three';

// NOTE GLSL of LevelSetSurface (WebGLRenderer). Same trace as webgpu/LevelSetSurfaceMaterial.js.
// The standard, depth and distance materials share the uniforms. Back faces of the box start the ray.

const placeholder = new Three.Data3DTexture(new Uint8Array([255]), 1, 1, 1);
placeholder.format = Three.RedFormat;
placeholder.needsUpdate = true;

export const createLevelSetUniforms = () => ({
  levelSetDistanceMap: { value: placeholder },
  levelSetBoxMin: { value: new Three.Vector3() },
  levelSetBoxSize: { value: new Three.Vector3(1.0, 1.0, 1.0) },
  // NOTE World size of one texel on each axis
  levelSetTexelSize: { value: new Three.Vector3(1.0, 1.0, 1.0) },
  levelSetBackground: { value: 1.0 },
});

export const setLevelSetUniforms = (uniforms, texture, bbox, background) => {
  const size = bbox.getSize(new Three.Vector3());
  const { width, height, depth } = texture.image;

  uniforms.levelSetDistanceMap.value = texture;
  uniforms.levelSetBoxMin.value.copy(bbox.min);
  uniforms.levelSetBoxSize.value.copy(size);
  uniforms.levelSetTexelSize.value.set(size.x / width, size.y / height, size.z / depth);
  uniforms.levelSetBackground.value = background;
};

const vertexPars = /* glsl */ `
varying vec3 vLevelSetLocal;
varying vec3 vLevelSetCamera;
varying vec3 vLevelSetForward;
`;

// NOTE Camera position and forward direction in the local space of the box. Forward is for orthographic cameras.
const vertexMain = /* glsl */ `
vLevelSetLocal = position;
vLevelSetCamera = ( inverse( modelMatrix ) * vec4( cameraPosition, 1.0 ) ).xyz;
vLevelSetForward = ( inverse( modelViewMatrix ) * vec4( 0.0, 0.0, - 1.0, 0.0 ) ).xyz;
`;

const fragmentPars = /* glsl */ `
#define LEVEL_SET_MAX_STEPS 512

uniform sampler3D levelSetDistanceMap;
uniform vec3 levelSetBoxMin;
uniform vec3 levelSetBoxSize;
uniform vec3 levelSetTexelSize;
uniform float levelSetBackground;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec3 vLevelSetLocal;
varying vec3 vLevelSetCamera;
varying vec3 vLevelSetForward;

float levelSetDistance( vec3 position ) {
  vec3 uvw = ( position - levelSetBoxMin ) / levelSetBoxSize;

  return ( textureLod( levelSetDistanceMap, uvw, 0.0 ).r * 2.0 - 1.0 ) * levelSetBackground;
}

// NOTE Steps from the box entry (or the camera) to the back face (t = 0). False when the ray misses the surface.
bool levelSetTrace( out vec3 hit ) {
  vec3 origin = vLevelSetLocal;
  vec3 direction = isOrthographic ? normalize( vLevelSetForward ) : normalize( vLevelSetLocal - vLevelSetCamera );
  vec3 safe = mix( direction, vec3( 1e-6 ), vec3( lessThan( abs( direction ), vec3( 1e-6 ) ) ) );
  vec3 near = min( ( levelSetBoxMin - origin ) / safe, ( levelSetBoxMin + levelSetBoxSize - origin ) / safe );
  float t = max( max( max( near.x, near.y ), near.z ), dot( vLevelSetCamera - origin, direction ) );
  float previousT = t;
  // NOTE Negative: no sample before the current one
  float previousDistance = - 1.0;
  float minTexel = min( levelSetTexelSize.x, min( levelSetTexelSize.y, levelSetTexelSize.z ) );

  for ( int i = 0; i < LEVEL_SET_MAX_STEPS; i ++ ) {
    if ( t > 0.0 ) {
      return false;
    }

    float distance = levelSetDistance( origin + direction * t );

    if ( distance < 0.0 ) {
      // NOTE Secant step between the last sample outside and the first sample inside
      if ( previousDistance > 0.0 ) {
        t = previousT + ( t - previousT ) * previousDistance / ( previousDistance - distance );
      }

      hit = origin + direction * t;

      return true;
    }

    previousT = t;
    previousDistance = distance;

    // NOTE All 8 texels outside the band: the surface is at least half a texel away
    t += distance >= levelSetBackground * 0.9999 ? max( distance, minTexel * 0.5 ) : max( distance, minTexel * 0.25 );
  }

  return false;
}
`;

// NOTE Discards missed pixels and writes the depth of the hit
const fragmentMainTrace = /* glsl */ `
vec3 levelSetHitLocal;

if ( ! levelSetTrace( levelSetHitLocal ) ) {
  discard;
}

vec4 levelSetHitView = modelViewMatrix * vec4( levelSetHitLocal, 1.0 );
vec4 levelSetClip = projectionMatrix * levelSetHitView;

#ifdef USE_REVERSED_DEPTH_BUFFER
  gl_FragDepth = levelSetClip.z / levelSetClip.w;
#else
  gl_FragDepth = 0.5 * levelSetClip.z / levelSetClip.w + 0.5;
#endif
`;

// NOTE The lit shader reads these names. The defines move the view position and shadow coordinates to the hit.
const standardPars = /* glsl */ `
uniform mat3 normalMatrix;

vec3 levelSetViewPosition;
vec3 levelSetNormal;

#define vViewPosition levelSetViewPosition

#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
  uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
  vec4 levelSetDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
  #define vDirectionalShadowCoord levelSetDirectionalShadowCoord
#endif

#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
  uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
  vec4 levelSetPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
  #define vPointShadowCoord levelSetPointShadowCoord
#endif

#if NUM_SPOT_LIGHT_COORDS > 0
  uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
  vec4 levelSetSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
  #define vSpotLightCoord levelSetSpotLightCoord
#endif

#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
  vec4 levelSetSunShadowWorldPosition;
  vec3 levelSetSunShadowWorldNormal;
  #define vSunShadowWorldPosition levelSetSunShadowWorldPosition
  #define vSunShadowWorldNormal levelSetSunShadowWorldNormal
#endif
`;

// NOTE Same as shadowmap_vertex of three.js, at the hit point
const standardMain = /* glsl */ `
levelSetViewPosition = - levelSetHitView.xyz;

vec3 levelSetGradient = vec3(
  levelSetDistance( levelSetHitLocal + vec3( levelSetTexelSize.x, 0.0, 0.0 ) ) - levelSetDistance( levelSetHitLocal - vec3( levelSetTexelSize.x, 0.0, 0.0 ) ),
  levelSetDistance( levelSetHitLocal + vec3( 0.0, levelSetTexelSize.y, 0.0 ) ) - levelSetDistance( levelSetHitLocal - vec3( 0.0, levelSetTexelSize.y, 0.0 ) ),
  levelSetDistance( levelSetHitLocal + vec3( 0.0, 0.0, levelSetTexelSize.z ) ) - levelSetDistance( levelSetHitLocal - vec3( 0.0, 0.0, levelSetTexelSize.z ) )
) / levelSetTexelSize;

levelSetNormal = normalize( normalMatrix * levelSetGradient );

vec3 levelSetHitWorld = ( modelMatrix * vec4( levelSetHitLocal, 1.0 ) ).xyz;
vec3 levelSetWorldNormal = transformNormalByInverseViewMatrix( levelSetNormal, viewMatrix );

#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
    levelSetDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * vec4( levelSetHitWorld + levelSetWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 1.0 );
  }
  #pragma unroll_loop_end
#endif

#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
    levelSetPointShadowCoord[ i ] = pointShadowMatrix[ i ] * vec4( levelSetHitWorld + levelSetWorldNormal * pointLightShadows[ i ].shadowNormalBias, 1.0 );
  }
  #pragma unroll_loop_end
#endif

#if NUM_SPOT_LIGHT_COORDS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
    vec4 levelSetSpotWorld = vec4( levelSetHitWorld, 1.0 );
    #if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
      levelSetSpotWorld.xyz += levelSetWorldNormal * spotLightShadows[ i ].shadowNormalBias;
    #endif
    levelSetSpotLightCoord[ i ] = spotLightMatrix[ i ] * levelSetSpotWorld;
  }
  #pragma unroll_loop_end
#endif

#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
  levelSetSunShadowWorldPosition = vec4( levelSetHitWorld, - levelSetHitView.z );
  levelSetSunShadowWorldNormal = levelSetWorldNormal;
#endif
`;

// NOTE Logarithmic depth of the hit, same as logdepthbuf_fragment of three.js
const logDepth = /* glsl */ `
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
  if ( ! isOrthographic ) {
    gl_FragDepth = log2( 1.0 - levelSetHitView.z ) * logDepthBufFC * 0.5;
  }
#endif
`;

const replaceOnce = (source, search, replacement) => {
  if (!source.includes(search)) {
    throw new Error(`LevelSetSurface: three.js shader has no "${search}".`);
  }

  return source.replace(search, replacement);
};

const patchVertex = (shader) => {
  shader.vertexShader = replaceOnce(
    replaceOnce(shader.vertexShader, 'void main() {', `${vertexPars}\nvoid main() {`),
    '#include <project_vertex>',
    `#include <project_vertex>\n${vertexMain}`,
  );
};

const patchFragmentTrace = (shader, pars = '', main = '') => {
  shader.fragmentShader = replaceOnce(
    shader.fragmentShader,
    'void main() {',
    `${fragmentPars}\n${pars}\nvoid main() {\n${fragmentMainTrace}\n${main}`,
  );
};

// NOTE MeshStandardMaterial that traces the signed distance texture of a LevelSetSurface.
// Light, shadows and depth use the hit point.
export class LevelSetSurfaceMaterial extends Three.MeshStandardMaterial {
  constructor(parameters, uniforms = createLevelSetUniforms()) {
    super(parameters);

    this.name = 'LevelSetSurfaceMaterial';
    this.side = Three.BackSide;
    // NOTE Shadow passes start the ray at back faces too
    this.shadowSide = Three.BackSide;
    this.levelSetUniforms = uniforms;
  }

  onBeforeCompile(shader) {
    Object.assign(shader.uniforms, this.levelSetUniforms);

    patchVertex(shader);
    patchFragmentTrace(shader, standardPars, standardMain);

    shader.fragmentShader = replaceOnce(
      replaceOnce(shader.fragmentShader, '#include <logdepthbuf_fragment>', logDepth),
      '#include <normal_fragment_maps>',
      '#include <normal_fragment_maps>\nnormal = levelSetNormal;',
    );
  }

  customProgramCacheKey() {
    return 'levelSetSurface';
  }

  setDistance(texture, bbox, background) {
    setLevelSetUniforms(this.levelSetUniforms, texture, bbox, background);
  }
}

// NOTE Shadow maps of directional and spot lights
export class LevelSetDepthMaterial extends Three.MeshDepthMaterial {
  constructor(uniforms) {
    super();

    this.name = 'LevelSetDepthMaterial';
    this.levelSetUniforms = uniforms;
  }

  onBeforeCompile(shader) {
    Object.assign(shader.uniforms, this.levelSetUniforms);

    patchVertex(shader);
    patchFragmentTrace(shader);

    shader.fragmentShader = replaceOnce(
      shader.fragmentShader,
      '#include <logdepthbuf_fragment>',
      logDepth,
    ).replace(
      /vHighPrecisionZW\[ 0 \] \/ vHighPrecisionZW\[ 1 \]/g,
      'levelSetClip.z / levelSetClip.w',
    );
  }

  customProgramCacheKey() {
    return 'levelSetDepth';
  }
}

// NOTE Shadow maps of point lights (distance to the light)
export class LevelSetDistanceMaterial extends Three.MeshDistanceMaterial {
  constructor(uniforms) {
    super();

    this.name = 'LevelSetDistanceMaterial';
    this.levelSetUniforms = uniforms;
  }

  onBeforeCompile(shader) {
    Object.assign(shader.uniforms, this.levelSetUniforms);

    patchVertex(shader);
    patchFragmentTrace(shader);

    shader.fragmentShader = replaceOnce(
      shader.fragmentShader,
      'length( vWorldPosition - referencePosition )',
      'length( ( modelMatrix * vec4( levelSetHitLocal, 1.0 ) ).xyz - referencePosition )',
    );
  }

  customProgramCacheKey() {
    return 'levelSetDistance';
  }
}

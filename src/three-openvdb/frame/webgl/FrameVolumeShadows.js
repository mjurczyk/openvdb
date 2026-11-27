import * as Three from 'three';
import { FrameVolumeShadowMaterial } from './FrameVolumeShadowMaterial.js';
import { frameMaxShadowMapCascades } from '../core/frameLimits.js';
import { FrameVolumeShadowsBase, fullscreenGeometry, targetOptions, initTarget } from '../core/FrameVolumeShadows.js';

// NOTE Shadow lights of each type that get a volume shadow (the first ones in the three.js shadow order)
const maxLights = 4;

const clearColor = new Three.Color();

// NOTE Directional lights: an atlas with one tile for each cascade, in a row
// NOTE Spectral: directional and spot maps have a second row with the optical depth of each channel. One sampler for both rows.
// Point lights (cube maps) get a second cube map.
const createTarget = (size, light, spectral = false) => {
  if (light.isPointLight) {
    return new Three.WebGLCubeRenderTarget(size, targetOptions);
  }

  const tiles = light.isDirectionalLight ? frameMaxShadowMapCascades : 1;

  return new Three.WebGLRenderTarget(size * tiles, spectral ? size * 2 : size, targetOptions);
};

// NOTE Receiver uniforms that point to a retired texture get the placeholder
const replaceTexture = (list, texture, placeholder) => {
  for (let i = 0; i < list.length; i++) {
    if (list[i] === texture) {
      list[i] = placeholder;
    }
  }
};

// NOTE GLSL of the lit material patch. The receiver reads the Beer shadow map of its light at its depth.
const receiverPars = /* glsl */ `
  #define FRAME_VOLUME_MAX_LIGHTS ${maxLights}
  #define FRAME_VOLUME_CASCADES ${frameMaxShadowMapCascades}

  uniform int frameVolumeDirEnabled[FRAME_VOLUME_MAX_LIGHTS];
  uniform int frameVolumeDirCount[FRAME_VOLUME_MAX_LIGHTS];
  uniform vec4 frameVolumeDirBreaks[FRAME_VOLUME_MAX_LIGHTS];
  uniform vec3 frameVolumeDirForward[FRAME_VOLUME_MAX_LIGHTS];
  uniform float frameVolumeDirSize[FRAME_VOLUME_MAX_LIGHTS];
  uniform mat4 frameVolumeDirViewProjection[FRAME_VOLUME_MAX_LIGHTS * FRAME_VOLUME_CASCADES];
  uniform vec3 frameVolumeDirOrigin[FRAME_VOLUME_MAX_LIGHTS * FRAME_VOLUME_CASCADES];
  uniform float frameVolumeDirFar[FRAME_VOLUME_MAX_LIGHTS * FRAME_VOLUME_CASCADES];
  uniform sampler2D frameVolumeDirMap[FRAME_VOLUME_MAX_LIGHTS];

  uniform int frameVolumeSpotEnabled[FRAME_VOLUME_MAX_LIGHTS];
  uniform mat4 frameVolumeSpotViewProjection[FRAME_VOLUME_MAX_LIGHTS];
  uniform vec3 frameVolumeSpotOrigin[FRAME_VOLUME_MAX_LIGHTS];
  uniform float frameVolumeSpotFar[FRAME_VOLUME_MAX_LIGHTS];
  uniform sampler2D frameVolumeSpotMap[FRAME_VOLUME_MAX_LIGHTS];

  uniform int frameVolumePointEnabled[FRAME_VOLUME_MAX_LIGHTS];
  uniform vec3 frameVolumePointOrigin[FRAME_VOLUME_MAX_LIGHTS];
  uniform float frameVolumePointFar[FRAME_VOLUME_MAX_LIGHTS];
  uniform samplerCube frameVolumePointMap[FRAME_VOLUME_MAX_LIGHTS];

  // NOTE Beer shadow map: optical depth grows linearly from the first to the last density on the light ray
  float frameVolumeBeer(vec4 texel, float depth, float far) {
    float opticalDepth = texel.w;

    if (opticalDepth <= 1e-4) {
      return 1.0;
    }

    float first = texel.x / opticalDepth * far;
    float last = texel.y / opticalDepth * far;
    float along = clamp((depth - first) / max(last - first, 1e-4), 0.0, 1.0);

    return exp(-opticalDepth * along);
  }

  // NOTE Picks the cascade by the view depth, the same as three.js CSMShadowNode
  float frameVolumeDirShadow(sampler2D map, int light, vec3 worldPosition, float viewDepth) {
    int count = frameVolumeDirCount[light];

    if (frameVolumeDirEnabled[light] == 0 || count == 0) {
      return 1.0;
    }

    vec4 breaks = frameVolumeDirBreaks[light];
    float lastBreak = count == 1 ? breaks.x : count == 2 ? breaks.y : count == 3 ? breaks.z : breaks.w;

    if (viewDepth > lastBreak) {
      return 1.0;
    }

    int cascade = 0;

    if (count > 1 && viewDepth > breaks.x) cascade = 1;
    if (count > 2 && viewDepth > breaks.y) cascade = 2;
    if (count > 3 && viewDepth > breaks.z) cascade = 3;

    int index = light * FRAME_VOLUME_CASCADES + cascade;
    vec4 clip = frameVolumeDirViewProjection[index] * vec4(worldPosition, 1.0);
    vec2 uv = clip.xy * 0.5 + 0.5;

    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
      return 1.0;
    }

    // NOTE Half a texel in from the tile sides. Then the linear filter does not read the next tile.
    float inset = 0.5 / frameVolumeDirSize[light];
    uv = clamp(uv, vec2(inset), vec2(1.0 - inset));

    vec4 texel = texture(map, vec2((uv.x + float(cascade)) / float(FRAME_VOLUME_CASCADES), uv.y));
    float depth = dot(worldPosition - frameVolumeDirOrigin[index], frameVolumeDirForward[light]);

    return frameVolumeBeer(texel, depth, frameVolumeDirFar[index]);
  }

  float frameVolumeSpotShadow(sampler2D map, int light, vec3 worldPosition) {
    if (frameVolumeSpotEnabled[light] == 0) {
      return 1.0;
    }

    vec4 clip = frameVolumeSpotViewProjection[light] * vec4(worldPosition, 1.0);
    vec2 uv = clip.xy / clip.w * 0.5 + 0.5;

    if (clip.w <= 0.0 || any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
      return 1.0;
    }

    float depth = length(worldPosition - frameVolumeSpotOrigin[light]);

    return frameVolumeBeer(texture(map, uv), depth, frameVolumeSpotFar[light]);
  }

  float frameVolumePointShadow(samplerCube map, int light, vec3 worldPosition) {
    if (frameVolumePointEnabled[light] == 0) {
      return 1.0;
    }

    vec3 offset = worldPosition - frameVolumePointOrigin[light];

    return frameVolumeBeer(texture(map, offset), length(offset), frameVolumePointFar[light]);
  }
`;

// NOTE Spectral receiver pars (frameRenderer.settings.spectral): a second map with the optical depth of each channel.
// NOTE The shadow functions return the transmittance of each channel. ShadowMaterial uses the mean (frameVolumeMean).
const getSpectralReceiverPars = () => {
  const beerStart = receiverPars.indexOf('  // NOTE Beer shadow map');
  const beerEnd = receiverPars.indexOf('  // NOTE Picks the cascade');
  let pars = `${receiverPars.slice(0, beerStart)}  // NOTE Beer shadow map of each channel: the first map gives the depths, the second the optical depth rgb
  vec3 frameVolumeBeer(vec4 texel, vec4 spectralTexel, float depth, float far) {
    float opticalDepth = texel.w;

    if (opticalDepth <= 1e-4) {
      return vec3(1.0);
    }

    float first = texel.x / opticalDepth * far;
    float last = texel.y / opticalDepth * far;
    float along = clamp((depth - first) / max(last - first, 1e-4), 0.0, 1.0);

    return exp(-spectralTexel.rgb * along);
  }

  float frameVolumeMean(vec3 transmittance) {
    return dot(transmittance, vec3(1.0 / 3.0));
  }

${receiverPars.slice(beerEnd)}`;

  pars = pars
    .replace(
      'uniform samplerCube frameVolumePointMap[FRAME_VOLUME_MAX_LIGHTS];',
      'uniform samplerCube frameVolumePointMap[FRAME_VOLUME_MAX_LIGHTS];\n  uniform samplerCube frameVolumePointSpectralMap[FRAME_VOLUME_MAX_LIGHTS];',
    )
    .replace('float frameVolumeDirShadow(sampler2D map,', 'vec3 frameVolumeDirShadow(sampler2D map,')
    .replace('float frameVolumeSpotShadow(sampler2D map,', 'vec3 frameVolumeSpotShadow(sampler2D map,')
    .replace('float frameVolumePointShadow(samplerCube map,', 'vec3 frameVolumePointShadow(samplerCube map, samplerCube spectralMap,')
    .replace(/return 1\.0;/g, 'return vec3(1.0);')
    .replace(
      'vec4 texel = texture(map, vec2((uv.x + float(cascade)) / float(FRAME_VOLUME_CASCADES), uv.y));',
      // NOTE Row 0: the Beer map, row 1: the optical depth of each channel. The inset keeps uv in its row.
      'vec2 tileUv = vec2((uv.x + float(cascade)) / float(FRAME_VOLUME_CASCADES), uv.y * 0.5);\n    vec4 texel = texture(map, tileUv);\n    vec4 spectralTexel = texture(map, tileUv + vec2(0.0, 0.5));',
    )
    .replace(
      'return frameVolumeBeer(texel, depth, frameVolumeDirFar[index]);',
      'return frameVolumeBeer(texel, spectralTexel, depth, frameVolumeDirFar[index]);',
    )
    .replace(
      'return frameVolumeBeer(texture(map, uv), depth, frameVolumeSpotFar[light]);',
      // NOTE Half a texel in from the row sides. Then the linear filter does not read the other row.
      'float rowInset = 1.0 / float(textureSize(map, 0).y);\n    vec2 rowUv = vec2(uv.x, clamp(uv.y, rowInset, 1.0 - rowInset) * 0.5);\n\n    return frameVolumeBeer(texture(map, rowUv), texture(map, rowUv + vec2(0.0, 0.5)), depth, frameVolumeSpotFar[light]);',
    )
    .replace(
      'return frameVolumeBeer(texture(map, offset), length(offset), frameVolumePointFar[light]);',
      'return frameVolumeBeer(texture(map, offset), texture(spectralMap, offset), length(offset), frameVolumePointFar[light]);',
    );

  return pars;
};

const spectralReceiverPars = getSpectralReceiverPars();

// NOTE Spectral call of a shadow function. Point lights: the second cube map after the first. Directional and spot maps have two rows.
const getSpectralCall = (call) =>
  call.replace(/frameVolumePointMap\[ i \],/, 'frameVolumePointMap[ i ], frameVolumePointSpectralMap[ i ],');

// NOTE Lines added after the three.js shadow line of each light type, in the unrolled light loops.
// NOTE [ i ] and UNROLLED_LOOP_INDEX become the shadow index of the light.
const receiverLines = [
  [
    /(directLight\.color \*= \( directLight\.visible && receiveShadow \) \? getPointShadow\( pointShadowMap\[ i \][^;]*;)/,
    'frameVolumePointShadow( frameVolumePointMap[ i ], UNROLLED_LOOP_INDEX, frameVolumeWorld )',
  ],
  [
    /(directLight\.color \*= \( directLight\.visible && receiveShadow \) \? getShadow\( spotShadowMap\[ i \][^;]*;)/,
    'frameVolumeSpotShadow( frameVolumeSpotMap[ i ], UNROLLED_LOOP_INDEX, frameVolumeWorld )',
  ],
  [
    /(directLight\.color \*= \( directLight\.visible && receiveShadow \) \? getShadow\( directionalShadowMap\[ i \][^;]*;)/,
    'frameVolumeDirShadow( frameVolumeDirMap[ i ], UNROLLED_LOOP_INDEX, frameVolumeWorld, frameVolumeViewDepth )',
  ],
];

// NOTE The light loops of three.js with the volume shadow lines. null when the three.js chunk has other lines.
// NOTE Spectral: the light color gets the transmittance of each channel.
const getReceiverLightsChunk = (spectral) => {
  let chunk = Three.ShaderChunk.lights_fragment_begin;
  const geometryLine = 'vec3 geometryPosition = - vViewPosition;';

  if (!chunk.includes(geometryLine) || !receiverLines.every(([pattern]) => pattern.test(chunk))) {
    return null;
  }

  // NOTE World position from the view-space position. The view matrix is rigid.
  chunk = chunk.replace(
    geometryLine,
    `${geometryLine}
    vec3 frameVolumeWorld = cameraPosition + ( vec4( geometryPosition, 0.0 ) * viewMatrix ).xyz;
    float frameVolumeViewDepth = vViewPosition.z;`,
  );

  receiverLines.forEach(([pattern, call]) => {
    chunk = chunk.replace(
      pattern,
      spectral
        ? `$1
      #if ( UNROLLED_LOOP_INDEX < FRAME_VOLUME_MAX_LIGHTS )
      directLight.color *= receiveShadow ? ${getSpectralCall(call)} : vec3(1.0);
      #endif`
        : `$1
      #if ( UNROLLED_LOOP_INDEX < FRAME_VOLUME_MAX_LIGHTS )
      directLight.color *= receiveShadow ? ${call} : 1.0;
      #endif`,
    );
  });

  return chunk;
};

// NOTE ShadowMaterial: lines added after each three.js shadow line of getShadowMask
const maskLines = [
  [
    /(shadow \*= receiveShadow \? getPointShadow\( pointShadowMap\[ i \][^;]*;)/,
    'frameVolumePointShadow( frameVolumePointMap[ i ], UNROLLED_LOOP_INDEX, frameVolumeWorld )',
  ],
  [
    /(shadow \*= receiveShadow \? getShadow\( spotShadowMap\[ i \][^;]*;)/,
    'frameVolumeSpotShadow( frameVolumeSpotMap[ i ], UNROLLED_LOOP_INDEX, frameVolumeWorld )',
  ],
  [
    /(shadow \*= receiveShadow \? getShadow\( directionalShadowMap\[ i \][^;]*;)/,
    'frameVolumeDirShadow( frameVolumeDirMap[ i ], UNROLLED_LOOP_INDEX, frameVolumeWorld, frameVolumeViewDepth )',
  ],
];

// NOTE ShadowMaterial has no view position. The vertex shader gives the world position and the view depth.
const maskVertexPars = /* glsl */ `
  varying vec3 vFrameVolumeWorld;
  varying float vFrameVolumeViewDepth;
`;

const maskVertex = /* glsl */ `
  vec4 frameVolumeWorldPosition = vec4( transformed, 1.0 );
  #ifdef USE_BATCHING
  frameVolumeWorldPosition = batchingMatrix * frameVolumeWorldPosition;
  #endif
  #ifdef USE_INSTANCING
  frameVolumeWorldPosition = instanceMatrix * frameVolumeWorldPosition;
  #endif
  vFrameVolumeWorld = ( modelMatrix * frameVolumeWorldPosition ).xyz;
  vFrameVolumeViewDepth = - mvPosition.z;
`;

// NOTE getShadowMask of three.js with the volume shadow lines. null when the three.js chunk has other lines.
// NOTE Spectral: the shadow mask has one value, so it gets the mean transmittance of the channels.
const getReceiverMaskChunk = (spectral) => {
  let chunk = Three.ShaderChunk.shadowmask_pars_fragment;
  const startLine = 'float shadow = 1.0;';

  if (!chunk.includes(startLine) || !maskLines.every(([pattern]) => pattern.test(chunk))) {
    return null;
  }

  chunk = chunk.replace(
    startLine,
    `${startLine}
    vec3 frameVolumeWorld = vFrameVolumeWorld;
    float frameVolumeViewDepth = vFrameVolumeViewDepth;`,
  );

  maskLines.forEach(([pattern, call]) => {
    chunk = chunk.replace(
      pattern,
      spectral
        ? `$1
      #if ( UNROLLED_LOOP_INDEX < FRAME_VOLUME_MAX_LIGHTS )
      shadow *= receiveShadow ? frameVolumeMean( ${getSpectralCall(call)} ) : 1.0;
      #endif`
        : `$1
      #if ( UNROLLED_LOOP_INDEX < FRAME_VOLUME_MAX_LIGHTS )
      shadow *= receiveShadow ? ${call} : 1.0;
      #endif`,
    );
  });

  return `${maskVertexPars}\n${chunk}`;
};

const isLitMaterial = (material) =>
  !material.isShaderMaterial &&
  (material.isShadowMaterial ||
    material.isMeshStandardMaterial ||
    material.isMeshLambertMaterial ||
    material.isMeshPhongMaterial ||
    material.isMeshToonMaterial);

// NOTE Shadows of FrameVolume objects on meshes (frameRenderer.settings.castShadows), WebGLRenderer.
// NOTE Each shadow light gets a Beer shadow map, made from the world shadow grid of the frame renderer.
// NOTE Directional lights: cascades of the view. Spot lights: the light shadow camera. Point lights: a cube map.
// NOTE Lit materials get a shader patch. After the three.js shadow of each light, it multiplies the volume transmittance.
// NOTE An updater mesh in each shadow light is first in the opaque render list and draws nothing.
// NOTE Its onBeforeRender patches new lit materials and makes the maps before the lit meshes.
// NOTE A map piece (cascade tile, spot map, cube map) is made again only when its camera or the grid changes.
// NOTE At most castShadowUpdatesPerFrame pieces in a render, the oldest first.
// NOTE Shared CPU code is in core/FrameVolumeShadows.js.
export class FrameVolumeShadows extends FrameVolumeShadowsBase {
  // NOTE Replaced and freed maps. update() runs during a render, so they are disposed in the next update().
  retired = [];
  updaterFrame = -1;
  updaterCamera = null;
  patchFrame = -1;
  patchedMaterials = new WeakSet();
  // NOTE Shadow lights of the camera layers in scene order, from the walk of runUpdater. The array is reused.
  orderLights = [];
  orderCount = 0;
  // NOTE Shadow lights of each type in the three.js shadow order. Index i is the shadow index in the shaders.
  shadowOrder = {
    directional: new Array(maxLights).fill(null),
    spot: new Array(maxLights).fill(null),
    point: new Array(maxLights).fill(null),
  };
  // NOTE Values of the current call, for the Map.forEach and traverseVisible callbacks
  state = { renderer: null, scene: null, camera: null, size: 0, spectral: false, patch: false };
  receiverChunk = getReceiverLightsChunk(false);
  receiverMaskChunk = getReceiverMaskChunk(false);
  spectralReceiverChunk = getReceiverLightsChunk(true);
  spectralReceiverMaskChunk = getReceiverMaskChunk(true);
  chunkWarned = false;

  constructor(frameRenderer) {
    super(frameRenderer);

    this.material = new FrameVolumeShadowMaterial(frameRenderer.gridUniforms);
    this.mesh = new Three.Mesh(fullscreenGeometry, this.material);
    this.mesh.frustumCulled = false;

    // NOTE Each draw (each cube face too) gives its camera to the pass
    this.mesh.onBeforeRender = (_renderer, _scene, camera) => {
      this.material.uniforms.frameCameraProjectionInverse.value.copy(camera.projectionMatrixInverse);
      this.material.uniforms.frameCameraWorld.value.copy(camera.matrixWorld);
      this.material.uniformsNeedUpdate = true;
    };

    this.scene.matrixWorldAutoUpdate = false;
    this.scene.add(this.mesh);

    const updaterGeometry = new Three.BufferGeometry().setAttribute(
      'position',
      new Three.Float32BufferAttribute([0, 0, 0], 3),
    );
    updaterGeometry.setDrawRange(0, 0);

    this.updaterGeometry = updaterGeometry;
    this.updaterMaterial = new Three.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

    // NOTE Placeholders for lights with no map. Empty maps cast no shadow.
    this.placeholder2D = new Three.DataTexture(new Uint16Array(4), 1, 1, Three.RGBAFormat, Three.HalfFloatType);
    this.placeholder2D.needsUpdate = true;
    this.placeholderCube = new Three.WebGLCubeRenderTarget(1, targetOptions);
    this.placeholderReady = false;

    const fill = (length, create) => Array.from({ length }, create);
    const slots = maxLights * frameMaxShadowMapCascades;

    // NOTE Shared by all patched materials. Values change in place.
    this.receiverUniforms = {
      frameVolumeDirEnabled: { value: fill(maxLights, () => 0) },
      frameVolumeDirCount: { value: fill(maxLights, () => 0) },
      frameVolumeDirBreaks: { value: fill(maxLights, () => new Three.Vector4()) },
      frameVolumeDirForward: { value: fill(maxLights, () => new Three.Vector3(0.0, 0.0, -1.0)) },
      frameVolumeDirSize: { value: fill(maxLights, () => 1) },
      frameVolumeDirViewProjection: { value: fill(slots, () => new Three.Matrix4()) },
      frameVolumeDirOrigin: { value: fill(slots, () => new Three.Vector3()) },
      frameVolumeDirFar: { value: fill(slots, () => 1) },
      frameVolumeDirMap: { value: fill(maxLights, () => this.placeholder2D) },
      frameVolumeSpotEnabled: { value: fill(maxLights, () => 0) },
      frameVolumeSpotViewProjection: { value: fill(maxLights, () => new Three.Matrix4()) },
      frameVolumeSpotOrigin: { value: fill(maxLights, () => new Three.Vector3()) },
      frameVolumeSpotFar: { value: fill(maxLights, () => 1) },
      frameVolumeSpotMap: { value: fill(maxLights, () => this.placeholder2D) },
      frameVolumePointEnabled: { value: fill(maxLights, () => 0) },
      frameVolumePointOrigin: { value: fill(maxLights, () => new Three.Vector3()) },
      frameVolumePointFar: { value: fill(maxLights, () => 1) },
      frameVolumePointMap: { value: fill(maxLights, () => this.placeholderCube.texture) },
      frameVolumePointSpectralMap: { value: fill(maxLights, () => this.placeholderCube.texture) },
    };
  }

  // NOTE The lit material patch is on when volume shadows are on and the three.js chunk is known
  isPatchActive() {
    return this.frameRenderer.settings.castShadows && this.entries.size > 0 && this.receiverChunk !== null;
  }

  getEntry(renderer, light) {
    let entry = this.entries.get(light);

    if (!entry) {
      const isPoint = light.isPointLight === true;
      const size = this.getMapSize();
      const spectral = this.isSpectral();
      const target = initTarget(renderer, createTarget(size, light, spectral), isPoint);
      // NOTE frameRenderer.settings.spectral: the optical depth of each channel in a second row, or a second cube map
      const spectralTarget = spectral && isPoint ? initTarget(renderer, createTarget(size, light), isPoint) : null;

      entry = this.createEntry(light, size, spectral, target, spectralTarget);
      entry.enabled = { value: 0 };
      // NOTE Current camera values of the pass, the same shape as the ray uniforms of WebGPU
      entry.rayUniforms = {
        frameShadowOrigin: { value: new Three.Vector3() },
        frameShadowForward: { value: new Three.Vector3(0.0, 0.0, -1.0) },
        frameShadowPerspective: { value: 0 },
        frameShadowFar: { value: 1.0 },
      };

      // NOTE The updater makes the maps before the lit meshes of each render
      const updater = new Three.Mesh(this.updaterGeometry, this.updaterMaterial);
      updater.name = 'FrameVolumeShadowUpdater';
      updater.frustumCulled = false;
      updater.renderOrder = -1000000;
      updater.onBeforeRender = (renderer, scene, camera) => this.runUpdater(renderer, scene, camera);
      light.add(updater);
      entry.updater = updater;

      this.entries.set(light, entry);
    }

    return entry;
  }

  // NOTE A new map for a new size or a spectral change. The receivers get it in the uniforms of the next render.
  resizeMap(renderer, entry, size, spectral) {
    this.retired.push(entry.target);

    if (entry.spectralTarget) {
      this.retired.push(entry.spectralTarget);
    }

    entry.target = initTarget(renderer, createTarget(size, entry.light, spectral), entry.isPoint);
    entry.size = size;
    entry.spectral = spectral;
    entry.spectralTarget = spectral && entry.isPoint ? initTarget(renderer, createTarget(size, entry.light), entry.isPoint) : null;
    this.resetSignatures(entry);
    entry.drawn.cascadeCount = 0;

    if (entry.cubeCamera) {
      entry.cubeCamera.renderTarget = entry.target;
    }
  }

  // NOTE Frees the map and the updater of a light. The maps are disposed in the next update().
  freeEntry(entry) {
    this.retired.push(entry.target);

    if (entry.spectralTarget) {
      this.retired.push(entry.spectralTarget);
    }

    entry.updater.parent?.remove(entry.updater);
    this.entries.delete(entry.light);
  }

  // NOTE Receiver uniforms that point to a retired map get the placeholder. Then no material binds a disposed map.
  disposeRetired() {
    if (this.retired.length === 0) {
      return;
    }

    const uniforms = this.receiverUniforms;

    for (let i = 0; i < this.retired.length; i++) {
      const target = this.retired[i];

      replaceTexture(uniforms.frameVolumeDirMap.value, target.texture, this.placeholder2D);
      replaceTexture(uniforms.frameVolumeSpotMap.value, target.texture, this.placeholder2D);
      replaceTexture(uniforms.frameVolumePointMap.value, target.texture, this.placeholderCube.texture);
      replaceTexture(uniforms.frameVolumePointSpectralMap.value, target.texture, this.placeholderCube.texture);
      target.dispose();
    }

    this.retired.length = 0;
  }

  // NOTE The placeholder cube map is cleared one time, before the first update
  update(renderer, lights) {
    if (!this.placeholderReady) {
      initTarget(renderer, this.placeholderCube, true);
      this.placeholderReady = true;
    }

    super.update(renderer, lights);
  }

  // NOTE A new shadow light gets an entry and an updater
  install(renderer, light) {
    this.getEntry(renderer, light);
  }

  // NOTE Material hooks keep the shader in sync with the patch state (on or off)
  patchMaterial(material) {
    if (this.patchedMaterials.has(material)) {
      return;
    }

    const shadows = this;
    const state = { active: false, spectral: false };
    const { onBeforeCompile, onBeforeRender, customProgramCacheKey } = material;

    material.onBeforeCompile = function (shader, renderer) {
      onBeforeCompile.call(this, shader, renderer);

      if (!state.active) {
        return;
      }

      Object.assign(shader.uniforms, shadows.receiverUniforms);

      const pars = state.spectral ? spectralReceiverPars : receiverPars;

      if (this.isShadowMaterial) {
        shader.vertexShader = shader.vertexShader
          .replace('void main() {', `${maskVertexPars}\nvoid main() {`)
          .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${maskVertex}`);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <lights_pars_begin>', `#include <lights_pars_begin>\n${pars}`)
          .replace(
            '#include <shadowmask_pars_fragment>',
            state.spectral ? shadows.spectralReceiverMaskChunk : shadows.receiverMaskChunk,
          );

        return;
      }

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <lights_pars_begin>', `#include <lights_pars_begin>\n${pars}`)
        .replace(
          '#include <lights_fragment_begin>',
          state.spectral ? shadows.spectralReceiverChunk : shadows.receiverChunk,
        );
    };

    // NOTE The default key of three.js is the text of onBeforeCompile. That is now this patch, so add the text of the user hook.
    material.customProgramCacheKey = function () {
      return `${customProgramCacheKey.call(this)}|${onBeforeCompile.toString()}|frameVolumeShadows:${state.active ? 1 : 0}:${state.spectral ? 1 : 0}`;
    };

    material.onBeforeRender = function (renderer, scene, ...rest) {
      const active = shadows.isPatchActive() && (!this.isShadowMaterial || shadows.receiverMaskChunk !== null);
      const spectral = active && shadows.isSpectral();

      if (active !== state.active || spectral !== state.spectral) {
        state.active = active;
        state.spectral = spectral;
        this.needsUpdate = true;
      }

      onBeforeRender.call(this, renderer, scene, ...rest);
    };

    this.patchedMaterials.add(material);
  }

  // NOTE The has() check is before the patchMaterial call. Each call of patchMaterial makes a closure context.
  patchLitMaterial(material) {
    if (isLitMaterial(material) && !this.patchedMaterials.has(material)) {
      this.patchMaterial(material);
    }
  }

  // NOTE Walk callback of runUpdater: patches new lit materials (state.patch), finds the shadow lights of the camera layers
  visitObject = (object) => {
    const { state } = this;

    if (object.isLight) {
      if (object.castShadow && object.layers.test(state.camera.layers)) {
        if (this.orderCount === this.orderLights.length) {
          this.orderLights.push(object);
        } else {
          this.orderLights[this.orderCount] = object;
        }

        this.orderCount++;
      }

      return;
    }

    const { material } = object;

    if (!state.patch || !material) {
      return;
    }

    if (Array.isArray(material)) {
      for (let i = 0; i < material.length; i++) {
        this.patchLitMaterial(material[i]);
      }
    } else {
      this.patchLitMaterial(material);
    }
  };

  // NOTE Shadow order of three.js (WebGLLights): shadow lights first, then lights with a map, then scene order.
  // NOTE Only shadow lights get a shadow index. Their order: lights with a map first, then scene order.
  setShadowOrder() {
    const { directional, spot, point } = this.shadowOrder;
    let directionalCount = 0;
    let spotCount = 0;
    let pointCount = 0;

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.orderCount; i++) {
        const light = this.orderLights[i];

        if (Boolean(light.map) !== (pass === 0)) {
          continue;
        }

        if (light.isDirectionalLight) {
          if (directionalCount < maxLights) {
            directional[directionalCount] = light;
          }

          directionalCount++;
        } else if (light.isSpotLight) {
          if (spotCount < maxLights) {
            spot[spotCount] = light;
          }

          spotCount++;
        } else if (light.isPointLight) {
          if (pointCount < maxLights) {
            point[pointCount] = light;
          }

          pointCount++;
        }
      }
    }

    for (let i = 0; i < maxLights; i++) {
      if (i >= directionalCount) {
        directional[i] = null;
      }

      if (i >= spotCount) {
        spot[i] = null;
      }

      if (i >= pointCount) {
        point[i] = null;
      }
    }

    // NOTE The reused array keeps no removed lights
    for (let i = 0; i < this.orderCount; i++) {
      this.orderLights[i] = null;
    }

    this.orderCount = 0;
  }

  // NOTE Copies ray values to the uniforms of the pass material
  setPassRay(origin, forward, perspective, far) {
    const { uniforms } = this.material;

    uniforms.frameShadowOrigin.value.copy(origin);
    uniforms.frameShadowForward.value.copy(forward);
    uniforms.frameShadowPerspective.value = perspective;
    uniforms.frameShadowFar.value = far;
    this.material.uniformsNeedUpdate = true;
  }

  // NOTE Draws the pass into the map of the entry: one tile of it (viewport), or all cube faces (point lights)
  drawPass(renderer, entry, camera, viewport) {
    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();

    renderer.getClearColor(clearColor);
    renderer.autoClear = false;
    this.mesh.layers.mask = camera.layers.mask;

    // NOTE Spectral: the second draw writes the optical depth of each channel. Point lights: into the second cube map.
    // Directional and spot lights: into the second row of the same map.
    const outputs = entry.spectral ? 2 : 1;

    for (let output = 0; output < outputs; output++) {
      this.material.uniforms.frameShadowOutput.value = output;

      if (entry.isPoint) {
        entry.cubeCamera.renderTarget = output === 0 ? entry.target : entry.spectralTarget;
        entry.cubeCamera.update(renderer, this.scene);
      } else {
        entry.target.viewport.copy(viewport);
        entry.target.viewport.y += output * entry.size;
        entry.target.scissorTest = false;
        renderer.setRenderTarget(entry.target);
        renderer.render(this.scene, camera);
      }
    }

    if (entry.isPoint) {
      entry.cubeCamera.renderTarget = entry.target;
    }

    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  }

  // NOTE Volume shadow maps of all lights, before the lit meshes. core/FrameVolumeShadows.js drawMaps draws them.
  updateMaps(renderer, scene, camera) {
    const { frameRenderer } = this;

    this.drawMaps(
      renderer,
      scene,
      camera,
      frameRenderer.settings.castShadows && frameRenderer.prepareShadowGrid(renderer, scene, camera),
    );
  }

  // NOTE Receiver uniforms for the shadow order of this render (the shadow index of each light in the shaders)
  updateReceivers() {
    const uniforms = this.receiverUniforms;
    const order = this.shadowOrder;
    const spectral = this.isSpectral();

    for (let i = 0; i < maxLights; i++) {
      const directional = this.entries.get(order.directional[i]);
      const spot = this.entries.get(order.spot[i]);
      const pointEntry = this.entries.get(order.point[i]);

      const directionalEnabled = directional?.enabled.value === 1;
      const spotEnabled = spot?.enabled.value === 1;
      const pointEnabled = pointEntry?.enabled.value === 1;

      uniforms.frameVolumeDirEnabled.value[i] = directionalEnabled ? 1 : 0;
      uniforms.frameVolumeSpotEnabled.value[i] = spotEnabled ? 1 : 0;
      uniforms.frameVolumePointEnabled.value[i] = pointEnabled ? 1 : 0;

      if (directionalEnabled) {
        const { drawn } = directional;

        uniforms.frameVolumeDirCount.value[i] = drawn.cascadeCount;
        uniforms.frameVolumeDirBreaks.value[i].copy(drawn.cascadeBreaks);
        uniforms.frameVolumeDirForward.value[i].copy(drawn.forward);
        uniforms.frameVolumeDirSize.value[i] = directional.size;
        // NOTE A map of the other layout (just after a spectral change) is not read
        uniforms.frameVolumeDirMap.value[i] =
          directional.spectral === spectral ? directional.target.texture : this.placeholder2D;

        for (let c = 0; c < directional.cascades.length; c++) {
          const cascade = directional.cascades[c];
          const slot = i * frameMaxShadowMapCascades + c;

          uniforms.frameVolumeDirViewProjection.value[slot].copy(cascade.drawn.viewProjection);
          uniforms.frameVolumeDirOrigin.value[slot].copy(cascade.drawn.origin);
          uniforms.frameVolumeDirFar.value[slot] = cascade.drawn.far;
        }
      } else {
        uniforms.frameVolumeDirMap.value[i] = this.placeholder2D;
      }

      if (spotEnabled) {
        uniforms.frameVolumeSpotViewProjection.value[i].copy(spot.drawn.viewProjection);
        uniforms.frameVolumeSpotOrigin.value[i].copy(spot.drawn.origin);
        uniforms.frameVolumeSpotFar.value[i] = spot.drawn.far;
        uniforms.frameVolumeSpotMap.value[i] = spot.spectral === spectral ? spot.target.texture : this.placeholder2D;
      } else {
        uniforms.frameVolumeSpotMap.value[i] = this.placeholder2D;
      }

      if (pointEnabled) {
        uniforms.frameVolumePointOrigin.value[i].copy(pointEntry.drawn.origin);
        uniforms.frameVolumePointFar.value[i] = pointEntry.drawn.far;
        uniforms.frameVolumePointMap.value[i] = pointEntry.target.texture;
        uniforms.frameVolumePointSpectralMap.value[i] = pointEntry.spectralTarget?.texture ?? this.placeholderCube.texture;
      } else {
        uniforms.frameVolumePointMap.value[i] = this.placeholderCube.texture;
        uniforms.frameVolumePointSpectralMap.value[i] = this.placeholderCube.texture;
      }
    }

    this.clearShadowOrder();
  }

  // NOTE The shadow order keeps no lights after use. Removed lights are then free.
  clearShadowOrder() {
    const { directional, spot, point } = this.shadowOrder;

    for (let i = 0; i < maxLights; i++) {
      directional[i] = null;
      spot[i] = null;
      point[i] = null;
    }
  }

  // NOTE One time in each render (the first updater): patch new lit materials, make the maps, set the receivers.
  // NOTE Updaters draw nothing, so no render is between the updaters of one render.
  runUpdater(renderer, scene, camera) {
    // NOTE Override passes (the depth pass of the frame renderer, other effects) do not make the maps
    if (!renderer.isWebGLRenderer || scene.overrideMaterial) {
      return;
    }

    if (renderer.info.render.frame === this.updaterFrame && camera === this.updaterCamera) {
      return;
    }

    if (this.receiverChunk === null && !this.chunkWarned) {
      console.warn('FrameVolume: unknown three.js lights_fragment_begin chunk. Volume shadows on meshes are off.');
      this.chunkWarned = true;
    }

    // NOTE One scene walk: new lit materials (one time in each frame) and the shadow lights for the shadow order
    const { state } = this;

    state.camera = camera;
    state.patch = this.patchFrame !== renderer.info.render.frame;
    this.patchFrame = renderer.info.render.frame;
    this.orderCount = 0;
    scene.traverseVisible(this.visitObject);
    state.camera = null;
    state.patch = false;
    this.setShadowOrder();

    // NOTE Shadow maps of this render are ready. The nested pass renders must not update them again.
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const currentShadowNeedsUpdate = renderer.shadowMap.needsUpdate;

    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = false;

    this.updateMaps(renderer, scene, camera);

    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.shadowMap.needsUpdate = currentShadowNeedsUpdate;

    this.updateReceivers();

    this.updaterFrame = renderer.info.render.frame;
    this.updaterCamera = camera;
  }

  dispose() {
    this.entries.forEach((entry) => this.freeEntry(entry));
    this.disposeRetired();
    this.clearShadowOrder();

    this.material.dispose();
    this.updaterMaterial.dispose();
    this.updaterGeometry.dispose();
    this.placeholder2D.dispose();
    this.placeholderCube.dispose();
  }
}

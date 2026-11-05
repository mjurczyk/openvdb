import * as Three from 'three';
import { FrameVolumeShadowMaterial, frameMaxShadowSteps } from './FrameVolumeShadowMaterial.js';

// NOTE Directional lights: cascades of the view (three.js CSMShadowNode). All cascades are tiles of one atlas.
export const frameMaxShadowMapCascades = 4;

// NOTE Shadow lights of each type that get a volume shadow (the first ones in the three.js shadow order)
const maxLights = 4;

// NOTE Distance in front of the cascade bounds and the volume box, along the light
const cascadeMargin = 1.0;

// NOTE castShadowCoarse: small maps and few samples. Shadows are soft blobs, the passes cost almost nothing.
const coarseMapSize = 64;
const coarseSteps = 8;

const clearColor = new Three.Color();
const lightDirection = new Three.Vector3();
const lightUp = new Three.Vector3();
const point = new Three.Vector3();
const lightView = new Three.Matrix4();
const lightViewInverse = new Three.Matrix4();
const casterBox = new Three.Box3();
const casterWorldBox = new Three.Box3();
const sliceBox = new Three.Box3();
const tileViewport = new Three.Vector4();
const nearCorners = [0, 1, 2, 3].map(() => new Three.Vector3());
const farCorners = [0, 1, 2, 3].map(() => new Three.Vector3());

// NOTE Values for change checks. One array, reused for each check.
const signature = [];

const fullscreenGeometry = new Three.BufferGeometry().setAttribute(
  'position',
  new Three.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
);

const targetOptions = {
  type: Three.HalfFloatType,
  format: Three.RGBAFormat,
  minFilter: Three.LinearFilter,
  magFilter: Three.LinearFilter,
  generateMipmaps: false,
  depthBuffer: false,
};

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

// NOTE Clears a new map one time. Empty maps cast no shadow.
const initTarget = (renderer, target, cube) => {
  const currentRenderTarget = renderer.getRenderTarget();
  const currentActiveCubeFace = renderer.getActiveCubeFace();
  const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
  const currentClearAlpha = renderer.getClearAlpha();

  renderer.getClearColor(clearColor);
  renderer.setClearColor(0x000000, 0.0);

  for (let face = 0; face < (cube ? 6 : 1); face++) {
    renderer.setRenderTarget(target, face);
    renderer.clear(true, false, false);
  }

  renderer.setClearColor(clearColor, currentClearAlpha);
  renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);

  return target;
};

const isShadowLight = (light) =>
  (light.isDirectionalLight || light.isSpotLight || light.isPointLight) && light.castShadow;

// NOTE An object and all its parents are visible
const isVisible = (object) => {
  for (let current = object; current; current = current.parent) {
    if (!current.visible) {
      return false;
    }
  }

  return true;
};

// NOTE Compares the signature with the one of the item. Stores it when it is different.
const changed = (item) => {
  const same = signature.length === item.signature.length && signature.every((value, i) => value === item.signature[i]);

  if (!same) {
    item.signature.length = 0;
    item.signature.push(...signature);
  }

  return !same;
};

// NOTE Cascade split distances, the practical split of three.js CSMShadowNode (lambda 0.5).
// Returns the far distance of each cascade.
const getCascadeBreaks = (count, near, far) => {
  const breaks = [];

  for (let i = 1; i <= count; i++) {
    const uniformSplit = near + ((far - near) * i) / count;
    const logSplit = near * Math.pow(far / near, i / count);

    breaks.push(i === count ? far : Three.MathUtils.lerp(uniformSplit, logSplit, 0.5));
  }

  return breaks;
};

// NOTE Corners of the view between two depths, in world space. Corners 0 and 2 are diagonal.
const getSliceCorners = (camera, near, far) => {
  [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].forEach(([x, y], index) => {
    [
      [nearCorners[index], near],
      [farCorners[index], far],
    ].forEach(([target, depth]) => {
      // NOTE A point on the corner ray, then moved to the depth (perspective) or set to it (orthographic)
      target.set(x, y, 0.5).applyMatrix4(camera.projectionMatrixInverse);

      if (camera.isPerspectiveCamera) {
        target.multiplyScalar(depth / -target.z);
      } else {
        target.z = -depth;
      }

      target.applyMatrix4(camera.matrixWorld);
    });
  });
};

// NOTE Shadow lights in the three.js shadow order (WebGLLights): visible lights of the camera layers, in scene order.
// NOTE Sorted with shadow lights first, then lights with a map. Index i of a type is the shadow index in the shaders.
const getShadowOrder = (scene, camera) => {
  const lights = [];

  scene.traverseVisible((object) => {
    if (object.isLight && object.layers.test(camera.layers)) {
      lights.push(object);
    }
  });

  lights.sort((a, b) => (b.castShadow ? 2 : 0) - (a.castShadow ? 2 : 0) + (b.map ? 1 : 0) - (a.map ? 1 : 0));

  const order = { directional: [], spot: [], point: [] };

  lights.forEach((light) => {
    if (!light.castShadow) {
      return;
    }

    if (light.isDirectionalLight) {
      order.directional.push(light);
    } else if (light.isSpotLight) {
      order.spot.push(light);
    } else if (light.isPointLight) {
      order.point.push(light);
    }
  });

  return order;
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
export class FrameVolumeShadows {
  entries = new Map();
  scene = new Three.Scene();
  // NOTE Replaced maps. Disposed only in dispose().
  retired = [];
  renderCount = 0;
  updaterFrame = -1;
  updaterCamera = null;
  patchFrame = -1;
  patchedMaterials = new WeakSet();
  receiverChunk = getReceiverLightsChunk(false);
  receiverMaskChunk = getReceiverMaskChunk(false);
  spectralReceiverChunk = getReceiverLightsChunk(true);
  spectralReceiverMaskChunk = getReceiverMaskChunk(true);
  chunkWarned = false;

  constructor(frameRenderer) {
    this.frameRenderer = frameRenderer;
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

  getMapSize() {
    const { settings } = this.frameRenderer;

    return settings.castShadowCoarse ? coarseMapSize : Math.max(1, Math.round(settings.castShadowMapSize));
  }

  isSpectral() {
    return this.frameRenderer.settings.spectral === true;
  }

  getSteps() {
    const { settings } = this.frameRenderer;

    return settings.castShadowCoarse
      ? coarseSteps
      : Three.MathUtils.clamp(Math.round(settings.castShadowSteps), 1, frameMaxShadowSteps);
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

      entry = {
        light,
        isPoint,
        target,
        size,
        // NOTE frameRenderer.settings.spectral: the optical depth of each channel in a second row, or a second cube map
        spectral,
        spectralTarget: spectral && isPoint ? initTarget(renderer, createTarget(size, light), isPoint) : null,
        enabled: false,
        cubeCamera: isPoint ? new Three.CubeCamera(0.5, 500.0, target) : null,
        // NOTE Current camera values. drawn: the values of the last draw, for the receivers.
        ray: { origin: new Three.Vector3(), forward: new Three.Vector3(0.0, 0.0, -1.0), perspective: 0, far: 1.0 },
        drawn: {
          origin: new Three.Vector3(),
          forward: new Three.Vector3(0.0, 0.0, -1.0),
          far: 1.0,
          viewProjection: new Three.Matrix4(),
          cascadeCount: 0,
          cascadeBreaks: new Three.Vector4(),
        },
        // NOTE Spot map or cube map (all faces in one draw), or the split layout of the cascades
        item: { signature: [], lastDraw: -1 },
        cascadeCount: 0,
        cascadeBreaks: new Three.Vector4(),
        cascades: light.isDirectionalLight
          ? Array.from({ length: frameMaxShadowMapCascades }, () => ({
              camera: new Three.OrthographicCamera(),
              viewProjection: new Three.Matrix4(),
              origin: new Three.Vector3(),
              far: 1.0,
              signature: [],
              lastDraw: -1,
              drawn: { viewProjection: new Three.Matrix4(), origin: new Three.Vector3(), far: 1.0 },
            }))
          : null,
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
    entry.item.signature.length = 0;
    entry.cascades?.forEach((cascade) => (cascade.signature.length = 0));
    entry.drawn.cascadeCount = 0;

    if (entry.cubeCamera) {
      entry.cubeCamera.renderTarget = entry.target;
    }
  }

  // NOTE Called by the frame renderer one time in each frame: finds new shadow lights and new map sizes
  update(renderer, scene) {
    if (!this.placeholderReady) {
      initTarget(renderer, this.placeholderCube, true);
      this.placeholderReady = true;
    }

    if (!this.frameRenderer.settings.castShadows) {
      return;
    }

    const size = this.getMapSize();
    const spectral = this.isSpectral();

    this.entries.forEach((entry) => {
      if (entry.size !== size || entry.spectral !== spectral) {
        this.resizeMap(renderer, entry, size, spectral);
      }
    });

    scene.traverse((light) => {
      if (isShadowLight(light)) {
        this.getEntry(renderer, light);
      }
    });
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

    material.customProgramCacheKey = function () {
      return `${customProgramCacheKey.call(this)}|frameVolumeShadows:${state.active ? 1 : 0}:${state.spectral ? 1 : 0}`;
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

  patchScene(scene) {
    scene.traverseVisible((object) => {
      if (!object.material) {
        return;
      }

      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
        if (isLitMaterial(material)) {
          this.patchMaterial(material);
        }
      });
    });
  }

  // NOTE Spot lights: the light shadow camera. Point lights: a cube camera at the light. Sets the ray values.
  prepareCamera(entry) {
    const { light, ray } = entry;
    const shadowCamera = light.shadow.camera;

    if (!entry.isPoint) {
      light.shadow.updateMatrices(light);

      ray.origin.setFromMatrixPosition(shadowCamera.matrixWorld);
      shadowCamera.getWorldDirection(ray.forward);
      ray.perspective = shadowCamera.isPerspectiveCamera ? 1 : 0;
      ray.far = shadowCamera.far;

      return shadowCamera;
    }

    const { cubeCamera } = entry;
    const near = shadowCamera.near;
    const far = light.distance || shadowCamera.far;

    cubeCamera.children.forEach((camera) => {
      if (camera.near !== near || camera.far !== far) {
        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();
      }
    });

    cubeCamera.position.setFromMatrixPosition(light.matrixWorld);
    cubeCamera.updateMatrixWorld();

    ray.origin.copy(cubeCamera.position);
    ray.perspective = 1;
    ray.far = far;

    return cubeCamera.children[0];
  }

  // NOTE Cascade cameras of a directional light, the same method as three.js CSMShadowNode.
  // NOTE Practical split of the view depth. A light-aligned orthographic camera for each slice.
  // NOTE Size from the slice diagonal (same when the camera turns), position snapped to texels (no swimming).
  // NOTE The depth range of each camera covers the slice and the volume box (the last grid cascade).
  // NOTE Cascades end at the far corner of the volume box plus one box diagonal, up to castShadowDistance.
  // NOTE Near the volumes the cascades are small and fine.
  // NOTE The far distance is rounded up to half octaves, so the splits change only at these steps.
  fitCascades(entry, camera) {
    const { light, cascades, size, ray } = entry;
    const { settings, gridUniforms } = this.frameRenderer;
    const count = Three.MathUtils.clamp(Math.round(settings.castShadowCascades), 1, frameMaxShadowMapCascades);
    const last = gridUniforms.frameGridCount.value - 1;
    const near = camera.near;

    casterWorldBox.min.copy(gridUniforms.frameGridMin.value[last]);
    casterWorldBox.max.copy(gridUniforms.frameGridMin.value[last]).add(gridUniforms.frameGridSize.value[last]);

    let boxFar = 0.0;

    for (let i = 0; i < 8; i++) {
      point
        .set(
          i & 1 ? casterWorldBox.max.x : casterWorldBox.min.x,
          i & 2 ? casterWorldBox.max.y : casterWorldBox.min.y,
          i & 4 ? casterWorldBox.max.z : casterWorldBox.min.z,
        )
        .applyMatrix4(camera.matrixWorldInverse);

      boxFar = Math.max(boxFar, -point.z);
    }

    const sceneFar = Math.max(near * 2.0, boxFar + casterWorldBox.getSize(point).length());
    const steppedFar = Math.pow(2.0, Math.ceil(Math.log2(sceneFar) * 2.0) / 2.0);
    const far = Math.max(near * 1.0001, Math.min(camera.far, settings.castShadowDistance, steppedFar));
    const breaks = getCascadeBreaks(count, near, far);

    lightDirection
      .setFromMatrixPosition(light.target.matrixWorld)
      .sub(point.setFromMatrixPosition(light.matrixWorld))
      .normalize();

    // NOTE Rotation of a camera that looks along the light (Object3D.lookAt of a camera). Up is +z for vertical light.
    lightUp.set(0.0, 1.0, 0.0);

    if (Math.abs(lightDirection.y) > 0.999) {
      lightUp.set(0.0, 0.0, 1.0);
    }

    lightView.lookAt(point.set(0.0, 0.0, 0.0), lightDirection, lightUp);
    lightViewInverse.copy(lightView).invert();
    casterBox.copy(casterWorldBox).applyMatrix4(lightViewInverse);

    entry.cascadeCount = count;
    entry.cascadeBreaks.set(...[0, 1, 2, 3].map((i) => breaks[Math.min(i, count - 1)]));

    for (let i = 0; i < count; i++) {
      const cascade = cascades[i];
      const cascadeCamera = cascade.camera;

      getSliceCorners(camera, i === 0 ? near : breaks[i - 1], breaks[i]);

      const width = Math.max(farCorners[0].distanceTo(farCorners[2]), farCorners[0].distanceTo(nearCorners[2]));
      const texel = width / size;

      sliceBox.makeEmpty();
      [...nearCorners, ...farCorners].forEach((corner) =>
        sliceBox.expandByPoint(point.copy(corner).applyMatrix4(lightViewInverse)),
      );

      const centerX = Math.floor(((sliceBox.min.x + sliceBox.max.x) * 0.5) / texel) * texel;
      const centerY = Math.floor(((sliceBox.min.y + sliceBox.max.y) * 0.5) / texel) * texel;
      const front = Math.max(sliceBox.max.z, casterBox.max.z) + cascadeMargin;
      const back = Math.min(sliceBox.min.z, casterBox.min.z) - cascadeMargin;

      cascadeCamera.left = -width * 0.5;
      cascadeCamera.right = width * 0.5;
      cascadeCamera.top = width * 0.5;
      cascadeCamera.bottom = -width * 0.5;
      cascadeCamera.near = 0.0;
      cascadeCamera.far = front - back;
      cascadeCamera.updateProjectionMatrix();

      // NOTE Light view looks along -z, so the camera is at the front (largest z)
      cascadeCamera.position.set(centerX, centerY, front).applyMatrix4(lightView);
      cascadeCamera.quaternion.setFromRotationMatrix(lightView);
      cascadeCamera.updateMatrixWorld();

      cascade.viewProjection.multiplyMatrices(cascadeCamera.projectionMatrix, cascadeCamera.matrixWorldInverse);
      cascade.origin.copy(cascadeCamera.position);
      cascade.far = cascadeCamera.far;
    }

    cascades[0].camera.getWorldDirection(ray.forward);
    ray.perspective = 0;

    return count;
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
    const outputs = entry.spectral ? [0, 1] : [0];

    outputs.forEach((output) => {
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
    });

    if (entry.isPoint) {
      entry.cubeCamera.renderTarget = entry.target;
    }

    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  }

  // NOTE Adds the changed map pieces of one light to the work list. A piece: { item, cost, draw }.
  collectWork(entry, camera, renderer, work) {
    const { castVersion } = this.frameRenderer;
    const steps = this.getSteps();
    const { drawn, ray } = entry;

    if (entry.cascades) {
      const count = this.fitCascades(entry, camera);
      const forward = ray.forward;

      const drawCascade = (i) => {
        const cascade = entry.cascades[i];

        this.setPassRay(cascade.origin, forward, 0, cascade.far);
        this.drawPass(renderer, entry, cascade.camera, tileViewport.set(i * entry.size, 0, entry.size, entry.size));
        cascade.drawn.viewProjection.copy(cascade.viewProjection);
        cascade.drawn.origin.copy(cascade.origin);
        cascade.drawn.far = cascade.far;
        cascade.lastDraw = this.renderCount;
        drawn.forward.copy(forward);
      };

      const cascadeChanged = (i) => {
        const cascade = entry.cascades[i];

        signature.length = 0;
        signature.push(entry.size, castVersion, steps, ...cascade.camera.matrixWorld.elements);
        signature.push(...cascade.camera.projectionMatrix.elements);

        return changed(cascade);
      };

      // NOTE A new split layout: one piece draws all cascades, then the receivers switch to the layout.
      // Receivers never mix tiles of two layouts.
      signature.length = 0;
      signature.push(entry.size, count, ...entry.cascadeBreaks.toArray());

      if (changed(entry.item)) {
        for (let i = 0; i < count; i++) {
          cascadeChanged(i);
        }

        work.push({
          item: entry.item,
          cost: count,
          draw: () => {
            for (let i = 0; i < count; i++) {
              drawCascade(i);
            }

            drawn.cascadeCount = count;
            drawn.cascadeBreaks.copy(entry.cascadeBreaks);
          },
        });

        return;
      }

      for (let i = 0; i < count; i++) {
        if (cascadeChanged(i)) {
          work.push({ item: entry.cascades[i], cost: 1, draw: () => drawCascade(i) });
        }
      }

      return;
    }

    const shadowCamera = this.prepareCamera(entry);

    signature.length = 0;
    signature.push(entry.size, castVersion, steps, ...(entry.isPoint ? entry.cubeCamera : shadowCamera).matrixWorld.elements);
    signature.push(...shadowCamera.projectionMatrix.elements);

    if (!changed(entry.item)) {
      return;
    }

    work.push({
      item: entry.item,
      // NOTE All six cube faces in one draw, then the faces always match
      cost: entry.isPoint ? 6 : 1,
      draw: () => {
        this.setPassRay(ray.origin, ray.forward, ray.perspective, ray.far);
        this.drawPass(renderer, entry, shadowCamera, tileViewport.set(0, 0, entry.size, entry.size));
        drawn.origin.copy(ray.origin);
        drawn.forward.copy(ray.forward);
        drawn.far = ray.far;
        drawn.viewProjection.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse);
      },
    });
  }

  // NOTE Volume shadow maps of all lights, before the lit meshes.
  // NOTE Changed pieces are drawn oldest first, up to castShadowUpdatesPerFrame (a tile or spot map costs 1, a cube map 6).
  // NOTE The oldest piece is always drawn. Then a large piece does not wait forever.
  updateMaps(renderer, scene, camera) {
    this.renderCount++;

    const { frameRenderer } = this;
    const ready = frameRenderer.settings.castShadows && frameRenderer.prepareShadowGrid(renderer, scene, camera);

    if (!ready) {
      this.entries.forEach((entry) => {
        entry.enabled = false;
        entry.item.signature.length = 0;
        entry.cascades?.forEach((cascade) => (cascade.signature.length = 0));
      });

      return;
    }

    this.material.setSpectral(this.isSpectral());
    this.material.uniforms.frameShadowDensityMap.value = frameRenderer.shadowDensityTarget.textures[0];
    this.material.uniforms.frameShadowSteps.value = this.getSteps();

    const work = [];

    this.entries.forEach((entry) => {
      entry.enabled = entry.light.castShadow && isVisible(entry.light);

      if (entry.enabled) {
        this.collectWork(entry, camera, renderer, work);
      }
    });

    work.sort((a, b) => a.item.lastDraw - b.item.lastDraw);

    let budget = Math.max(1, Math.round(frameRenderer.settings.castShadowUpdatesPerFrame));

    work.forEach((piece, index) => {
      if (index > 0 && piece.cost > budget) {
        // NOTE Not drawn: the next check sees the change again
        piece.item.signature.length = 0;

        return;
      }

      piece.draw();
      piece.item.lastDraw = this.renderCount;
      budget -= piece.cost;
    });
  }

  // NOTE Receiver uniforms for the shadow order of this render (the shadow index of each light in the shaders)
  updateReceivers(scene, camera) {
    const uniforms = this.receiverUniforms;
    const order = getShadowOrder(scene, camera);
    const spectral = this.isSpectral();

    for (let i = 0; i < maxLights; i++) {
      const directional = this.entries.get(order.directional[i]);
      const spot = this.entries.get(order.spot[i]);
      const pointEntry = this.entries.get(order.point[i]);

      uniforms.frameVolumeDirEnabled.value[i] = directional?.enabled ? 1 : 0;
      uniforms.frameVolumeSpotEnabled.value[i] = spot?.enabled ? 1 : 0;
      uniforms.frameVolumePointEnabled.value[i] = pointEntry?.enabled ? 1 : 0;

      if (directional?.enabled) {
        const { drawn } = directional;

        uniforms.frameVolumeDirCount.value[i] = drawn.cascadeCount;
        uniforms.frameVolumeDirBreaks.value[i].copy(drawn.cascadeBreaks);
        uniforms.frameVolumeDirForward.value[i].copy(drawn.forward);
        uniforms.frameVolumeDirSize.value[i] = directional.size;
        // NOTE A map of the other layout (just after a spectral change) is not read
        uniforms.frameVolumeDirMap.value[i] =
          directional.spectral === spectral ? directional.target.texture : this.placeholder2D;

        directional.cascades.forEach((cascade, c) => {
          const slot = i * frameMaxShadowMapCascades + c;

          uniforms.frameVolumeDirViewProjection.value[slot].copy(cascade.drawn.viewProjection);
          uniforms.frameVolumeDirOrigin.value[slot].copy(cascade.drawn.origin);
          uniforms.frameVolumeDirFar.value[slot] = cascade.drawn.far;
        });
      } else {
        uniforms.frameVolumeDirMap.value[i] = this.placeholder2D;
      }

      if (spot?.enabled) {
        uniforms.frameVolumeSpotViewProjection.value[i].copy(spot.drawn.viewProjection);
        uniforms.frameVolumeSpotOrigin.value[i].copy(spot.drawn.origin);
        uniforms.frameVolumeSpotFar.value[i] = spot.drawn.far;
        uniforms.frameVolumeSpotMap.value[i] = spot.spectral === spectral ? spot.target.texture : this.placeholder2D;
      } else {
        uniforms.frameVolumeSpotMap.value[i] = this.placeholder2D;
      }

      if (pointEntry?.enabled) {
        uniforms.frameVolumePointOrigin.value[i].copy(pointEntry.drawn.origin);
        uniforms.frameVolumePointFar.value[i] = pointEntry.drawn.far;
        uniforms.frameVolumePointMap.value[i] = pointEntry.target.texture;
        uniforms.frameVolumePointSpectralMap.value[i] = pointEntry.spectralTarget?.texture ?? this.placeholderCube.texture;
      } else {
        uniforms.frameVolumePointMap.value[i] = this.placeholderCube.texture;
        uniforms.frameVolumePointSpectralMap.value[i] = this.placeholderCube.texture;
      }
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

    if (this.patchFrame !== renderer.info.render.frame) {
      this.patchFrame = renderer.info.render.frame;
      this.patchScene(scene);
    }

    // NOTE Shadow maps of this render are ready. The nested pass renders must not update them again.
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const currentShadowNeedsUpdate = renderer.shadowMap.needsUpdate;

    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = false;

    this.updateMaps(renderer, scene, camera);

    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.shadowMap.needsUpdate = currentShadowNeedsUpdate;

    this.updateReceivers(scene, camera);

    this.updaterFrame = renderer.info.render.frame;
    this.updaterCamera = camera;
  }

  dispose() {
    this.entries.forEach((entry) => {
      entry.target.dispose();
      entry.spectralTarget?.dispose();
      entry.updater.parent?.remove(entry.updater);
    });
    this.entries.clear();

    this.retired.forEach((resource) => resource.dispose());
    this.retired = [];

    this.material.dispose();
    this.updaterMaterial.dispose();
    this.updaterGeometry.dispose();
    this.placeholder2D.dispose();
    this.placeholderCube.dispose();
  }
}

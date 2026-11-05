import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  float,
  int,
  uniform,
  texture,
  cubeTexture,
  vec2,
  vec3,
  vec4,
  select,
  dot,
  exp,
  clamp,
  max,
  positionWorld,
  positionView,
  renderGroup,
  BasicShadowFilter,
  PCFShadowFilter,
  VSMShadowFilter,
  BasicPointShadowFilter,
  PointShadowFilter,
} from 'three/tsl';
import {
  FrameVolumeShadowMaterial,
  createShadowRayUniforms,
  frameShadowDepth,
  frameMaxShadowSteps,
} from './FrameVolumeShadowMaterial.js';

// NOTE The default filters of three.js ShadowNode, in shadow map type order. PCFSoftShadowMap has no filter.
const shadowFilters = [BasicShadowFilter, PCFShadowFilter, null, VSMShadowFilter];

// NOTE The default filter of three.js PointShadowNode
const getPointShadowFilter = (type) =>
  type === Three.BasicShadowMap ? BasicPointShadowFilter : PointShadowFilter;


// NOTE Optical depth below this value casts no shadow
const minOpticalDepth = 1e-4;

// NOTE Directional lights: cascades of the view (three.js CSMShadowNode). All cascades are tiles of one atlas.
export const frameMaxShadowMapCascades = 4;

// NOTE Distance in front of the cascade bounds and the volume box, along the light
const cascadeMargin = 1.0;

// NOTE castShadowCoarse: small maps and few samples. Shadows are soft blobs, the passes cost almost nothing.
const coarseMapSize = 64;
const coarseSteps = 8;

// NOTE Values for change checks. One array, reused for each check.
const signature = [];

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

// NOTE Fullscreen triangle. Positions are clip coordinates.
const fullscreenGeometry = new Three.BufferGeometry().setAttribute(
  'position',
  new Three.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
);

const pushMatrix = (signature, matrix) => {
  for (let i = 0; i < 16; i++) {
    signature.push(matrix.elements[i]);
  }
};

const targetOptions = {
  type: Three.HalfFloatType,
  format: Three.RGBAFormat,
  minFilter: Three.LinearFilter,
  magFilter: Three.LinearFilter,
  generateMipmaps: false,
  depthBuffer: false,
};

// NOTE Directional lights: an atlas with one tile for each cascade, in a row
const createTarget = (size, light) => {
  if (light.isPointLight) {
    return new Three.CubeRenderTarget(size, targetOptions);
  }

  const tiles = light.isDirectionalLight ? frameMaxShadowMapCascades : 1;

  return new Three.RenderTarget(size * tiles, size, targetOptions);
};

// NOTE Clears a new map one time. Then three.js makes its GPU texture as a render target texture now.
// NOTE Else the first render makes a new GPU texture, and receivers that sampled the map before keep the destroyed one.
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

const sameSignature = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

const isShadowLight = (light) =>
  (light.isDirectionalLight || light.isSpotLight || light.isPointLight) && light.castShadow;

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
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];

  corners.forEach(([x, y], index) => {
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

// NOTE three.js makes the shadow node of a light one time. Then a new filterNode has no effect.
// NOTE disposeShadow of the light node makes the receivers build a new shadow node.
// NOTE Uses three.js internals: setupLightsNode gives the light node that all materials share.
// NOTE Returns the old shadow node. Keep it, because receivers can still use its shadow map.
let resetWarned = false;

const resetLightShadow = (light) => {
  const nodeData = {};
  let lightNode = null;

  // NOTE Other three.js versions can have other internals. Then the light keeps its shadow node, with no volume shadow.
  try {
    [lightNode] = new Three.LightsNode()
      .setLights([light])
      .setupLightsNode({ getDataFromNode: () => nodeData, context: { materialLightings: [] } });
  } catch (error) {
    if (!resetWarned) {
      resetWarned = true;
      console.warn('FrameVolumeShadows: this three.js version cannot reset light shadows. Use three.js r187.', error);
    }

    return null;
  }

  if (!lightNode || !lightNode.disposeShadow || !lightNode.shadowNode) {
    return null;
  }

  const shadowNode = lightNode.shadowNode;

  // NOTE disposeShadow without the GPU dispose
  lightNode.shadowNode = { dispose() {} };
  lightNode.disposeShadow();

  return shadowNode;
};

// NOTE A uniform that copies a value of the entry one time in each render (the render group).
// NOTE A light shadow node is built one time. Its uniforms in the object group keep the value of the first build.
// NOTE three.js ShadowNode also puts its values (bias, intensity, near, far) in the render group.
// NOTE The copy is after updateBefore of the first receiver (Renderer: updateBefore, then updateForRender).
const renderUniform = (value, type, read) => uniform(value, type).setGroup(renderGroup).onRenderUpdate(read);

// NOTE Receivers read the drawn state: the values of the camera that drew each map or cascade tile.
// NOTE A map that waits for the frame budget is older, but its values match, so its shadow stays in place.
const createReceiverUniforms = (entry) => {
  const { drawn, cascades } = entry;

  return {
    enabled: renderUniform(0, 'int', () => entry.enabled.value),
    rayUniforms: {
      frameShadowOrigin: renderUniform(new Three.Vector3(), 'vec3', () => drawn.origin),
      frameShadowForward: renderUniform(new Three.Vector3(), 'vec3', () => drawn.forward),
      frameShadowPerspective: renderUniform(0, 'int', () => drawn.perspective),
      frameShadowFar: renderUniform(1.0, 'float', () => drawn.far),
    },
    cascades: cascades
      ? {
          count: renderUniform(0, 'int', () => drawn.cascadeCount),
          breaks: renderUniform(new Three.Vector4(), 'vec4', () => drawn.cascadeBreaks),
          items: cascades.map((cascade) => ({
            viewProjection: renderUniform(new Three.Matrix4(), 'mat4', () => cascade.drawn.viewProjection),
            origin: renderUniform(new Three.Vector3(), 'vec3', () => cascade.drawn.origin),
            far: renderUniform(1.0, 'float', () => cascade.drawn.far),
          })),
        }
      : null,
  };
};

// NOTE Picks the cascade of the receiver by its view depth, the same as three.js CSMShadowNode.
// NOTE Returns the atlas uv, the ray uniforms of the cascade, and if the receiver is in a cascade.
const getCascadeLookup = (receiver) => {
  const { count, breaks, items } = receiver.cascades;
  const { frameShadowForward } = receiver.rayUniforms;
  const depth = positionView.z.negate();
  const breakList = [breaks.x, breaks.y, breaks.z, breaks.w];

  // NOTE Cascade index: the number of cascade far distances in front of the receiver
  let index = int(0);

  for (let i = 0; i < frameMaxShadowMapCascades - 1; i++) {
    index = index.add(select(depth.greaterThan(breakList[i]).and(int(i + 1).lessThan(count)), int(1), int(0)));
  }

  const pick = (key) =>
    items.reduce((result, item, i) => (i === 0 ? item[key] : select(index.equal(i), item[key], result)), null);

  const viewProjection = pick('viewProjection');
  const clip = viewProjection.mul(vec4(positionWorld, 1.0));
  const tileUv = vec2(clip.x.mul(0.5).add(0.5), float(0.5).sub(clip.y.mul(0.5)));
  const lastBreak = breakList.reduce((result, value, i) => (i === 0 ? value : select(count.equal(i + 1), value, result)), null);

  // NOTE Half a texel in from the tile sides. Then the linear filter does not read the next tile.
  const inset = float(0.5).div(float(receiver.size));
  const clampedUv = clamp(tileUv, vec2(inset), vec2(float(1.0).sub(inset)));

  return {
    uv: vec2(clampedUv.x.add(float(index)).div(frameMaxShadowMapCascades), clampedUv.y),
    inside: depth
      .lessThanEqual(lastBreak)
      .and(tileUv.x.greaterThanEqual(0.0))
      .and(tileUv.x.lessThanEqual(1.0))
      .and(tileUv.y.greaterThanEqual(0.0))
      .and(tileUv.y.lessThanEqual(1.0)),
    rayUniforms: {
      frameShadowOrigin: pick('origin'),
      frameShadowForward,
      frameShadowPerspective: int(0),
      frameShadowFar: pick('far'),
    },
  };
};

// NOTE Volume transmittance at a receiver, from the Beer shadow map of the light. Part of the light shadow filter.
// NOTE uv is the shadow map uv (spot) or the direction from the light (point). Directional lights pick a cascade.
// NOTE updateBefore renders the shadow map before the first receiver of each render.
class FrameVolumeShadowNode extends Three.Node {
  static get type() {
    return 'FrameVolumeShadowNode';
  }

  constructor(shadows, entry, uv) {
    super('float');

    this.shadows = shadows;
    this.entry = entry;
    this.uv = uv;
    this.updateBeforeType = Three.NodeUpdateType.RENDER;
  }

  // NOTE Spectral maps: transmittance of each channel. ShadowMaterial has one shadow mask, so it gets the mean.
  isSpectral(builder) {
    return this.entry.spectralMap !== null && builder.material?.isShadowNodeMaterial !== true;
  }

  getNodeType(builder) {
    return this.isSpectral(builder) ? 'vec3' : 'float';
  }

  updateBefore(frame) {
    this.shadows.render(frame.renderer, frame.scene, frame.camera, frame.renderId, this.entry);
  }

  setup(builder) {
    const { entry } = this;
    const { map, spectralMap, isPoint, receiver } = entry;
    const spectral = this.isSpectral(builder);
    let { uv } = this;
    let { rayUniforms } = receiver;
    let inside = receiver.enabled.equal(1);

    if (receiver.cascades) {
      const lookup = getCascadeLookup({ ...receiver, size: entry.size });

      uv = lookup.uv;
      rayUniforms = lookup.rayUniforms;
      inside = inside.and(lookup.inside);
    } else if (!isPoint) {
      inside = inside
        .and(uv.x.greaterThanEqual(0.0))
        .and(uv.x.lessThanEqual(1.0))
        .and(uv.y.greaterThanEqual(0.0))
        .and(uv.y.lessThanEqual(1.0));
    }

    return Fn(() => {
      const result = (spectral ? vec3(1.0) : float(1.0)).toVar();

      If(inside, () => {
        const texel = map.sample(uv).level(0).toVar();
        const opticalDepth = texel.w;

        If(opticalDepth.greaterThan(minOpticalDepth), () => {
          const far = rayUniforms.frameShadowFar;
          const first = texel.x.div(opticalDepth).mul(far);
          const last = texel.y.div(opticalDepth).mul(far);
          const depth = frameShadowDepth(rayUniforms, positionWorld);

          // NOTE Beer shadow map: optical depth grows linearly from the first to the last density
          const along = clamp(depth.sub(first).div(max(last.sub(first), 1e-4)), 0.0, 1.0);

          if (spectral) {
            result.assign(exp(spectralMap.sample(uv).level(0).rgb.mul(along).negate()));
          } else if (spectralMap) {
            // NOTE ShadowMaterial with spectral maps: mean transmittance of the channels
            result.assign(dot(exp(spectralMap.sample(uv).level(0).rgb.mul(along).negate()), vec3(1.0 / 3.0)));
          } else {
            result.assign(exp(opticalDepth.mul(along).negate()));
          }
        });
      });

      return result;
    })();
  }
}

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

// NOTE Shadows of FrameVolume objects on meshes (frameRenderer.settings.castShadows).
// NOTE Each shadow light gets a Beer shadow map, made from the world shadow grid of the frame renderer.
// NOTE Directional lights: cascades of the view. Spot lights: the light shadow camera. Point lights: a cube map.
// NOTE The light filterNode multiplies the three.js shadow with the volume transmittance.
// NOTE A map piece (cascade tile, spot map, cube map) is made again only when its camera or the grid changes.
// NOTE At most castShadowUpdatesPerFrame pieces in a render, the oldest first. Then the cost of a frame has a limit.
export class FrameVolumeShadows {
  entries = new Map();
  scene = new Three.Scene();
  rayUniforms = createShadowRayUniforms();
  // NOTE Replaced maps and shadow nodes. Receivers can still use them, so only dispose() disposes them.
  // NOTE The list grows only when the map size setting or castShadowCoarse changes.
  retired = [];
  renderCount = 0;
  mapsRenderId = -1;
  mapsCamera = null;

  constructor(frameRenderer) {
    this.frameRenderer = frameRenderer;
    this.material = new FrameVolumeShadowMaterial(frameRenderer, this.rayUniforms);
    this.mesh = new Three.Mesh(fullscreenGeometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.matrixWorldAutoUpdate = false;
    this.scene.add(this.mesh);
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

  getEntry(renderer, light) {
    let entry = this.entries.get(light);

    if (!entry) {
      const isPoint = light.isPointLight === true;
      const size = this.getMapSize();
      const spectral = this.isSpectral();
      const target = initTarget(renderer, createTarget(size, light), isPoint);
      const spectralTarget = spectral ? initTarget(renderer, createTarget(size, light), isPoint) : null;

      entry = {
        light,
        isPoint,
        target,
        size,
        // NOTE frameRenderer.settings.spectral: a second map with the optical depth of each channel
        spectral,
        spectralTarget,
        spectralMap: spectralTarget
          ? isPoint
            ? cubeTexture(spectralTarget.texture)
            : texture(spectralTarget.texture)
          : null,
        renderId: -1,
        cubeCamera: isPoint ? new Three.CubeCamera(0.5, 500.0, target) : null,
        map: isPoint ? cubeTexture(target.texture) : texture(target.texture),
        enabled: uniform(0, 'int'),
        // NOTE Current camera values. drawn: the values of the last draw, for the receivers.
        rayUniforms: createShadowRayUniforms(),
        drawn: {
          origin: new Three.Vector3(),
          forward: new Three.Vector3(0.0, 0.0, -1.0),
          perspective: 0,
          far: 1.0,
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

      entry.receiver = createReceiverUniforms(entry);
      this.entries.set(light, entry);
    }

    return entry;
  }

  // NOTE A new map for a new size or a spectral change: a new texture, texture node and shadow node
  // (shadow nodes keep texture bindings).
  // NOTE The old map stays until dispose(), so receivers that still use it keep a valid texture.
  resizeMap(renderer, entry, size, spectral) {
    this.retired.push(entry.target);

    if (entry.spectralTarget) {
      this.retired.push(entry.spectralTarget);
    }

    entry.target = initTarget(renderer, createTarget(size, entry.light), entry.isPoint);
    entry.size = size;
    entry.map = entry.isPoint ? cubeTexture(entry.target.texture) : texture(entry.target.texture);
    entry.spectral = spectral;
    entry.spectralTarget = spectral ? initTarget(renderer, createTarget(size, entry.light), entry.isPoint) : null;
    entry.spectralMap = null;

    if (entry.spectralTarget) {
      entry.spectralMap = entry.isPoint
        ? cubeTexture(entry.spectralTarget.texture)
        : texture(entry.spectralTarget.texture);
    }

    entry.item.signature.length = 0;
    entry.cascades?.forEach((cascade) => (cascade.signature.length = 0));
    entry.drawn.cascadeCount = 0;

    if (entry.cubeCamera) {
      entry.cubeCamera.renderTarget = entry.target;
    }

    const oldShadowNode = resetLightShadow(entry.light);

    if (oldShadowNode) {
      this.retired.push(oldShadowNode);
    }
  }

  // NOTE Puts the volume filter on each shadow light. Each frame, then new lights and new filters are found.
  update(renderer, scene) {
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
        this.install(renderer, light);
      }
    });
  }

  install(renderer, light) {
    const { shadow } = light;

    if (shadow.filterNode && shadow.filterNode.isFrameVolumeShadowFilter) {
      return;
    }

    const entry = this.getEntry(renderer, light);
    const userFilter = shadow.filterNode || null;

    // NOTE ShadowNode calls the filter when it builds. The base filter is the filter of three.js or of the user.
    // NOTE Point lights give the direction from the light (bd3D), other lights give shadowCoord.
    const filter = (inputs) => {
      const type = renderer.shadowMap.type;
      const baseFilter = userFilter || (entry.isPoint ? getPointShadowFilter(type) : shadowFilters[type]);

      if (!baseFilter) {
        throw new Error('THREE.WebGPURenderer: Shadow map type not supported yet.');
      }

      // NOTE PointShadowNode calls the filter in a TSL function, and its parameter proxy loses the shadow object.
      // NOTE So the base filter gets a plain object with the light shadow.
      const baseInputs = entry.isPoint
        ? { depthTexture: inputs.depthTexture, bd3D: inputs.bd3D, dp: inputs.dp, distance: inputs.distance }
        : {
            depthTexture: inputs.depthTexture,
            shadowCoord: inputs.shadowCoord,
            depthLayer: inputs.depthLayer,
          };

      baseInputs.shadow = shadow;

      const uv = entry.isPoint ? inputs.bd3D : inputs.shadowCoord.xy;

      return baseFilter(baseInputs).mul(new FrameVolumeShadowNode(this, entry, uv));
    };

    filter.isFrameVolumeShadowFilter = true;
    shadow.filterNode = filter;

    // NOTE The map exists when the shadow node was built before this filter
    if (shadow.map) {
      const oldShadowNode = resetLightShadow(light);

      if (oldShadowNode) {
        this.retired.push(oldShadowNode);
      }
    }
  }

  // NOTE Spot lights: the light shadow camera. Point lights: a cube camera at the light. Sets the ray uniforms.
  prepareCamera(entry) {
    const { light, rayUniforms } = entry;
    const shadowCamera = light.shadow.camera;

    if (!entry.isPoint) {
      light.shadow.updateMatrices(light);

      rayUniforms.frameShadowOrigin.value.setFromMatrixPosition(shadowCamera.matrixWorld);
      shadowCamera.getWorldDirection(rayUniforms.frameShadowForward.value);
      rayUniforms.frameShadowPerspective.value = shadowCamera.isPerspectiveCamera ? 1 : 0;
      rayUniforms.frameShadowFar.value = shadowCamera.far;

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

    rayUniforms.frameShadowOrigin.value.copy(cubeCamera.position);
    rayUniforms.frameShadowPerspective.value = 1;
    rayUniforms.frameShadowFar.value = far;

    return cubeCamera.children[0];
  }

  // NOTE Cascade cameras of a directional light, the same method as three.js CSMShadowNode.
  // NOTE Practical split of the view depth. A light-aligned orthographic camera for each slice.
  // NOTE Size from the slice diagonal (same when the camera turns), position snapped to texels (no swimming).
  // NOTE The depth range of each camera covers the slice and the volume box (the last grid cascade).
  // NOTE Cascades end at the far corner of the volume box plus one box diagonal, up to castShadowDistance.
  // NOTE Near the volumes the cascades are small and fine.
  // NOTE The far distance is rounded up to half octaves, so the splits change only at these steps.
  fitCascades(entry, camera, renderer) {
    const { light, cascades, size, rayUniforms } = entry;
    const { settings, gridUniforms } = this.frameRenderer;
    const count = Three.MathUtils.clamp(Math.round(settings.castShadowCascades), 1, frameMaxShadowMapCascades);
    const last = gridUniforms.frameGridCount.value - 1;
    const near = camera.near;

    casterWorldBox.min.copy(gridUniforms.frameGridMin.array[last]);
    casterWorldBox.max.copy(gridUniforms.frameGridMin.array[last]).add(gridUniforms.frameGridSize.array[last]);

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

      const width = Math.max(
        farCorners[0].distanceTo(farCorners[2]),
        farCorners[0].distanceTo(nearCorners[2]),
      );
      const texel = width / size;

      sliceBox.makeEmpty();
      [...nearCorners, ...farCorners].forEach((corner) =>
        sliceBox.expandByPoint(point.copy(corner).applyMatrix4(lightViewInverse)),
      );

      const centerX = Math.floor((sliceBox.min.x + sliceBox.max.x) * 0.5 / texel) * texel;
      const centerY = Math.floor((sliceBox.min.y + sliceBox.max.y) * 0.5 / texel) * texel;
      const front = Math.max(sliceBox.max.z, casterBox.max.z) + cascadeMargin;
      const back = Math.min(sliceBox.min.z, casterBox.min.z) - cascadeMargin;

      cascadeCamera.left = -width * 0.5;
      cascadeCamera.right = width * 0.5;
      cascadeCamera.top = width * 0.5;
      cascadeCamera.bottom = -width * 0.5;
      cascadeCamera.near = 0.0;
      cascadeCamera.far = front - back;
      cascadeCamera.coordinateSystem = renderer.coordinateSystem;
      cascadeCamera.updateProjectionMatrix();

      // NOTE Light view looks along -z, so the camera is at the front (largest z)
      cascadeCamera.position.set(centerX, centerY, front).applyMatrix4(lightView);
      cascadeCamera.quaternion.setFromRotationMatrix(lightView);
      cascadeCamera.updateMatrixWorld();

      cascade.viewProjection.multiplyMatrices(cascadeCamera.projectionMatrix, cascadeCamera.matrixWorldInverse);
      cascade.origin.copy(cascadeCamera.position);
      cascade.far = cascadeCamera.far;
    }

    cascades[0].camera.getWorldDirection(rayUniforms.frameShadowForward.value);
    rayUniforms.frameShadowPerspective.value = 0;

    return count;
  }

  // NOTE Copies ray values to the uniforms of the pass material
  setPassRay(origin, forward, perspective, far) {
    this.rayUniforms.frameShadowOrigin.value.copy(origin);
    this.rayUniforms.frameShadowForward.value.copy(forward);
    this.rayUniforms.frameShadowPerspective.value = perspective;
    this.rayUniforms.frameShadowFar.value = far;
  }

  // NOTE Draws the pass into the map of the entry: one tile of it (viewport), or all cube faces (point lights)
  drawPass(renderer, entry, camera, viewport) {
    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentScissorTest = renderer.getScissorTest();

    renderer.getClearColor(clearColor);
    renderer.autoClear = false;
    renderer.setScissorTest(false);
    this.mesh.layers.mask = camera.layers.mask;

    // NOTE Spectral: the second draw writes the optical depth of each channel into the second map
    const targets = entry.spectralTarget ? [entry.target, entry.spectralTarget] : [entry.target];

    targets.forEach((target, output) => {
      this.material.frameShadowOutput.value = output;

      if (entry.isPoint) {
        entry.cubeCamera.renderTarget = target;
        entry.cubeCamera.update(renderer, this.scene);
      } else {
        target.viewport.copy(viewport);
        renderer.setRenderTarget(target);
        renderer.render(this.scene, camera);
      }
    });

    if (entry.isPoint) {
      entry.cubeCamera.renderTarget = entry.target;
    }

    renderer.setScissorTest(currentScissorTest);
    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  }

  // NOTE Adds the changed map pieces of one light to the work list. A piece: { item, cost, draw }.
  collectWork(entry, camera, renderer, work) {
    const { castVersion } = this.frameRenderer;
    const steps = this.getSteps();
    const { drawn, rayUniforms } = entry;

    if (entry.cascades) {
      const count = this.fitCascades(entry, camera, renderer);
      const forward = rayUniforms.frameShadowForward.value;

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
        this.setPassRay(
          rayUniforms.frameShadowOrigin.value,
          rayUniforms.frameShadowForward.value,
          rayUniforms.frameShadowPerspective.value,
          rayUniforms.frameShadowFar.value,
        );
        this.drawPass(renderer, entry, shadowCamera, tileViewport.set(0, 0, entry.size, entry.size));
        drawn.origin.copy(rayUniforms.frameShadowOrigin.value);
        drawn.forward.copy(rayUniforms.frameShadowForward.value);
        drawn.perspective = rayUniforms.frameShadowPerspective.value;
        drawn.far = rayUniforms.frameShadowFar.value;
      },
    });
  }

  // NOTE Volume shadow maps of all lights, one time in each render, before the first receiver.
  // NOTE Changed pieces are drawn oldest first, up to castShadowUpdatesPerFrame (a tile or spot map costs 1, a cube map 6).
  // NOTE The oldest piece is always drawn. Then a large piece does not wait forever.
  updateMaps(renderer, scene, camera, renderId) {
    if (this.mapsRenderId === renderId && this.mapsCamera === camera) {
      return;
    }

    this.mapsRenderId = renderId;
    this.mapsCamera = camera;
    this.renderCount++;

    const { frameRenderer } = this;
    const ready =
      frameRenderer.settings.castShadows &&
      renderer.isWebGPURenderer &&
      frameRenderer.prepareShadowGrid(renderer, scene, camera, renderId);

    if (!ready) {
      this.entries.forEach((entry) => {
        entry.enabled.value = 0;
        entry.item.signature.length = 0;
        entry.cascades?.forEach((cascade) => (cascade.signature.length = 0));
      });

      return;
    }

    this.material.setSpectral(this.isSpectral());
    this.material.frameShadowDensityMap.value = frameRenderer.shadowDensityTarget.textures[0];
    this.material.frameShadowSteps.value = this.getSteps();

    const work = [];

    this.entries.forEach((entry) => {
      const active = entry.light.castShadow && isVisible(entry.light);

      entry.enabled.value = active ? 1 : 0;

      if (active) {
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

  // NOTE Called by the receivers of a light, one time in each render
  render(renderer, scene, camera, renderId, entry) {
    if (entry.renderId === renderId) {
      return;
    }

    entry.renderId = renderId;
    this.updateMaps(renderer, scene, camera, renderId);
  }

  dispose() {
    this.entries.forEach((entry) => {
      entry.target.dispose();
      entry.spectralTarget?.dispose();
    });
    this.entries.clear();

    this.retired.forEach((resource) => resource.dispose());
    this.retired = [];

    this.material.dispose();
  }
}

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
import { FrameVolumeShadowMaterial, createShadowRayUniforms, frameShadowDepth } from './FrameVolumeShadowMaterial.js';
import { frameMaxShadowMapCascades } from '../core/frameLimits.js';
import { FrameVolumeShadowsBase, fullscreenGeometry, targetOptions, initTarget } from '../core/FrameVolumeShadows.js';

// NOTE The default filters of three.js ShadowNode, in shadow map type order. PCFSoftShadowMap has no filter.
const shadowFilters = [BasicShadowFilter, PCFShadowFilter, null, VSMShadowFilter];

// NOTE The default filter of three.js PointShadowNode
const getPointShadowFilter = (type) =>
  type === Three.BasicShadowMap ? BasicPointShadowFilter : PointShadowFilter;

// NOTE Optical depth below this value casts no shadow
const minOpticalDepth = 1e-4;

const clearColor = new Three.Color();

// NOTE Directional lights: an atlas with one tile for each cascade, in a row
const createTarget = (size, light) => {
  if (light.isPointLight) {
    return new Three.CubeRenderTarget(size, targetOptions);
  }

  const tiles = light.isDirectionalLight ? frameMaxShadowMapCascades : 1;

  return new Three.RenderTarget(size * tiles, size, targetOptions);
};

// NOTE three.js makes the shadow node of a light one time. Then a new filterNode has no effect.
// NOTE disposeShadow of the light node makes the receivers build a new shadow node.
// NOTE Uses three.js internals: setupLightsNode gives the light node that all materials share.
// NOTE Returns the old shadow node, or null when there is none. Receivers can use it until the end of this render.
// NOTE Returns false when the reset is not possible. Then receivers keep the old shadow node and its maps.
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

    return false;
  }

  if (!lightNode || !lightNode.disposeShadow) {
    return false;
  }

  if (!lightNode.shadowNode) {
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
  const { drawn, cascades, isPoint } = entry;

  return {
    enabled: renderUniform(0, 'int', () => entry.enabled.value),
    viewProjection: cascades || isPoint ? null : renderUniform(new Three.Matrix4(), 'mat4', () => drawn.viewProjection),
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
// NOTE The map coordinate comes from the drawn state, not from the three.js shadow matrix. Directional lights pick a cascade.
// NOTE updateBefore renders the shadow map before the first receiver of each render.
class FrameVolumeShadowNode extends Three.Node {
  static get type() {
    return 'FrameVolumeShadowNode';
  }

  constructor(shadows, entry) {
    super('float');

    this.shadows = shadows;
    this.entry = entry;
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
    let { rayUniforms } = receiver;
    let inside = receiver.enabled.equal(1);
    let uv;

    if (receiver.cascades) {
      const lookup = getCascadeLookup({ ...receiver, size: entry.size });

      uv = lookup.uv;
      rayUniforms = lookup.rayUniforms;
      inside = inside.and(lookup.inside);
    } else if (isPoint) {
      // NOTE Cube map direction from the light position of the draw
      uv = positionWorld.sub(rayUniforms.frameShadowOrigin);
    } else {
      // NOTE Spot map uv, with the y flip of three.js ShadowNode
      const clip = receiver.viewProjection.mul(vec4(positionWorld, 1.0));
      const ndc = clip.xy.div(clip.w);

      uv = vec2(ndc.x.mul(0.5).add(0.5), float(0.5).sub(ndc.y.mul(0.5)));
      inside = inside
        .and(clip.w.greaterThan(0.0))
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

// NOTE Shadows of FrameVolume objects on meshes (frameRenderer.settings.castShadows).
// NOTE Each shadow light gets a Beer shadow map, made from the world shadow grid of the frame renderer.
// NOTE Directional lights: cascades of the view. Spot lights: the light shadow camera. Point lights: a cube map.
// NOTE The light filterNode multiplies the three.js shadow with the volume transmittance.
// NOTE A map piece (cascade tile, spot map, cube map) is made again only when its camera or the grid changes.
// NOTE At most castShadowUpdatesPerFrame pieces in a render, the oldest first. Then the cost of a frame has a limit.
// NOTE Shared CPU code is in core/FrameVolumeShadows.js.
export class FrameVolumeShadows extends FrameVolumeShadowsBase {
  rayUniforms = createShadowRayUniforms();
  // NOTE Replaced and freed maps and shadow nodes. update() runs mid-render, so the next update() disposes them.
  // NOTE Receivers build again before their next draw, because the light shadow was reset.
  retired = [];
  // NOTE Maps of lights that the reset did not work for. Receivers keep them, so only dispose() disposes them.
  kept = [];
  mapsRenderId = -1;
  mapsCamera = null;

  constructor(frameRenderer) {
    super(frameRenderer);

    this.material = new FrameVolumeShadowMaterial(frameRenderer, this.rayUniforms);
    this.mesh = new Three.Mesh(fullscreenGeometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.matrixWorldAutoUpdate = false;
    this.scene.add(this.mesh);
  }

  getEntry(renderer, light) {
    let entry = this.entries.get(light);

    if (!entry) {
      const isPoint = light.isPointLight === true;
      const size = this.getMapSize();
      const spectral = this.isSpectral();
      const target = initTarget(renderer, createTarget(size, light), isPoint);
      const spectralTarget = spectral ? initTarget(renderer, createTarget(size, light), isPoint) : null;

      entry = this.createEntry(light, size, spectral, target, spectralTarget);
      // NOTE frameRenderer.settings.spectral: a second map with the optical depth of each channel
      entry.spectralMap = spectralTarget
        ? isPoint
          ? cubeTexture(spectralTarget.texture)
          : texture(spectralTarget.texture)
        : null;
      entry.renderId = -1;
      entry.map = isPoint ? cubeTexture(target.texture) : texture(target.texture);
      entry.enabled = uniform(0, 'int');
      // NOTE Current camera values of the pass
      entry.rayUniforms = createShadowRayUniforms();
      entry.receiver = createReceiverUniforms(entry);
      this.entries.set(light, entry);
    }

    return entry;
  }

  // NOTE A new map for a new size or a spectral change: a new texture, texture node and shadow node
  // (shadow nodes keep texture bindings).
  resizeMap(renderer, entry, size, spectral) {
    const oldTargets = entry.spectralTarget ? [entry.target, entry.spectralTarget] : [entry.target];

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

    this.resetSignatures(entry);
    entry.drawn.cascadeCount = 0;

    if (entry.cubeCamera) {
      entry.cubeCamera.renderTarget = entry.target;
    }

    this.retire(resetLightShadow(entry.light), oldTargets);
  }

  // NOTE Old maps are disposed in the next update(). When the reset did not work, receivers keep them.
  retire(oldShadowNode, targets) {
    if (oldShadowNode === false) {
      this.kept.push(...targets);

      return;
    }

    this.retired.push(...targets);

    if (oldShadowNode) {
      this.retired.push(oldShadowNode);
    }
  }

  // NOTE Frees the maps of a light and puts back its own filter. Receivers build again without the volume shadow.
  freeEntry(entry) {
    const { light } = entry;
    const targets = entry.spectralTarget ? [entry.target, entry.spectralTarget] : [entry.target];

    // NOTE Receivers that still have the volume shadow node until they build again read no volume shadow
    entry.enabled.value = 0;

    if (light.shadow.filterNode?.isFrameVolumeShadowFilter) {
      light.shadow.filterNode = entry.userFilter;
    }

    this.retire(resetLightShadow(light), targets);
    this.entries.delete(light);
  }

  disposeRetired() {
    for (let i = 0; i < this.retired.length; i++) {
      this.retired[i].dispose();
    }

    this.retired.length = 0;
  }

  install(renderer, light) {
    const { shadow } = light;

    if (shadow.filterNode && shadow.filterNode.isFrameVolumeShadowFilter) {
      return;
    }

    const entry = this.getEntry(renderer, light);
    const userFilter = shadow.filterNode || null;

    entry.userFilter = userFilter;

    // NOTE ShadowNode calls the filter when it builds. The base filter is the filter of three.js or of the user.
    // NOTE Point lights give the direction from the light (bd3D), other lights give shadowCoord.
    // NOTE The volume shadow node does not use them. It finds its map coordinate from the drawn state.
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

      return baseFilter(baseInputs).mul(new FrameVolumeShadowNode(this, entry));
    };

    filter.isFrameVolumeShadowFilter = true;
    shadow.filterNode = filter;

    // NOTE The map exists when the shadow node was built before this filter
    if (shadow.map) {
      this.retire(resetLightShadow(light), []);
    }
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
    const outputs = entry.spectralTarget ? 2 : 1;

    for (let output = 0; output < outputs; output++) {
      const target = output === 0 ? entry.target : entry.spectralTarget;

      this.material.frameShadowOutput.value = output;

      if (entry.isPoint) {
        entry.cubeCamera.renderTarget = target;
        entry.cubeCamera.update(renderer, this.scene);
      } else {
        target.viewport.copy(viewport);
        renderer.setRenderTarget(target);
        renderer.render(this.scene, camera);
      }
    }

    if (entry.isPoint) {
      entry.cubeCamera.renderTarget = entry.target;
    }

    renderer.setScissorTest(currentScissorTest);
    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  }

  // NOTE Volume shadow maps of all lights, one time in each render, before the first receiver.
  // NOTE core/FrameVolumeShadows.js drawMaps draws them.
  updateMaps(renderer, scene, camera, renderId) {
    if (this.mapsRenderId === renderId && this.mapsCamera === camera) {
      return;
    }

    this.mapsRenderId = renderId;
    this.mapsCamera = camera;

    const { frameRenderer } = this;

    this.drawMaps(
      renderer,
      scene,
      camera,
      frameRenderer.settings.castShadows &&
        renderer.isWebGPURenderer &&
        frameRenderer.prepareShadowGrid(renderer, scene, camera, renderId),
    );
  }

  // NOTE Called by the receivers of a light, one time in each render
  render(renderer, scene, camera, renderId, entry) {
    if (entry.renderId === renderId) {
      return;
    }

    entry.renderId = renderId;

    // NOTE The same as withoutMRT, with no closure in each render
    const mrt = renderer.getMRT();

    if (mrt !== null) {
      renderer.setMRT(null);
    }

    this.updateMaps(renderer, scene, camera, renderId);

    if (mrt !== null) {
      renderer.setMRT(mrt);
    }
  }

  // NOTE Puts back the filter of each light. Then a new FrameVolumeShadows installs again.
  dispose() {
    this.entries.forEach((entry) => this.freeEntry(entry));
    this.disposeRetired();

    this.kept.forEach((target) => target.dispose());
    this.kept.length = 0;

    this.material.dispose();
  }
}

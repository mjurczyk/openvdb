import * as Three from 'three';
import { frameMaxShadowMapCascades, frameMaxShadowSteps } from './frameLimits.js';

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

// NOTE Values for change checks: size, castVersion, steps and two camera matrices. One array, reused for each check.
const maxSignatureLength = 3 + 16 + 16;
const signature = new Float64Array(maxSignatureLength);
let signatureLength = 0;

// NOTE Map pieces in the work list of drawMaps
const pieceLayout = 0;
const pieceCascade = 1;
const pieceMap = 2;

// NOTE Far distance of each cascade (getCascadeBreaks). One array, reused.
const cascadeBreaks = new Array(frameMaxShadowMapCascades).fill(0.0);

// NOTE Corners of the view in clip x and y. Corners 0 and 2 are diagonal.
const cornerX = [-1, 1, 1, -1];
const cornerY = [-1, -1, 1, 1];

// NOTE Fullscreen triangle of the shadow pass. Positions are clip coordinates.
export const fullscreenGeometry = new Three.BufferGeometry().setAttribute(
  'position',
  new Three.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
);

export const targetOptions = {
  type: Three.HalfFloatType,
  format: Three.RGBAFormat,
  minFilter: Three.LinearFilter,
  magFilter: Three.LinearFilter,
  generateMipmaps: false,
  depthBuffer: false,
};

// NOTE Clears a new map one time. Empty maps cast no shadow.
// NOTE WebGPU: then three.js makes the GPU texture as a render target texture now.
// NOTE Else the first render makes a new GPU texture, and receivers that sampled the map before keep the destroyed one.
export const initTarget = (renderer, target, cube) => {
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

// NOTE An object and all its parents are visible, and its root is the rendered scene.
// NOTE A removed light, or a light of another scene, takes no part of the update budget.
const isVisible = (object, scene) => {
  let root = object;

  for (let current = object; current; current = current.parent) {
    if (!current.visible) {
      return false;
    }

    root = current;
  }

  return root === scene;
};

// NOTE The object is in a scene. A removed light is not.
const isInScene = (object) => {
  let root = object;

  while (root.parent) {
    root = root.parent;
  }

  return root.isScene === true;
};

// NOTE Signature of an item: the values of its last change check. Length 0 makes the next check a change.
const createItem = () => ({ signature: new Float64Array(maxSignatureLength), signatureLength: 0, lastDraw: -1 });

const addSignatureValues = (values) => {
  for (let i = 0; i < values.length; i++) {
    signature[signatureLength++] = values[i];
  }
};

// NOTE Signature of a map camera: the map size, the grid version, the steps and the camera matrices
const setCameraSignature = (size, castVersion, steps, matrixWorld, projectionMatrix) => {
  signature[0] = size;
  signature[1] = castVersion;
  signature[2] = steps;
  signatureLength = 3;
  addSignatureValues(matrixWorld.elements);
  addSignatureValues(projectionMatrix.elements);
};

// NOTE Signature of the cascade split layout: the map size, the cascade count and the cascade far distances
const setLayoutSignature = (size, count, breaks) => {
  signature[0] = size;
  signature[1] = count;
  signature[2] = breaks.x;
  signature[3] = breaks.y;
  signature[4] = breaks.z;
  signature[5] = breaks.w;
  signatureLength = 6;
};

// NOTE Compares the signature with the one of the item. Stores it when it is different.
const changed = (item) => {
  let same = signatureLength === item.signatureLength;

  for (let i = 0; same && i < signatureLength; i++) {
    same = signature[i] === item.signature[i];
  }

  if (!same) {
    for (let i = 0; i < signatureLength; i++) {
      item.signature[i] = signature[i];
    }

    item.signatureLength = signatureLength;
  }

  return !same;
};

// NOTE Insertion sort of the first count pieces, oldest draw first. Stable, the same order as Array.sort.
const sortWork = (work, count) => {
  for (let i = 1; i < count; i++) {
    const piece = work[i];
    let j = i - 1;

    while (j >= 0 && work[j].item.lastDraw > piece.item.lastDraw) {
      work[j + 1] = work[j];
      j--;
    }

    work[j + 1] = piece;
  }
};

// NOTE Cascade split distances, the practical split of three.js CSMShadowNode (lambda 0.5).
// Returns the far distance of each cascade, in the shared cascadeBreaks array.
const getCascadeBreaks = (count, near, far) => {
  for (let i = 1; i <= count; i++) {
    const uniformSplit = near + ((far - near) * i) / count;
    const logSplit = near * Math.pow(far / near, i / count);

    cascadeBreaks[i - 1] = i === count ? far : Three.MathUtils.lerp(uniformSplit, logSplit, 0.5);
  }

  return cascadeBreaks;
};

// NOTE A point on the corner ray, then moved to the depth (perspective) or set to it (orthographic). In world space.
const setSliceCorner = (target, camera, x, y, depth) => {
  target.set(x, y, 0.5).applyMatrix4(camera.projectionMatrixInverse);

  if (camera.isPerspectiveCamera) {
    target.multiplyScalar(depth / -target.z);
  } else {
    target.z = -depth;
  }

  target.applyMatrix4(camera.matrixWorld);
};

// NOTE Corners of the view between two depths, in world space. Corners 0 and 2 are diagonal.
const getSliceCorners = (camera, near, far) => {
  for (let i = 0; i < 4; i++) {
    setSliceCorner(nearCorners[i], camera, cornerX[i], cornerY[i], near);
    setSliceCorner(farCorners[i], camera, cornerX[i], cornerY[i], far);
  }
};

// NOTE CPU side of the volume shadows on meshes: map sizes, cascade fit, change checks and the update budget.
// NOTE The FrameVolumeShadows of each backend makes the maps, draws the pass and connects the receivers.
// NOTE Backend hooks: install(renderer, light), freeEntry(entry), resizeMap(renderer, entry, size, spectral),
// disposeRetired(), setPassRay(origin, forward, perspective, far), drawPass(renderer, entry, camera, viewport).
// NOTE Each entry has enabled.value (0 or 1) and rayUniforms (frameShadowOrigin, Forward, Perspective, Far .value).
export class FrameVolumeShadowsBase {
  entries = new Map();
  scene = new Three.Scene();
  renderCount = 0;
  // NOTE Changed map pieces of drawMaps. The records are reused between renders.
  work = [];
  workCount = 0;
  // NOTE Values of the current update() or drawMaps() call, for the Map.forEach callbacks
  state = { renderer: null, scene: null, camera: null, size: 0, spectral: false };

  constructor(frameRenderer) {
    this.frameRenderer = frameRenderer;
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

  // NOTE Entry fields of both backends. The backend adds enabled, rayUniforms and its receiver fields.
  createEntry(light, size, spectral, target, spectralTarget) {
    const isPoint = light.isPointLight === true;

    return {
      light,
      isPoint,
      target,
      size,
      spectral,
      spectralTarget,
      cubeCamera: isPoint ? new Three.CubeCamera(0.5, 500.0, target) : null,
      // NOTE drawn: the camera values of the last draw, for the receivers
      drawn: {
        origin: new Three.Vector3(),
        forward: new Three.Vector3(0.0, 0.0, -1.0),
        perspective: 0,
        far: 1.0,
        viewProjection: new Three.Matrix4(),
        cascadeCount: 0,
        cascadeBreaks: new Three.Vector4(),
      },
      // NOTE Spot map or cube map (all faces in one draw), or the split layout of the cascades
      item: createItem(),
      cascadeCount: 0,
      cascadeBreaks: new Three.Vector4(),
      cascades: light.isDirectionalLight
        ? Array.from({ length: frameMaxShadowMapCascades }, () => ({
            ...createItem(),
            camera: new Three.OrthographicCamera(),
            viewProjection: new Three.Matrix4(),
            origin: new Three.Vector3(),
            far: 1.0,
            drawn: { viewProjection: new Three.Matrix4(), origin: new Three.Vector3(), far: 1.0 },
          }))
        : null,
    };
  }

  // NOTE The next change check of each piece of the entry is a change
  resetSignatures(entry) {
    entry.item.signatureLength = 0;

    if (entry.cascades) {
      for (let i = 0; i < entry.cascades.length; i++) {
        entry.cascades[i].signatureLength = 0;
      }
    }
  }

  // NOTE Map.forEach callback of update(): frees or resizes the map of the entry
  checkEntry(entry) {
    const { state } = this;

    if (!isShadowLight(entry.light) || !isInScene(entry.light)) {
      this.freeEntry(entry);
    } else if (entry.size !== state.size || entry.spectral !== state.spectral) {
      this.resizeMap(state.renderer, entry, state.size, state.spectral);
    }
  }

  // NOTE Called by the frame renderer one time in each frame: finds new shadow lights and new map sizes.
  // NOTE lights: the visible lights with castShadow, from the volume collector of this render (no extra scene walk).
  // NOTE Frees the entries of lights with no shadow or not in a scene, and all entries when castShadows is off.
  update(renderer, lights) {
    this.disposeRetired();

    if (!this.frameRenderer.settings.castShadows) {
      this.entries.forEach(this.freeEntry, this);

      return;
    }

    const { state } = this;

    state.renderer = renderer;
    state.size = this.getMapSize();
    state.spectral = this.isSpectral();
    this.entries.forEach(this.checkEntry, this);
    state.renderer = null;

    for (let i = 0; i < lights.length; i++) {
      if (isShadowLight(lights[i])) {
        this.install(renderer, lights[i]);
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

    for (let i = 0; i < cubeCamera.children.length; i++) {
      const camera = cubeCamera.children[i];

      if (camera.near !== near || camera.far !== far) {
        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();
      }
    }

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
    const gridMin = this.frameRenderer.getUniformArray(gridUniforms.frameGridMin);
    const gridSize = this.frameRenderer.getUniformArray(gridUniforms.frameGridSize);

    casterWorldBox.min.copy(gridMin[last]);
    casterWorldBox.max.copy(gridMin[last]).add(gridSize[last]);

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
    entry.cascadeBreaks.set(
      breaks[0],
      breaks[Math.min(1, count - 1)],
      breaks[Math.min(2, count - 1)],
      breaks[Math.min(3, count - 1)],
    );

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

      for (let c = 0; c < 4; c++) {
        sliceBox.expandByPoint(point.copy(nearCorners[c]).applyMatrix4(lightViewInverse));
        sliceBox.expandByPoint(point.copy(farCorners[c]).applyMatrix4(lightViewInverse));
      }

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

  // NOTE Adds a changed map piece to the work list. The records are reused.
  addPiece(entry, item, cost, kind, index, camera) {
    if (this.workCount === this.work.length) {
      this.work.push({ entry: null, item: null, cost: 0, kind: pieceMap, index: 0, camera: null });
    }

    const piece = this.work[this.workCount++];

    piece.entry = entry;
    piece.item = item;
    piece.cost = cost;
    piece.kind = kind;
    piece.index = index;
    piece.camera = camera;
  }

  // NOTE Change check of the camera of cascade i
  cascadeChanged(entry, i, castVersion, steps) {
    const cascade = entry.cascades[i];

    setCameraSignature(entry.size, castVersion, steps, cascade.camera.matrixWorld, cascade.camera.projectionMatrix);

    return changed(cascade);
  }

  // NOTE Adds the changed map pieces of one light to the work list
  collectWork(entry, camera, renderer) {
    const { castVersion } = this.frameRenderer;
    const steps = this.getSteps();

    if (entry.cascades) {
      const count = this.fitCascades(entry, camera, renderer);

      // NOTE A new split layout: one piece draws all cascades, then the receivers switch to the layout.
      // Receivers never mix tiles of two layouts.
      setLayoutSignature(entry.size, count, entry.cascadeBreaks);

      if (changed(entry.item)) {
        for (let i = 0; i < count; i++) {
          this.cascadeChanged(entry, i, castVersion, steps);
        }

        this.addPiece(entry, entry.item, count, pieceLayout, 0, null);

        return;
      }

      for (let i = 0; i < count; i++) {
        if (this.cascadeChanged(entry, i, castVersion, steps)) {
          this.addPiece(entry, entry.cascades[i], 1, pieceCascade, i, null);
        }
      }

      return;
    }

    const shadowCamera = this.prepareCamera(entry);
    const worldCamera = entry.isPoint ? entry.cubeCamera : shadowCamera;

    setCameraSignature(entry.size, castVersion, steps, worldCamera.matrixWorld, shadowCamera.projectionMatrix);

    if (changed(entry.item)) {
      // NOTE All six cube faces in one draw, then the faces always match
      this.addPiece(entry, entry.item, entry.isPoint ? 6 : 1, pieceMap, 0, shadowCamera);
    }
  }

  drawCascade(renderer, entry, i) {
    const cascade = entry.cascades[i];
    const forward = entry.rayUniforms.frameShadowForward.value;

    this.setPassRay(cascade.origin, forward, 0, cascade.far);
    this.drawPass(renderer, entry, cascade.camera, tileViewport.set(i * entry.size, 0, entry.size, entry.size));
    cascade.drawn.viewProjection.copy(cascade.viewProjection);
    cascade.drawn.origin.copy(cascade.origin);
    cascade.drawn.far = cascade.far;
    cascade.lastDraw = this.renderCount;
    entry.drawn.forward.copy(forward);
  }

  // NOTE A new split layout: all cascades, then the receivers get the layout
  drawLayout(renderer, entry) {
    for (let i = 0; i < entry.cascadeCount; i++) {
      this.drawCascade(renderer, entry, i);
    }

    entry.drawn.cascadeCount = entry.cascadeCount;
    entry.drawn.cascadeBreaks.copy(entry.cascadeBreaks);
  }

  // NOTE Spot map or cube map
  drawMap(renderer, entry, shadowCamera) {
    const { drawn, rayUniforms } = entry;

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
    drawn.viewProjection.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse);
  }

  drawPiece(renderer, piece) {
    if (piece.kind === pieceLayout) {
      this.drawLayout(renderer, piece.entry);
    } else if (piece.kind === pieceCascade) {
      this.drawCascade(renderer, piece.entry, piece.index);
    } else {
      this.drawMap(renderer, piece.entry, piece.camera);
    }
  }

  // NOTE Map.forEach callback of drawMaps when the grid is not ready
  disableEntry(entry) {
    entry.enabled.value = 0;
    this.resetSignatures(entry);
  }

  // NOTE Map.forEach callback of drawMaps: turns the entry on or off and adds its changed pieces
  collectEntry(entry) {
    const { state } = this;
    const active = entry.light.castShadow && isVisible(entry.light, state.scene);

    entry.enabled.value = active ? 1 : 0;

    if (active) {
      this.collectWork(entry, state.camera, state.renderer);
    }
  }

  // NOTE Volume shadow maps of all lights, before the lit meshes. ready: the world shadow grid of this render is ready.
  // NOTE Changed pieces are drawn oldest first, up to castShadowUpdatesPerFrame (a tile or spot map costs 1, a cube map 6).
  // NOTE The oldest piece is always drawn. Then a large piece does not wait forever.
  drawMaps(renderer, scene, camera, ready) {
    this.renderCount++;

    const { frameRenderer, state, work } = this;

    if (!ready) {
      this.entries.forEach(this.disableEntry, this);

      return;
    }

    const uniforms = frameRenderer.getUniforms(this.material);

    this.material.setSpectral(this.isSpectral());
    uniforms.frameShadowDensityMap.value = frameRenderer.shadowDensityTarget.textures[0];
    uniforms.frameShadowSteps.value = this.getSteps();

    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;
    this.workCount = 0;
    this.entries.forEach(this.collectEntry, this);
    state.renderer = null;
    state.scene = null;
    state.camera = null;

    sortWork(work, this.workCount);

    let budget = Math.max(1, Math.round(frameRenderer.settings.castShadowUpdatesPerFrame));

    for (let i = 0; i < this.workCount; i++) {
      const piece = work[i];

      if (i > 0 && piece.cost > budget) {
        // NOTE Not drawn: the next check sees the change again
        piece.item.signatureLength = 0;
      } else {
        this.drawPiece(renderer, piece);
        piece.item.lastDraw = this.renderCount;
        budget -= piece.cost;
      }

      // NOTE The reused records keep no freed entries
      piece.entry = null;
      piece.item = null;
      piece.camera = null;
    }

    this.workCount = 0;
  }
}

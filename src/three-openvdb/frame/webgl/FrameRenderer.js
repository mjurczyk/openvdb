import * as Three from 'three';
import { FrameInjectMaterial } from './FrameInjectMaterial.js';
import { FrameIntegrateMaterial, FrameIntegrateTransmittanceMaterial } from './FrameIntegrateMaterial.js';
import { FrameDensityMaterial, frameDensityEnvironment } from './FrameDensityMaterial.js';
import { FrameShadowDensityMaterial } from './FrameShadowDensityMaterial.js';
import { FrameTransmittanceMaterial } from './FrameTransmittanceMaterial.js';
import { FrameGridMipMaterial } from './FrameGridMipMaterial.js';
import { FrameLightingMaterial } from './FrameLightingMaterial.js';
import { FrameTemporalMaterial } from './FrameTemporalMaterial.js';
import { FrameVolumeShadows } from './FrameVolumeShadows.js';
import { FrameEnvironmentMapMaterial } from './FrameEnvironmentMapMaterial.js';
import { FrameEnvironmentGridMaterial } from './FrameEnvironmentGridMaterial.js';
import { setMipmapContext, updateGaussianMipmaps } from './frameMipmaps.js';
import { setVolumeUniforms, createEnvironmentUniforms, createEnvironmentGridUniforms } from './frameShaderChunks.js';
import {
  getFramePhase,
  getFramePhaseSpectrum,
  getFrameMultipleScattering,
  getFrameScatteringOctaves,
  getFrameTwoSidedDiffusion,
  getFrameMultiScaleLevels,
  isFrameDiffusion,
} from '../core/framePhase.js';
import { getAtlasLayout } from '../core/frameLayout.js';
import { frameNeuralLevels } from '../core/frameNeuralIndirect.js';
import { FrameVolumeCollector, getFroxelArea, getFrameFadeRadius } from '../core/frameView.js';
import { sameValues } from '../core/frameGrid.js';
import { getFrameSpectralGroups } from '../core/frameSpectrum.js';
import { frameEnvironmentMapWidth, frameEnvironmentMapHeight } from '../core/frameEnvironment.js';
import { frameMaxShadowCascades, frameShadowLightSlots } from '../core/frameLimits.js';
import {
  FrameRendererBase,
  tileQuadPosition,
  createTileGeometry,
  createScene,
  getClipRect,
} from '../core/FrameRenderer.js';

const textureKeys = ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'];

const viewport = new Three.Vector4();
const clearColor = new Three.Color();
const lightPosition = new Three.Vector3();
const lightTarget = new Three.Vector3();

const lightProxyFactories = {
  AmbientLight: () => new Three.AmbientLight(),
  HemisphereLight: () => new Three.HemisphereLight(),
  DirectionalLight: () => new Three.DirectionalLight(),
  PointLight: () => new Three.PointLight(),
  SpotLight: () => new Three.SpotLight(),
  LightProbe: () => new Three.LightProbe(),
};

export const createFullscreenGeometry = () => {
  const geometry = new Three.BufferGeometry();

  geometry.setAttribute(
    'position',
    new Three.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
  );

  return geometry;
};

// NOTE No material of the object writes depth. The same result as Array.every, with no array for one material.
const writesNoDepth = (material) => {
  if (!Array.isArray(material)) {
    return material.depthWrite === false;
  }

  for (let i = 0; i < material.length; i++) {
    if (material[i].depthWrite !== false) {
      return false;
    }
  }

  return true;
};

// NOTE Value of a map that a pass does not read. three.js binds its empty texture for null, the start value.
const emptyMap = null;

// NOTE A quad. The integrate materials put it on the screen rectangle of the froxel area.
const createQuadGeometry = () => {
  const geometry = new Three.BufferGeometry();
  geometry.setAttribute('position', tileQuadPosition);

  return geometry;
};

// NOTE WebGLRenderer backend. Shader materials with uniform objects. Shared CPU code is in core/FrameRenderer.js.
export class FrameRenderer extends FrameRendererBase {
  renderTargetClass = Three.WebGLRenderTarget;

  froxelUniforms = {
    froxelGrid: { value: new Three.Vector3(1.0, 1.0, 1.0) },
    froxelColumns: { value: 1.0 },
    froxelRange: { value: new Three.Vector2(0.1, 1.0) },
    froxelProjectionInverse: { value: new Three.Matrix4() },
    froxelSubSteps: { value: 6 },
    frameFadeRadius: { value: 0.0 },
  };

  froxelTileUniforms = {
    frameTileSize: { value: new Three.Vector2(1.0, 1.0) },
    frameTileColumns: { value: 1.0 },
    frameTargetSize: { value: new Three.Vector2(1.0, 1.0) },
  };

  // NOTE Froxel area of the volumes in this frame (core/frameView.js). The lighting and temporal passes draw only it.
  froxelAreaUniforms = {
    frameRect: { value: new Three.Vector4() },
    frameSliceStart: { value: 0.0 },
  };

  gridUniforms = {
    frameGridMin: {
      value: Array.from({ length: frameMaxShadowCascades }, () => new Three.Vector3()),
    },
    frameGridSize: {
      value: Array.from({ length: frameMaxShadowCascades }, () => new Three.Vector3()),
    },
    frameGridVoxel: {
      value: Array.from({ length: frameMaxShadowCascades }, () => new Three.Vector3()),
    },
    frameGridCount: { value: 0 },
    frameGridResolution: { value: 1.0 },
    frameGridColumns: { value: 1.0 },
    frameGridAtlasSize: { value: new Three.Vector2(1.0, 1.0) },
  };

  gridTileUniforms = {
    frameTileSize: { value: new Three.Vector2(1.0, 1.0) },
    frameTileColumns: { value: 1.0 },
    frameTargetSize: { value: new Three.Vector2(1.0, 1.0) },
  };

  // NOTE Shadow grid data for the density pass. Each volume samples its own visible position.
  densityShadowUniforms = {
    frameTransmittanceMap0: { value: null },
    frameTransmittanceMap1: { value: null },
    // NOTE Direct transmittance of the 6 light slots
    frameTransmittanceMap2: { value: null },
    frameTransmittanceMap3: { value: null },
    // NOTE Scene lights with a shadow slot get the phase in the density pass
    frameShadowLights: { value: Array.from({ length: frameShadowLightSlots }, () => new Three.Vector4()) },
    frameShadowSceneLightCount: { value: 0 },
    frameUseShadows: { value: false },
    frameCameraMatrixWorld: { value: new Three.Matrix4() },
    frameSkyDirection: { value: new Three.Vector3(0.0, 1.0, 0.0) },
    // NOTE Environment light of the last cascade voxels (FrameEnvironmentGridMaterial)
    frameEnvironmentGridMap: { value: null },
    // NOTE frameDensityEnvironment values
    frameEnvironmentMode: { value: frameDensityEnvironment.outward },
    // NOTE frameRenderer.settings.spectral: targets 0 and 1 of slot group 0 (sky up and sky down, core/frameSpectrum.js)
    frameSkyTransmittanceMap0: { value: null },
    frameSkyTransmittanceMap1: { value: null },
  };

  // NOTE Environment lights (frameRenderer.settings.environmentLighting)
  environmentUniforms = createEnvironmentUniforms();
  environmentGridUniforms = createEnvironmentGridUniforms();

  injectMaterial = new FrameInjectMaterial({
    ...this.froxelUniforms,
    ...this.froxelTileUniforms,
    ...this.environmentUniforms,
  });
  integrateMaterial = new FrameIntegrateMaterial(this.froxelUniforms);
  // NOTE Spectral: multiplies the scene color by the transmittance of each channel, before the proxy adds the volume color
  integrateTransmittanceMaterial = new FrameIntegrateTransmittanceMaterial(this.integrateMaterial);
  integrateTransmittanceScene = createScene();
  integrateTransmittanceMesh = new Three.Mesh(createQuadGeometry(), this.integrateTransmittanceMaterial);
  lightingMaterial = new FrameLightingMaterial({
    ...this.froxelUniforms,
    ...this.froxelTileUniforms,
    ...this.froxelAreaUniforms,
    ...this.environmentUniforms,
    ...this.gridUniforms,
  });
  transmittanceMaterial = new FrameTransmittanceMaterial({
    ...this.gridUniforms,
  });
  volumeShadows = new FrameVolumeShadows(this);
  depthMaterial = new Three.MeshBasicMaterial({ colorWrite: false, side: Three.DoubleSide });

  // NOTE The light scene holds the light copies. It draws the volume inject pass or the frame lighting pass.
  injectScene = createScene();
  injectMesh = new Three.Mesh(createTileGeometry(), this.injectMaterial);
  lightingMesh = new Three.Mesh(this.areaGeometry, this.lightingMaterial);
  lightProxies = {};

  densityScene = createScene();
  shadowScene = createScene();

  transmittanceScene = createScene();
  transmittanceMesh = new Three.Mesh(createFullscreenGeometry(), this.transmittanceMaterial);

  // NOTE multipleScattering 'neural' and 'multi-scale': mips of the last grid cascade, levels 1 and up (FrameGridMipMaterial)
  gridMipMaterial = new FrameGridMipMaterial();
  gridMipScene = createScene();
  gridMipMesh = new Three.Mesh(createFullscreenGeometry(), this.gridMipMaterial);

  temporalMaterial = new FrameTemporalMaterial({
    ...this.froxelUniforms,
    ...this.froxelTileUniforms,
    ...this.froxelAreaUniforms,
  });
  temporalScene = createScene();
  temporalMesh = new Three.Mesh(this.areaGeometry, this.temporalMaterial);

  environmentMapMaterial = new FrameEnvironmentMapMaterial();
  environmentMapScene = createScene();
  environmentMapMesh = new Three.Mesh(createFullscreenGeometry(), this.environmentMapMaterial);

  // NOTE Environment grid: environment lights with no shadow slot, in the last cascade. Drawn only on a change.
  environmentGridMaterial = new FrameEnvironmentGridMaterial({
    ...this.gridUniforms,
    ...this.environmentUniforms,
    ...this.environmentGridUniforms,
  });
  environmentGridScene = createScene();
  environmentGridMesh = new Three.Mesh(createFullscreenGeometry(), this.environmentGridMaterial);

  depthTarget = null;

  // NOTE Render frame of the world shadow grid (prepareShadowGrid)
  gridFrame = -1;

  // NOTE Results of collectVolumes. They are used again in the next call.
  viewCollector = new FrameVolumeCollector();
  gridCollector = new FrameVolumeCollector();
  // NOTE updateLightProxies state and result. Positions are pooled: length is the used count, entries the vectors.
  lightState = {
    camera: null,
    used: {},
    hasSky: false,
    skyDirection: new Three.Vector3(0.0, 1.0, 0.0),
    directions: { length: 0, entries: [] },
    points: { length: 0, entries: [] },
    spots: { length: 0, entries: [] },
  };
  lightResult = {
    skyDirection: new Three.Vector3(0.0, 1.0, 0.0),
    shadowLights: [],
    pointOffset: 0,
    spotOffset: 0,
    environmentLightCount: 0,
    environmentShadowSlot: 0,
    environmentGridLights: [],
    // NOTE Hemisphere lights and light probes. They read sky up and sky down.
    skyLightCount: 0,
  };
  environmentShadowLight = new Three.Vector4();
  // NOTE Objects that renderDepth hides. The array is reused.
  depthHidden = [];

  constructor() {
    super();

    [
      this.injectMesh,
      this.lightingMesh,
      this.transmittanceMesh,
      this.gridMipMesh,
      this.temporalMesh,
      this.environmentMapMesh,
      this.environmentGridMesh,
      this.integrateTransmittanceMesh,
    ].forEach((mesh) => {
      mesh.frustumCulled = false;
    });

    this.temporalScene.add(this.temporalMesh);
    this.integrateTransmittanceScene.add(this.integrateTransmittanceMesh);

    this.injectScene.add(this.injectMesh, this.lightingMesh);
    this.transmittanceScene.add(this.transmittanceMesh);
    this.gridMipScene.add(this.gridMipMesh);
    this.environmentMapScene.add(this.environmentMapMesh);
    this.environmentGridScene.add(this.environmentGridMesh);
  }

  // NOTE Each FrameVolume proxy calls this. The first proxy in a frame renders the frame.
  // Other proxies draw nothing.
  render(renderer, scene, camera, proxy) {
    if (!renderer.isWebGLRenderer) {
      if (!this.rendererWarned) {
        console.error('FrameVolume: "three-openvdb/webgl" needs WebGLRenderer. Use "three-openvdb" with WebGPURenderer.');
        this.rendererWarned = true;
      }

      proxy.geometry.setDrawRange(0, 0);

      return;
    }

    const frame = renderer.info.render.frame;

    setMipmapContext(renderer.getContext());

    // NOTE Override passes (depth, normals) of other effects must not draw or start the frame
    if (scene.overrideMaterial) {
      proxy.geometry.setDrawRange(0, 0);

      return;
    }

    if (frame === this.cachedFrame && camera === this.cachedCamera) {
      proxy.geometry.setDrawRange(0, 0);

      return;
    }

    const { volumes, casters, lights } = this.collectVolumes(scene, camera);

    // NOTE The collector walk of this render also gives the shadow lights
    this.volumeShadows.update(renderer, lights);

    if (volumes.length > 0) {
      this.renderFrame(renderer, scene, camera, volumes, casters);
    }

    // NOTE Nested renders increase info.render.frame. Keep the new value.
    // Then other proxies in this frame skip.
    this.cachedFrame = renderer.info.render.frame;
    this.cachedCamera = camera;

    proxy.geometry.setDrawRange(0, volumes.length > 0 ? Infinity : 0);
  }

  // NOTE Backend hooks of FrameVolume (core/frameBackend.js)
  createProxyGeometry() {
    return createQuadGeometry();
  }

  // NOTE WebGL generates mipmaps for 3D textures. Far froxels and coarse shadow cascades sample a lower level.
  configureTexture(texture, mipmaps) {
    texture.minFilter = mipmaps ? Three.LinearMipmapLinearFilter : Three.LinearFilter;
    texture.magFilter = Three.LinearFilter;
    texture.generateMipmaps = mipmaps;
  }

  disposeVolume() {}

  // NOTE Backend hooks of FrameRendererBase (core/FrameRenderer.js).
  // NOTE ShaderMaterial uniforms, array uniforms with .value.
  getUniforms(material) {
    return material.uniforms;
  }

  getUniformArray(uniform) {
    return uniform.value;
  }

  getMaxTextureSize(renderer) {
    return renderer.capabilities.maxTextureSize;
  }

  // NOTE A volume and its instances share the textures. The first one with mipmaps adds the levels, and they stay.
  // Volumes without mipmaps read level 0 (frameMipmaps uniform), so the shared textures do not upload again.
  // NOTE mipmapFilter 'gaussian': Gaussian levels replace the GPU levels after the conversion (frameMipmaps.js)
  updateMipmaps = (frameVolume, volume) => {
    if (!frameVolume.mipmaps) {
      return;
    }

    const gaussian = frameVolume.mipmapFilter === 'gaussian' && !(frameVolume.source ?? frameVolume).process;

    for (let i = 0; i < textureKeys.length; i++) {
      const texture = volume[textureKeys[i]];

      if (!texture) {
        continue;
      }

      if (!texture.generateMipmaps) {
        this.configureTexture(texture, true);
        texture.needsUpdate = true;
      }

      updateGaussianMipmaps(texture, gaussian);
    }
  };

  // NOTE Draws the lat-long environment map with the rotation of the scene and intensity 1.0, then reads it.
  renderEnvironmentMap(renderer, scene) {
    if (!this.environmentMapTarget) {
      this.environmentMapTarget = this.createRenderTarget(frameEnvironmentMapWidth, frameEnvironmentMapHeight, {
        type: Three.FloatType,
        minFilter: Three.NearestFilter,
        magFilter: Three.NearestFilter,
      });
    }

    const { environmentMapScene } = this;
    const pixels = new Float32Array(frameEnvironmentMapWidth * frameEnvironmentMapHeight * 4);

    environmentMapScene.environment = scene.environment;
    environmentMapScene.environmentIntensity = 1.0;
    environmentMapScene.environmentRotation.copy(scene.environmentRotation);

    renderer.setRenderTarget(this.environmentMapTarget);
    renderer.render(environmentMapScene, this.environmentMapCamera);

    return renderer
      .readRenderTargetPixelsAsync(
        this.environmentMapTarget,
        0,
        0,
        frameEnvironmentMapWidth,
        frameEnvironmentMapHeight,
        pixels,
      )
      .then(() => pixels);
  }

  // NOTE collector: view volumes of render() or casters of prepareShadowGrid(). Each one keeps its result to its next call.
  collectVolumes(scene, camera, collector = this.viewCollector) {
    const result = collector.collect(scene, camera, this.settings, this.usesShadowGrid(), this.updateMipmaps);

    if (result.volumes.length > 0) {
      this.froxelUniforms.froxelRange.value.set(result.near, result.far);
    }

    return result;
  }

  // NOTE Mips of the last grid cascade for the network (box filter) or multi-scale (binomial filter).
  // Drawn again only when the grid or the filter changes.
  renderGridMips(renderer, camera) {
    const { frameGridResolution, frameGridColumns, frameGridCount } = this.gridUniforms;
    const resolution = frameGridResolution.value;
    const source = this.shadowDensityTarget;
    const binomial = this.isMultiScale();
    const lastSignature = this.gridMipSignature;
    const signature = this.nextGridMipSignature;

    signature.length = 0;
    signature.push(
      this.gridVersion,
      source.texture.id,
      resolution,
      frameGridCount.value,
      frameGridColumns.value,
      binomial ? 1 : 0,
    );

    if (sameValues(signature, lastSignature)) {
      return;
    }

    this.gridMipSignature = signature;
    this.nextGridMipSignature = lastSignature;
    this.gridMipMaterial.setBinomial(binomial);

    const { uniforms } = this.gridMipMaterial;
    const transmittanceUniforms = this.transmittanceMaterial.uniforms;
    // NOTE Source of the next level: the grid atlas first, then the level before
    let previous = null;

    for (let level = 1; level < frameNeuralLevels; level++) {
      const side = Math.max(1, resolution >> level);
      const layout = getAtlasLayout(side, side, side);
      let target = this.gridMipTargets[level - 1];

      if (!target || target.width !== layout.width || target.height !== layout.height) {
        target?.dispose();
        target = this.createRenderTarget(layout.width, layout.height, { format: Three.RGFormat });
        this.gridMipTargets[level - 1] = target;
      }

      if (previous) {
        uniforms.frameMipSource.value = previous.target.texture;
        uniforms.frameMipSourceResolution.value = previous.side;
        uniforms.frameMipSourceColumns.value = previous.layout.columns;
        uniforms.frameMipSourceTile.value = 0;
      } else {
        uniforms.frameMipSource.value = source.texture;
        uniforms.frameMipSourceResolution.value = resolution;
        uniforms.frameMipSourceColumns.value = frameGridColumns.value;
        uniforms.frameMipSourceTile.value = (frameGridCount.value - 1) * resolution;
      }

      uniforms.frameMipResolution.value = side;
      uniforms.frameMipColumns.value = layout.columns;
      renderer.setRenderTarget(target);
      renderer.render(this.gridMipScene, camera);

      transmittanceUniforms[`frameNeuralMipMap${level}`].value = target.texture;
      transmittanceUniforms[`frameNeuralMipLayout${level}`].value.set(layout.columns, layout.width, layout.height);
      previous = { target, side, layout };
    }
  }

  // NOTE WebGL: the integrate pass has the froxel atlas size, and it reads the scene depth from the depth target
  updateTargets(renderer) {
    super.updateTargets(renderer);

    this.integrateMaterial.uniforms.froxelAtlasSize.value.set(this.atlasTarget.width, this.atlasTarget.height);

    renderer.getCurrentViewport(viewport);

    const depthWidth = Math.max(1, viewport.z);
    const depthHeight = Math.max(1, viewport.w);

    if (!this.depthTarget) {
      this.depthTarget = new Three.WebGLRenderTarget(depthWidth, depthHeight, {
        depthBuffer: true,
        depthTexture: new Three.DepthTexture(depthWidth, depthHeight),
      });
    } else if (this.depthTarget.width !== depthWidth || this.depthTarget.height !== depthHeight) {
      this.depthTarget.setSize(depthWidth, depthHeight);
    }

    this.integrateMaterial.uniforms.frameDepthMap.value = this.depthTarget.depthTexture;
  }

  renderFrame(renderer, scene, camera, volumes, casters) {
    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const currentShadowNeedsUpdate = renderer.shadowMap.needsUpdate;

    renderer.getClearColor(clearColor);

    // NOTE null: the environment uses the 'outward' path
    this.environment = this.environmentLights.update(renderer, scene, this.settings);

    this.updateTargets(renderer);
    this.updateFroxelArea(volumes, camera);

    this.froxelUniforms.froxelProjectionInverse.value.copy(camera.projectionMatrixInverse);
    this.froxelUniforms.frameFadeRadius.value = getFrameFadeRadius(this.settings);
    this.integrateMaterial.uniforms.frameCameraNear.value = camera.near;
    this.integrateMaterial.uniforms.frameCameraFar.value = camera.far;

    // NOTE Shadow maps of this frame are ready. Nested renders must not update them again.
    renderer.autoClear = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = false;
    renderer.setClearColor(0x000000, 0.0);

    this.renderDepth(renderer, scene, camera);

    if (this.isFrameLighting()) {
      this.renderFrameLighting(renderer, scene, camera, volumes, casters);
    } else {
      this.renderInject(renderer, scene, camera, volumes);
    }

    if (this.settings.temporal) {
      this.renderTemporal(renderer, camera);
    } else {
      this.historyValid = false;
    }

    this.gridFreshCamera = null;

    // NOTE Spectral: the transmittance pass multiplies the scene color now. The proxy draw then adds the volume color.
    if (this.isSpectral()) {
      this.integrateTransmittanceMesh.layers.mask = camera.layers.mask;

      renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
      renderer.render(this.integrateTransmittanceScene, camera);
    }

    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.shadowMap.needsUpdate = currentShadowNeedsUpdate;
    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  }

  // NOTE Blends this frame into the history. The integrate pass then reads the blended froxels.
  // NOTE Froxel area of the volumes, for the passes over the froxel grid and for the integrate pass
  updateFroxelArea(volumes, camera) {
    const { froxelGrid, froxelRange } = this.froxelUniforms;
    const { x: width, y: height, z: depth } = froxelGrid.value;
    const area = getFroxelArea(volumes, camera, width, height, froxelRange.value, depth, this.froxelArea);
    const { uniforms } = this.integrateMaterial;

    this.froxelAreaUniforms.frameRect.value.copy(area.rect);
    this.froxelAreaUniforms.frameSliceStart.value = area.first;
    this.areaGeometry.instanceCount = area.count;

    // NOTE One more cell on each side: the linear filter of the integrate pass reads one cell away
    const { x0, y0, x1, y1 } = getClipRect(area.rect, width, height, area.count > 0 ? 1 : 0);

    uniforms.frameScreenRect.value.set(x0, y0, x1, y1);
    uniforms.frameSliceRange.value.set(area.first, area.first + area.count);
  }

  renderTemporal(renderer, camera) {
    const uniforms = this.temporalMaterial.uniforms;
    const readTarget = this.historyTargets[this.historyIndex];
    const writeTarget = this.historyTargets[1 - this.historyIndex];

    uniforms.frameCurrentMap.value = this.atlasTarget.textures[0];
    uniforms.frameHistoryMap.value = readTarget.textures[0];
    uniforms.frameCurrentAlphaMap.value = this.atlasTarget.textures.at(-1);
    uniforms.frameHistoryAlphaMap.value = readTarget.textures.at(-1);
    uniforms.frameAtlasSize.value.set(this.atlasTarget.width, this.atlasTarget.height);
    uniforms.frameUseHistory.value = this.historyValid && this.historyCamera === camera;
    uniforms.frameTemporalBlend.value = Math.min(1.0, Math.max(0.01, this.settings.temporalBlend));
    uniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    uniforms.framePreviousViewMatrix.value.copy(this.previousViewMatrix);
    uniforms.framePreviousProjectionMatrix.value.copy(this.previousProjectionMatrix);
    uniforms.framePreviousRange.value.copy(this.previousRange);

    this.temporalMesh.layers.mask = camera.layers.mask;

    // NOTE The pass draws only the froxel area. The clear empties the other froxels.
    renderer.setRenderTarget(writeTarget);
    renderer.clear(true, false, false);
    renderer.render(this.temporalScene, camera);

    this.integrateMaterial.uniforms.froxelAtlas.value = writeTarget.textures[0];
    this.integrateMaterial.uniforms.froxelAlphaAtlas.value = writeTarget.textures.at(-1);

    this.historyIndex = 1 - this.historyIndex;
    this.historyValid = true;
    this.historyCamera = camera;
    this.previousViewMatrix.copy(camera.matrixWorldInverse);
    this.previousProjectionMatrix.copy(camera.projectionMatrix);
    this.previousRange.copy(this.froxelUniforms.froxelRange.value);
  }

  // NOTE Objects that do not write depth (fog, FrameVolume proxies, transparent effects)
  // do not stop the march.
  // NOTE traverseVisible callback of renderDepth
  visitDepthObject = (object) => {
    if (object.material && writesNoDepth(object.material)) {
      this.depthHidden.push(object);
    }
  };

  renderDepth(renderer, scene, camera) {
    const hidden = this.depthHidden;

    hidden.length = 0;
    scene.traverseVisible(this.visitDepthObject);

    for (let i = 0; i < hidden.length; i++) {
      hidden[i].visible = false;
    }

    const background = scene.background;
    const overrideMaterial = scene.overrideMaterial;

    scene.background = null;
    scene.overrideMaterial = this.depthMaterial;

    renderer.setRenderTarget(this.depthTarget);
    renderer.clear(false, true, false);
    renderer.render(scene, camera);

    scene.overrideMaterial = overrideMaterial;
    scene.background = background;

    for (let i = 0; i < hidden.length; i++) {
      hidden[i].visible = true;
    }

    hidden.length = 0;
  }

  prepareLightScene(scene, camera, mesh) {
    const { injectScene } = this;

    injectScene.environment = scene.environment;
    injectScene.environmentIntensity = scene.environmentIntensity;
    injectScene.environmentRotation.copy(scene.environmentRotation);

    this.injectMesh.visible = mesh === this.injectMesh;
    this.lightingMesh.visible = mesh === this.lightingMesh;
    mesh.layers.mask = camera.layers.mask;

    return this.updateLightProxies(scene, camera);
  }

  renderInject(renderer, scene, camera, volumes) {
    const { atlasTarget, injectScene } = this;
    const uniforms = this.injectMaterial.frameUniforms;

    this.prepareLightScene(scene, camera, this.injectMesh);

    renderer.setRenderTarget(atlasTarget);
    renderer.clear(true, false, false);

    for (let i = 0; i < volumes.length; i++) {
      const { frameVolume, volume } = volumes[i];

      // NOTE Draw only the froxel rectangle and the slices of this volume. One instance for each slice.
      if (!this.getFroxelRect(volume, camera, uniforms.frameRect.value)) {
        continue;
      }

      const { first, count } = this.getSliceRange(volume);

      uniforms.frameSliceStart.value = first;
      this.injectMesh.geometry.instanceCount = count;

      setVolumeUniforms(uniforms, frameVolume, volume);
      uniforms.frameLights.value = frameVolume.lights;
      uniforms.frameShadowSteps.value = frameVolume.shadowSteps;
      uniforms.frameMultipleScattering.value = getFrameMultipleScattering(
        this.settings.multipleScattering,
        frameVolume,
      );
      getFrameScatteringOctaves(this.settings, uniforms.frameScatteringOctaves.value);
      uniforms.frameTwoSided.value = getFrameTwoSidedDiffusion(this.settings.multipleScattering);

      renderer.setRenderTarget(atlasTarget);
      renderer.render(injectScene, camera);
    }
  }

  // NOTE Combined lighting: density of all volumes, one shadow grid, one lighting pass.
  // Render calls do not grow with the number of volumes.
  renderFrameLighting(renderer, scene, camera, volumes, casters) {
    const lights = this.prepareLightScene(scene, camera, this.lightingMesh);

    // NOTE Shadow pass. Extinction of all casters in one world grid, then transmittance to each light.
    // It is before the density pass. Then the density pass can sample the shadows of each volume.
    // NOTE Volume shadows on meshes can make the grid before, in the same render
    const useShadows =
      this.gridFreshCamera === camera ? this.gridReady : this.renderShadowDensity(renderer, camera, casters);

    this.gridFreshCamera = null;
    const useEnvironmentGrid = useShadows && lights.environmentGridLights.length > 0;
    const spectral = this.isSpectral();
    const spectralGroups = getFrameSpectralGroups(lights.shadowLights.length);

    if (spectral) {
      this.trimSpectralTransmittanceTargets(useShadows ? spectralGroups : 0);
    }

    if (useShadows) {
      const transmittanceUniforms = this.transmittanceMaterial.uniforms;

      transmittanceUniforms.frameShadowDensityMap.value = this.shadowDensityTarget.textures[0];
      transmittanceUniforms.frameShadowAbsorptionMap.value = this.shadowDensityTarget.textures.at(-1);
      transmittanceUniforms.frameSkyDirection.value.copy(lights.skyDirection);
      // NOTE The 'outward' environment of the density pass also reads sky up and sky down
      transmittanceUniforms.frameSkyMarch.value =
        lights.skyLightCount > 0 ||
        (!useEnvironmentGrid && lights.environmentLightCount === 0 && !!scene.environment)
          ? 1.0
          : 0.0;
      transmittanceUniforms.frameShadowLightCount.value = lights.shadowLights.length;
      transmittanceUniforms.frameMultipleScattering.value = getFrameMultipleScattering(
        this.settings.multipleScattering,
        this.settings,
      );
      getFrameScatteringOctaves(this.settings, transmittanceUniforms.frameScatteringOctaves.value);
      transmittanceUniforms.frameTwoSided.value = getFrameTwoSidedDiffusion(this.settings.multipleScattering);

      for (let index = 0; index < lights.shadowLights.length; index++) {
        transmittanceUniforms.frameShadowLights.value[index].copy(lights.shadowLights[index]);
      }

      this.transmittanceMesh.layers.mask = camera.layers.mask;
      this.transmittanceMaterial.setNeural(this.isNeural());
      this.transmittanceMaterial.setMultiScale(this.isMultiScale());
      transmittanceUniforms.frameMultiScaleLevels.value = getFrameMultiScaleLevels(this.settings);

      if (this.isNeural() || this.isMultiScale()) {
        this.gridMipMesh.layers.mask = camera.layers.mask;
        this.renderGridMips(renderer, camera);
      }

      const unchanged = this.transmittanceUnchanged(
        lights.shadowLights.length,
        spectral ? spectralGroups : 0,
        transmittanceUniforms.frameSkyDirection.value,
      );

      if (!unchanged && spectral) {
        // NOTE One pass for each slot group in use, each into its own targets
        for (let group = 0; group < spectralGroups; group++) {
          transmittanceUniforms.frameSpectralGroup.value = group;

          renderer.setRenderTarget(this.getSpectralTransmittanceTarget(group));
          renderer.render(this.transmittanceScene, camera);
        }
      } else if (!unchanged) {
        renderer.setRenderTarget(this.transmittanceTarget);
        renderer.render(this.transmittanceScene, camera);
      }
    }

    if (useEnvironmentGrid) {
      this.renderEnvironmentGrid(renderer, camera, casters, lights.environmentGridLights);
    }

    const { densityShadowUniforms } = this;

    densityShadowUniforms.frameUseShadows.value = useShadows;
    if (!spectral) {
      densityShadowUniforms.frameTransmittanceMap0.value = this.transmittanceTarget.textures[0];
      densityShadowUniforms.frameTransmittanceMap1.value = this.transmittanceTarget.textures[1];
      densityShadowUniforms.frameTransmittanceMap2.value = this.transmittanceTarget.textures[2];
      densityShadowUniforms.frameTransmittanceMap3.value = this.transmittanceTarget.textures[3];
    }
    densityShadowUniforms.frameShadowSceneLightCount.value = lights.environmentShadowSlot;
    for (let index = 0; index < lights.shadowLights.length; index++) {
      densityShadowUniforms.frameShadowLights.value[index].copy(lights.shadowLights[index]);
    }
    densityShadowUniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    densityShadowUniforms.frameSkyDirection.value.copy(lights.skyDirection);
    densityShadowUniforms.frameEnvironmentGridMap.value = this.environmentGridTarget.texture;

    // NOTE Spectral: sky up and sky down are in the first two targets of group 0. Without shadows the pass does
    // not read them, and no freed target stays bound.
    if (spectral) {
      const sky = useShadows ? this.getSpectralTransmittanceTarget(0).textures : null;

      densityShadowUniforms.frameSkyTransmittanceMap0.value = sky ? sky[0] : emptyMap;
      densityShadowUniforms.frameSkyTransmittanceMap1.value = sky ? sky[1] : emptyMap;
    }
    densityShadowUniforms.frameEnvironmentMode.value = useEnvironmentGrid
      ? frameDensityEnvironment.grid
      : useShadows && lights.environmentLightCount > 0
        ? frameDensityEnvironment.none
        : frameDensityEnvironment.outward;

    // NOTE The density pass adds the environment. Its scene has the environment of the scene.
    this.densityScene.environment = scene.environment;
    this.densityScene.environmentIntensity = scene.environmentIntensity;
    this.densityScene.environmentRotation.copy(scene.environmentRotation);

    // NOTE Density pass. One instanced draw for each volume, one instance for each slice.
    this.updatePool(
      this.densityPool,
      this.densityScene,
      volumes,
      camera,
      this.setupDensityEntry,
      this.createDensityEntry,
    );

    renderer.setRenderTarget(this.densityTarget);
    renderer.clear(true, false, false);
    renderer.render(this.densityScene, camera);

    // NOTE Lighting pass. Each froxel is lit one time from the combined data.
    const lightingUniforms = this.lightingMaterial.frameUniforms;

    lightingUniforms.frameDensityAlbedoMap.value = this.densityTarget.textures[0];
    lightingUniforms.frameDensityEmissionMap.value = this.densityTarget.textures[1];
    if (spectral) {
      lightingUniforms.frameDensityExtinctionMap.value = this.densityTarget.textures[2];
      lightingUniforms.frameUseShadows.value = useShadows;
      lightingUniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
      lightingUniforms.frameSpectralGroups.value = useShadows ? spectralGroups : 0;

      // NOTE Groups not in use get the targets of group 0, all groups get emptyMap without shadows. The lighting
      // pass does not read them.
      lightingUniforms.frameSpectralTransmittanceMaps.value.forEach((_, index) => {
        const group = Math.floor(index / 3);
        const target = useShadows ? this.getSpectralTransmittanceTarget(group < spectralGroups ? group : 0) : null;

        lightingUniforms.frameSpectralTransmittanceMaps.value[index] = target ? target.textures[index % 3] : emptyMap;
      });
    } else {
      lightingUniforms.frameDensityShadowMap0.value = this.densityTarget.textures[2];
      lightingUniforms.frameDensityShadowMap1.value = this.densityTarget.textures[3];
      lightingUniforms.frameUseShadows.value = useShadows;
      lightingUniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
      lightingUniforms.frameTransmittanceMap2.value = this.transmittanceTarget.textures[2];
      lightingUniforms.frameTransmittanceMap3.value = this.transmittanceTarget.textures[3];
    }
    lightingUniforms.frameSkyDirection.value.copy(lights.skyDirection);
    lightingUniforms.frameShadowLightCount.value = lights.shadowLights.length;
    lightingUniforms.frameShadowPointOffset.value = lights.pointOffset;
    lightingUniforms.frameShadowSpotOffset.value = lights.spotOffset;
    lightingUniforms.frameEnvironmentLightCount.value = useShadows ? lights.environmentLightCount : 0;
    lightingUniforms.frameEnvironmentShadowSlot.value = lights.environmentShadowSlot;
    getFramePhase(this.settings, lightingUniforms.framePhase.value);
    getFramePhaseSpectrum(this.settings, lightingUniforms.framePhaseSpectrum.value);
    getFrameScatteringOctaves(this.settings, lightingUniforms.frameScatteringOctaves.value);

    renderer.setRenderTarget(this.atlasTarget);
    renderer.clear(true, false, false);
    renderer.render(this.injectScene, camera);
  }

  // NOTE The world shadow grid one time in a render, before the first lit mesh. Returns false with no casters.
  // NOTE Nested renders increase info.render.frame, so the frame after the grid passes marks this render.
  prepareShadowGrid(renderer, scene, camera) {
    if (renderer.info.render.frame === this.gridFrame && camera === this.gridCamera) {
      return this.gridReady;
    }

    const { casters } = this.collectVolumes(scene, camera, this.gridCollector);
    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();

    renderer.getClearColor(clearColor);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);

    this.updateGridTargets();

    // NOTE 'volume' lighting: only the last cascade, for the volume shadow maps
    this.gridReady = this.renderShadowDensity(renderer, camera, casters, !this.isFrameLighting());
    this.gridFreshCamera = camera;

    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);

    this.gridFrame = renderer.info.render.frame;
    this.gridCamera = camera;

    return this.gridReady;
  }

  // NOTE updatePool setup of the density pass: one instance for each slice of the volume
  setupDensityEntry = (entry, { frameVolume, volume }, camera) => {
    const { frameUniforms } = entry.material;

    if (!this.getFroxelRect(volume, camera, frameUniforms.frameRect.value)) {
      return false;
    }

    const { first, count } = this.getSliceRange(volume);

    entry.material.setSpectral(this.isSpectral());
    setVolumeUniforms(frameUniforms, frameVolume, volume);
    // NOTE 'frame' lighting: the light slots get one phase for all volumes, from frameRenderer.settings
    getFramePhase(this.settings, frameUniforms.framePhase.value);
    getFramePhaseSpectrum(this.settings, frameUniforms.framePhaseSpectrum.value);
    getFrameScatteringOctaves(this.settings, frameUniforms.frameScatteringOctaves.value);
    frameUniforms.frameDiffusion.value = isFrameDiffusion(this.settings.multipleScattering) ? 1 : 0;
    frameUniforms.frameSliceStart.value = first;
    entry.geometry.instanceCount = count;

    return true;
  };

  // NOTE updatePool entry of the density pass. Each entry has its own material.
  createDensityEntry = (geometry) => {
    const material = new FrameDensityMaterial({
      ...this.froxelUniforms,
      ...this.froxelTileUniforms,
      ...this.gridUniforms,
      ...this.densityShadowUniforms,
      ...this.environmentUniforms,
      ...this.environmentGridUniforms,
    });

    return { mesh: new Three.Mesh(geometry, material), material, geometry };
  };

  // NOTE updatePool setup of the shadow density pass: the voxels of the volume in one cascade
  setupShadowEntry = (entry, { frameVolume, volume, cascade }) => {
    const range = this.getGridRange(volume, cascade);

    if (!range) {
      return false;
    }

    entry.material.setSpectral(this.isSpectral());
    setVolumeUniforms(entry.material.uniforms, frameVolume, volume);
    entry.material.uniforms.frameRect.value.copy(range.rect);
    entry.material.uniforms.frameSliceStart.value = range.first;
    entry.geometry.instanceCount = range.count;

    return true;
  };

  createShadowEntry = (geometry) => {
    const material = new FrameShadowDensityMaterial({ ...this.gridUniforms, ...this.gridTileUniforms });

    return { mesh: new Three.Mesh(geometry, material), material, geometry };
  };

  // NOTE A pooled shadow light position of updateLightProxies. list.length is the used count.
  getLightPosition(list) {
    if (list.length === list.entries.length) {
      list.entries.push(new Three.Vector4());
    }

    return list.entries[list.length++];
  }

  // NOTE traverseVisible callback of updateLightProxies. this.lightState holds the state of the current call.
  visitLight = (light) => {
    const state = this.lightState;

    if (!light.isLight || !lightProxyFactories[light.type] || !light.layers.test(state.camera.layers)) {
      return;
    }

    const index = state.used[light.type] || 0;
    const proxy = this.getLightProxy(light.type, index);

    state.used[light.type] = index + 1;

    proxy.visible = true;
    proxy.layers.mask = state.camera.layers.mask;
    proxy.color.copy(light.color);
    proxy.intensity = light.intensity;
    proxy.matrixWorld.copy(light.matrixWorld);

    if (light.target) {
      proxy.target.matrixWorld.copy(light.target.matrixWorld);
    }

    if (light.isPointLight || light.isSpotLight) {
      proxy.distance = light.distance;
      proxy.decay = light.decay;
    }

    if (light.isSpotLight) {
      proxy.angle = light.angle;
      proxy.penumbra = light.penumbra;
    }

    if (light.isHemisphereLight) {
      proxy.groundColor.copy(light.groundColor);

      if (!state.hasSky) {
        state.skyDirection.setFromMatrixPosition(light.matrixWorld);
        state.hasSky = state.skyDirection.lengthSq() > 0.0;
      }
    }

    if (light.isLightProbe) {
      proxy.sh.copy(light.sh);
    }

    lightPosition.setFromMatrixPosition(light.matrixWorld);

    if (light.isDirectionalLight) {
      lightTarget.setFromMatrixPosition(light.target.matrixWorld);
      lightPosition.sub(lightTarget).normalize();
      this.getLightPosition(state.directions).set(lightPosition.x, lightPosition.y, lightPosition.z, 1.0);
    } else if (light.isSpotLight) {
      this.getLightPosition(state.spots).set(lightPosition.x, lightPosition.y, lightPosition.z, 2.0);
    } else if (light.isPointLight) {
      this.getLightPosition(state.points).set(lightPosition.x, lightPosition.y, lightPosition.z, 2.0);
    }
  };

  // NOTE The light scene has copies of the scene lights. Then three.js light uniforms work in its passes.
  // Shadow slots follow the order of the three.js light arrays: directional, point, spot.
  // NOTE Returns this.lightResult, used again in the next call.
  updateLightProxies(scene, camera) {
    const state = this.lightState;
    const { used, directions, points, spots, skyDirection } = state;

    for (const type in used) {
      used[type] = 0;
    }

    state.camera = camera;
    state.hasSky = false;
    directions.length = 0;
    points.length = 0;
    spots.length = 0;
    skyDirection.set(0.0, 1.0, 0.0);

    scene.traverseVisible(this.visitLight);
    state.camera = null;

    for (const type in this.lightProxies) {
      const proxies = this.lightProxies[type];

      for (let index = used[type] || 0; index < proxies.length; index++) {
        proxies[index].visible = false;
      }
    }

    if (!state.hasSky) {
      skyDirection.set(0.0, 1.0, 0.0);
    }

    // NOTE 'frame' lighting. Scene lights take the first shadow slots, then the environment lights
    // (core/FrameRenderer.js updateEnvironmentLights).
    const result = this.lightResult;
    const { shadowLights } = result;

    shadowLights.length = 0;
    for (let i = 0; i < directions.length && shadowLights.length < frameShadowLightSlots; i++) {
      shadowLights.push(directions.entries[i]);
    }

    for (let i = 0; i < points.length && shadowLights.length < frameShadowLightSlots; i++) {
      shadowLights.push(points.entries[i]);
    }

    for (let i = 0; i < spots.length && shadowLights.length < frameShadowLightSlots; i++) {
      shadowLights.push(spots.entries[i]);
    }

    const sceneShadowCount = shadowLights.length;

    if (this.updateEnvironmentLights(this.environmentUniforms, sceneShadowCount) > 0) {
      shadowLights.push(this.environmentShadowLight.fromArray(this.environment.directions[0]).setW(1.0));
    }

    result.skyDirection.copy(skyDirection).normalize();
    result.pointOffset = directions.length;
    result.spotOffset = directions.length + points.length;
    result.skyLightCount = (used.HemisphereLight || 0) + (used.LightProbe || 0);

    return result;
  }

  getLightProxy(type, index) {
    const proxies = this.lightProxies[type] || (this.lightProxies[type] = []);

    if (!proxies[index]) {
      const proxy = lightProxyFactories[type]();

      proxy.matrixAutoUpdate = false;
      proxy.matrixWorldAutoUpdate = false;
      proxy.castShadow = false;

      if (proxy.target) {
        proxy.target.matrixAutoUpdate = false;
        proxy.target.matrixWorldAutoUpdate = false;
      }

      proxies[index] = proxy;
      this.injectScene.add(proxy);
    }

    return proxies[index];
  }

  dispose() {
    // NOTE Each pool entry has its own material
    [...this.densityPool, ...this.shadowPool].forEach(({ material }) => material.dispose());

    super.dispose();

    if (this.depthTarget) {
      this.depthTarget.depthTexture.dispose();
      this.depthTarget.dispose();
      this.depthTarget = null;
    }

    [
      this.injectMaterial,
      this.integrateMaterial,
      this.integrateTransmittanceMaterial,
      this.lightingMaterial,
      this.transmittanceMaterial,
      this.gridMipMaterial,
      this.temporalMaterial,
      this.depthMaterial,
      this.environmentMapMaterial,
      this.environmentGridMaterial,
    ].forEach((material) => material.dispose());

    [
      this.injectMesh,
      this.lightingMesh,
      this.transmittanceMesh,
      this.gridMipMesh,
      this.environmentMapMesh,
      this.environmentGridMesh,
      this.integrateTransmittanceMesh,
    ].forEach((mesh) => mesh.geometry.dispose());
  }
}

export const frameRenderer = new FrameRenderer();

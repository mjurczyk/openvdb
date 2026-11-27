import * as Three from 'three/webgpu';
import { vec4, outputStruct } from 'three/tsl';
import { FrameInjectMaterial } from './FrameInjectMaterial.js';
import { FrameIntegrateMaterial } from './FrameIntegrateMaterial.js';
import {
  FrameDensityMaterial,
  createDensityShadowUniforms,
  frameDensityEnvironment,
} from './FrameDensityMaterial.js';
import { FrameShadowDensityMaterial } from './FrameShadowDensityMaterial.js';
import { FrameTransmittanceMaterial } from './FrameTransmittanceMaterial.js';
import { FrameGridMipMaterial } from './FrameGridMipMaterial.js';
import { FrameLightingMaterial } from './FrameLightingMaterial.js';
import { FrameTemporalMaterial } from './FrameTemporalMaterial.js';
import { FrameVolumeShadows } from './FrameVolumeShadows.js';
import { FrameEnvironmentMapMaterial } from './FrameEnvironmentMapMaterial.js';
import { FrameEnvironmentGridMaterial } from './FrameEnvironmentGridMaterial.js';
import { updateVolumeMipmaps, disposeVolumeMipmaps } from './frameMipmaps.js';
import { withoutMRT, isDataPass } from './frameMRT.js';
import {
  setVolumeUniforms,
  frameMaxLights,
  frameMaxHemisphereLights,
  createFroxelUniforms,
  createGridUniforms,
  createEnvironmentGridUniforms,
  createTileUniforms,
  createAreaUniforms,
  createLightUniforms,
  frameTileVertex,
} from './frameShaderChunks.js';
import { getAtlasLayout } from '../core/frameLayout.js';
import { FrameVolumeCollector, getFroxelArea, getFrameFadeRadius } from '../core/frameView.js';
import { sameValues } from '../core/frameGrid.js';
import {
  getFramePhase,
  getFramePhaseSpectrum,
  getFrameMultipleScattering,
  getFrameScatteringOctaves,
  getFrameTwoSidedDiffusion,
  getFrameMultiScaleLevels,
  isFrameDiffusion,
} from '../core/framePhase.js';
import { getFrameSpectralGroups } from '../core/frameSpectrum.js';
import { frameNeuralLevels } from '../core/frameNeuralIndirect.js';
import { frameEnvironmentMapWidth, frameEnvironmentMapHeight } from '../core/frameEnvironment.js';
import { frameShadowLightSlots } from '../core/frameLimits.js';
import { FrameRendererBase, createTileGeometry, createScene, getClipRect } from '../core/FrameRenderer.js';

const clearColor = new Three.Color();
const lightPosition = new Three.Vector3();
const lightTarget = new Three.Vector3();
const lightColor = new Three.Color();

// NOTE Instanced, then FrameVolume proxies skip the draw with instanceCount 0 (three.js does not draw 0 instances)
export const createFullscreenGeometry = () => {
  const geometry = new Three.InstancedBufferGeometry();
  geometry.instanceCount = 1;

  geometry.setAttribute(
    'position',
    new Three.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
  );

  return geometry;
};

// NOTE Value of a map that a pass does not read: a default texture, as the start value of the texture nodes
const emptyMap = new Three.Texture();

// NOTE WebGPURenderer backend. Node materials with TSL uniform nodes. Shared CPU code is in core/FrameRenderer.js.
export class FrameRenderer extends FrameRendererBase {
  renderTargetClass = Three.RenderTarget;

  // NOTE TSL uniform nodes. Passes share them, the CPU writes .value.
  froxelUniforms = createFroxelUniforms();
  froxelTileUniforms = createTileUniforms();
  // NOTE Froxel area of the volumes in this frame. The density clear, lighting and temporal passes draw only it.
  froxelAreaUniforms = createAreaUniforms();
  gridUniforms = createGridUniforms();
  gridTileUniforms = createTileUniforms();
  densityShadowUniforms = createDensityShadowUniforms();
  lightUniforms = createLightUniforms();
  environmentGridUniforms = createEnvironmentGridUniforms();

  injectMaterial = new FrameInjectMaterial(this);
  integrateMaterial = new FrameIntegrateMaterial(this);
  lightingMaterial = new FrameLightingMaterial(this);
  transmittanceMaterial = new FrameTransmittanceMaterial(this);
  densityMaterial = new FrameDensityMaterial(this);
  shadowDensityMaterial = new FrameShadowDensityMaterial(this);
  volumeShadows = new FrameVolumeShadows(this);

  // NOTE The light scene has the scene environment. It draws the volume inject pass or the frame lighting pass.
  injectScene = createScene();
  injectMesh = new Three.Mesh(createTileGeometry(), this.injectMaterial);
  lightingMesh = new Three.Mesh(this.areaGeometry, this.lightingMaterial);

  densityScene = createScene();
  shadowScene = createScene();

  // NOTE three.js clears MRT attachments after the first one to alpha 1. The density pass adds to all alpha values.
  // NOTE This pass clears all four attachments to 0.
  densityClearMaterial = new Three.NodeMaterial();
  densityClearScene = createScene();
  densityClearMesh = new Three.Mesh(this.areaGeometry, this.densityClearMaterial);

  transmittanceScene = createScene();
  transmittanceMesh = new Three.Mesh(createFullscreenGeometry(), this.transmittanceMaterial);

  // NOTE multipleScattering 'neural' and 'multi-scale': mips of the last grid cascade, levels 1 and up (FrameGridMipMaterial)
  gridMipMaterial = new FrameGridMipMaterial();
  gridMipScene = createScene();
  gridMipMesh = new Three.Mesh(createFullscreenGeometry(), this.gridMipMaterial);

  temporalMaterial = new FrameTemporalMaterial(this);
  temporalScene = createScene();
  temporalMesh = new Three.Mesh(this.areaGeometry, this.temporalMaterial);

  environmentMapMaterial = new FrameEnvironmentMapMaterial();
  environmentMapScene = createScene();
  environmentMapMesh = new Three.Mesh(createFullscreenGeometry(), this.environmentMapMaterial);

  // NOTE Environment grid: environment lights with no shadow slot, in the last cascade. Drawn only on a change.
  environmentGridMaterial = new FrameEnvironmentGridMaterial(this);
  environmentGridScene = createScene();
  environmentGridMesh = new Three.Mesh(createFullscreenGeometry(), this.environmentGridMaterial);

  lightLimitWarned = false;

  // NOTE Render id of the world shadow grid (prepareShadowGrid)
  gridRenderId = -1;

  // NOTE collectVolumes result of the current render. The grid pass and the proxy use it.
  collected = { renderId: -1, camera: null, scene: null, result: null };
  volumeCollector = new FrameVolumeCollector();
  // NOTE updateLights state and result. Light records are pooled: length is the used count, entries the records.
  lightState = {
    camera: null,
    hemiCount: 0,
    probeCount: 0,
    hasSky: false,
    directions: { length: 0, entries: [] },
    points: { length: 0, entries: [] },
    spots: { length: 0, entries: [] },
  };
  // NOTE skyLightCount: hemisphere lights and light probes. They read sky up and sky down.
  lightResult = {
    shadowLightCount: 0,
    environmentLightCount: 0,
    environmentShadowSlot: 0,
    environmentGridLights: [],
    skyLightCount: 0,
  };

  // NOTE Mipmaps are built after the conversion. Progressive textures change in each step.
  prepareVolume = (frameVolume, volume) => {
    const converting = !!(frameVolume.source ?? frameVolume).process;

    if (frameVolume.mipmaps && !converting) {
      updateVolumeMipmaps(volume, frameVolume.mipmapFilter);
    }
  };

  constructor() {
    super();

    // NOTE Blend the volumes over the scene in sRGB, the same as WebGLRenderer. false blends in linear space.
    this.settings.srgbBlending = true;

    [
      this.injectMesh,
      this.lightingMesh,
      this.transmittanceMesh,
      this.gridMipMesh,
      this.temporalMesh,
      this.densityClearMesh,
      this.environmentMapMesh,
      this.environmentGridMesh,
    ].forEach(
      (mesh) => {
        mesh.frustumCulled = false;
      },
    );

    this.temporalScene.add(this.temporalMesh);

    this.densityClearMaterial.vertexNode = frameTileVertex(
      this.froxelTileUniforms,
      this.froxelAreaUniforms.frameAreaRect,
      this.froxelAreaUniforms.frameAreaSliceStart,
    );
    this.densityClearMaterial.fragmentNode = outputStruct(vec4(0.0), vec4(0.0), vec4(0.0), vec4(0.0));
    this.densityClearMaterial.depthTest = false;
    this.densityClearMaterial.depthWrite = false;
    this.densityClearMaterial.blending = Three.NoBlending;
    this.densityClearScene.add(this.densityClearMesh);

    this.injectScene.add(this.injectMesh, this.lightingMesh);
    this.transmittanceScene.add(this.transmittanceMesh);
    this.gridMipScene.add(this.gridMipMesh);
    this.environmentMapScene.add(this.environmentMapMesh);
    this.environmentGridScene.add(this.environmentGridMesh);
  }

  // NOTE Each FrameVolume proxy calls this. The first proxy in a frame renders the frame.
  // Other proxies draw nothing.
  render(renderer, scene, camera, proxy) {
    if (!renderer.isWebGPURenderer) {
      if (!this.rendererWarned) {
        console.error('FrameVolume: "three-openvdb" needs WebGPURenderer. Use "three-openvdb/webgl" with WebGLRenderer.');
        this.rendererWarned = true;
      }

      return;
    }

    const frame = renderer.info.render.calls;

    // NOTE Override passes and data passes (depth, normals) of other effects must not draw or start the frame
    if (scene.overrideMaterial || isDataPass(renderer)) {
      proxy.geometry.instanceCount = 0;

      return;
    }

    if (frame === this.cachedFrame && camera === this.cachedCamera) {
      proxy.geometry.instanceCount = 0;

      return;
    }

    const volumes = withoutMRT(renderer, () => {
      const collected = this.collectVolumes(renderer, scene, camera);

      // NOTE The collector walk of this render also gives the shadow lights
      this.volumeShadows.update(renderer, collected.lights);

      if (collected.volumes.length > 0) {
        this.renderFrame(renderer, scene, camera, collected.volumes, collected.casters);
      }

      return collected.volumes;
    });

    // NOTE Nested renders increase info.render.calls. Keep the new value.
    // Then other proxies in this frame skip.
    this.cachedFrame = renderer.info.render.calls;
    this.cachedCamera = camera;

    proxy.geometry.instanceCount = volumes.length > 0 ? 1 : 0;
  }

  // NOTE Backend hooks of FrameVolume (core/frameBackend.js)
  // NOTE A quad. The integrate material puts it on the screen rectangle of the froxel area.
  createProxyGeometry() {
    const geometry = createTileGeometry();

    geometry.instanceCount = 1;

    return geometry;
  }

  // NOTE No GPU mipmaps. three.js WebGPU does not generate them for 3D textures. CPU mipmaps are in frameMipmaps.js.
  configureTexture(texture) {
    texture.minFilter = Three.LinearFilter;
    texture.magFilter = Three.LinearFilter;
    texture.generateMipmaps = false;
  }

  disposeVolume(volume) {
    disposeVolumeMipmaps(volume);
  }

  // NOTE Backend hooks of FrameRendererBase (core/FrameRenderer.js). Node materials hold the uniform nodes.
  getUniforms(material) {
    return material;
  }

  getUniformArray(uniform) {
    return uniform.array;
  }

  // NOTE WebGPURenderer has no capabilities object. Each backend has its own limit.
  getMaxTextureSize(renderer) {
    const { backend } = renderer;

    if (backend.device) {
      return backend.device.limits.maxTextureDimension2D;
    }

    if (backend.gl) {
      return backend.gl.getParameter(backend.gl.MAX_TEXTURE_SIZE);
    }

    return Infinity;
  }

  // NOTE Draws the lat-long environment map with the rotation of the scene and intensity 1.0, then reads it.
  renderEnvironmentMap(renderer, scene) {
    if (!this.environmentMapTarget) {
      this.environmentMapTarget = this.createRenderTarget(frameEnvironmentMapWidth, frameEnvironmentMapHeight, {
        type: Three.FloatType,
        minFilter: Three.NearestFilter,
        magFilter: Three.NearestFilter,
      });
    }

    this.copyEnvironment(this.environmentMapScene, scene);
    this.environmentMapScene.environmentIntensity = 1.0;
    this.environmentMapMaterial.setEnvironment(scene.environment);

    renderer.setRenderTarget(this.environmentMapTarget);
    renderer.render(this.environmentMapScene, this.environmentMapCamera);

    return renderer.readRenderTargetPixelsAsync(
      this.environmentMapTarget,
      0,
      0,
      frameEnvironmentMapWidth,
      frameEnvironmentMapHeight,
    );
  }

  // NOTE Visible volumes and shadow casters, one time in a render (the render id of three.js NodeFrame, internal)
  collectVolumes(renderer, scene, camera) {
    const renderId = renderer._nodes?.nodeFrame?.renderId ?? -1;
    const { collected } = this;

    if (renderId !== -1 && collected.renderId === renderId && collected.camera === camera && collected.scene === scene) {
      return collected.result;
    }

    collected.renderId = renderId;
    collected.camera = camera;
    collected.scene = scene;
    collected.result = this.volumeCollector.collect(
      scene,
      camera,
      this.settings,
      this.usesShadowGrid(),
      this.prepareVolume,
    );

    if (collected.result.volumes.length > 0) {
      this.froxelUniforms.froxelRange.value.set(collected.result.near, collected.result.far);
    }

    // NOTE With no volume and no caster, these materials draw nothing.
    // NOTE Keep the flag, then the shaders do not build again.
    if (collected.result.volumes.length > 0 || collected.result.casters.length > 0) {
      this.updateMipmapFlags(collected.result.hasMipmaps());
    }

    return collected.result;
  }

  updateMipmapFlags(mipmaps) {
    this.densityMaterial.setMipmaps(mipmaps);
    this.shadowDensityMaterial.setMipmaps(mipmaps);
    this.injectMaterial.setMipmaps(mipmaps);
  }

  // NOTE Mips of the last grid cascade for the network (box filter) or multi-scale (binomial filter).
  // Drawn again only when the grid or the filter changes.
  renderGridMips(renderer, camera) {
    const { frameGridResolution, frameGridColumns, frameGridCount } = this.gridUniforms;
    const resolution = frameGridResolution.value;
    const source = this.shadowDensityTarget;
    const binomial = this.isMultiScale();
    const signature = [
      this.gridVersion,
      source.texture.id,
      resolution,
      frameGridCount.value,
      frameGridColumns.value,
      binomial ? 1 : 0,
    ];

    if (sameValues(signature, this.gridMipSignature)) {
      return;
    }

    this.gridMipSignature = signature;
    this.gridMipMaterial.setBinomial(binomial);

    const material = this.gridMipMaterial;
    const { frameNeuralMipMaps, frameNeuralMipLayouts } = this.transmittanceMaterial;
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
        material.frameMipSource.value = previous.target.texture;
        material.frameMipSourceResolution.value = previous.side;
        material.frameMipSourceColumns.value = previous.layout.columns;
        material.frameMipSourceTile.value = 0;
        material.frameMipSourceSize.value.set(previous.layout.width, previous.layout.height);
      } else {
        material.frameMipSource.value = source.texture;
        material.frameMipSourceResolution.value = resolution;
        material.frameMipSourceColumns.value = frameGridColumns.value;
        material.frameMipSourceTile.value = (frameGridCount.value - 1) * resolution;
        material.frameMipSourceSize.value.set(source.width, source.height);
      }

      material.frameMipResolution.value = side;
      material.frameMipColumns.value = layout.columns;
      material.frameMipSize.value.set(layout.width, layout.height);
      renderer.setRenderTarget(target);
      renderer.render(this.gridMipScene, camera);

      frameNeuralMipMaps[level - 1].value = target.texture;
      frameNeuralMipLayouts[level - 1].value.set(layout.columns, layout.width, layout.height);
      previous = { target, side, layout };
    }
  }

  // NOTE WebGPU: passes share the froxel atlas size. A new density target needs a clear pass with its attachment count.
  updateTargets(renderer) {
    const densityTarget = this.densityTarget;

    super.updateTargets(renderer);

    this.froxelUniforms.froxelAtlasSize.value.set(this.atlasTarget.width, this.atlasTarget.height);

    if (this.densityTarget && this.densityTarget !== densityTarget) {
      this.densityClearMaterial.fragmentNode = outputStruct(
        ...Array.from({ length: this.densityTarget.textures.length }, () => vec4(0.0)),
      );
      this.densityClearMaterial.needsUpdate = true;
    }

    if (this.isFrameLighting()) {
      this.densityMaterial.setSpectral(this.isSpectral());
    }
  }

  updateGridTargets() {
    super.updateGridTargets();

    this.shadowDensityMaterial.setSpectral(this.isSpectral());
  }

  renderFrame(renderer, scene, camera, volumes, casters) {
    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentScissorTest = renderer.getScissorTest();

    renderer.getClearColor(clearColor);

    // NOTE null: the environment uses the 'outward' path
    this.environment = this.environmentLights.update(renderer, scene, this.settings);

    this.updateTargets(renderer);
    this.updateFroxelArea(volumes, camera);

    this.froxelUniforms.froxelProjectionInverse.value.copy(camera.projectionMatrixInverse);
    this.froxelUniforms.frameFadeRadius.value = getFrameFadeRadius(this.settings);
    this.integrateMaterial.frameCameraNear.value = camera.near;
    this.integrateMaterial.frameCameraFar.value = camera.far;
    this.integrateMaterial.frameCameraOrthographic.value = camera.isOrthographicCamera ? 1 : 0;
    this.integrateMaterial.setSrgbBlending(
      this.settings.srgbBlending && renderer.outputColorSpace === Three.SRGBColorSpace,
      renderer.toneMapping === Three.NoToneMapping,
    );

    // NOTE Pass materials are unlit. Nested renders do not update shadow maps.
    renderer.autoClear = false;
    renderer.setScissorTest(false);
    renderer.setClearColor(0x000000, 0.0);

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

    renderer.setScissorTest(currentScissorTest);
    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  }

  // NOTE Froxel area of the volumes, for the passes over the froxel grid and for the integrate pass
  updateFroxelArea(volumes, camera) {
    const { froxelGrid, froxelRange } = this.froxelUniforms;
    const { x: width, y: height, z: depth } = froxelGrid.value;
    const area = getFroxelArea(volumes, camera, width, height, froxelRange.value, depth, this.froxelArea);
    const { frameAreaRect, frameAreaSliceStart } = this.froxelAreaUniforms;

    frameAreaRect.value.copy(area.rect);
    frameAreaSliceStart.value = area.first;
    this.areaGeometry.instanceCount = area.count;

    // NOTE One more cell on each side: the linear filter of the integrate pass reads one cell away
    const { x0, y0, x1, y1 } = getClipRect(area.rect, width, height, area.count > 0 ? 1 : 0);

    this.integrateMaterial.frameScreenRect.value.set(x0, y0, x1, y1);
    this.integrateMaterial.frameSliceRange.value.set(area.first, area.first + area.count);
  }

  // NOTE Blends this frame into the history. The integrate pass then reads the blended froxels.
  renderTemporal(renderer, camera) {
    const material = this.temporalMaterial;
    const readTarget = this.historyTargets[this.historyIndex];
    const writeTarget = this.historyTargets[1 - this.historyIndex];

    material.frameCurrentMap.value = this.atlasTarget.textures[0];
    material.frameHistoryMap.value = readTarget.textures[0];
    material.frameCurrentAlphaMap.value = this.atlasTarget.textures.at(-1);
    material.frameHistoryAlphaMap.value = readTarget.textures.at(-1);
    material.frameUseHistory.value = this.historyValid && this.historyCamera === camera ? 1 : 0;
    material.frameTemporalBlend.value = Math.min(1.0, Math.max(0.01, this.settings.temporalBlend));
    material.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    material.framePreviousViewMatrix.value.copy(this.previousViewMatrix);
    material.framePreviousProjectionMatrix.value.copy(this.previousProjectionMatrix);
    material.framePreviousRange.value.copy(this.previousRange);

    this.temporalMesh.layers.mask = camera.layers.mask;

    // NOTE The pass draws only the froxel area. The clear empties the other froxels.
    renderer.setRenderTarget(writeTarget);
    renderer.clear(true, false, false);
    renderer.render(this.temporalScene, camera);

    this.integrateMaterial.froxelAtlas.value = writeTarget.textures[0];
    this.integrateMaterial.froxelAlphaAtlas.value = writeTarget.textures.at(-1);

    this.historyIndex = 1 - this.historyIndex;
    this.historyValid = true;
    this.historyCamera = camera;
    this.previousViewMatrix.copy(camera.matrixWorldInverse);
    this.previousProjectionMatrix.copy(camera.projectionMatrix);
    this.previousRange.copy(this.froxelUniforms.froxelRange.value);
  }

  // NOTE PMREM rotation and intensity uniforms read the environment of the rendered pass scene
  copyEnvironment(target, scene) {
    target.environment = scene.environment;
    target.environmentIntensity = scene.environmentIntensity;
    target.environmentRotation.copy(scene.environmentRotation);
  }

  prepareLightScene(scene, camera, mesh) {
    this.copyEnvironment(this.injectScene, scene);

    this.injectMesh.visible = mesh === this.injectMesh;
    this.lightingMesh.visible = mesh === this.lightingMesh;
    mesh.layers.mask = camera.layers.mask;

    return this.updateLights(scene, camera);
  }

  renderInject(renderer, scene, camera, volumes) {
    const { atlasTarget, injectScene, injectMaterial } = this;

    this.prepareLightScene(scene, camera, this.injectMesh);

    injectMaterial.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    injectMaterial.setEnvironment(scene.environment);

    renderer.setRenderTarget(atlasTarget);
    renderer.clear(true, false, false);

    for (let i = 0; i < volumes.length; i++) {
      const { frameVolume, volume } = volumes[i];

      // NOTE Draw only the froxel rectangle and the slices of this volume. One instance for each slice.
      if (!this.getFroxelRect(volume, camera, injectMaterial.frameRect.value)) {
        continue;
      }

      const { first, count } = this.getSliceRange(volume);

      injectMaterial.frameSliceStart.value = first;
      this.injectMesh.geometry.instanceCount = count;

      setVolumeUniforms(injectMaterial.volumeUniforms, frameVolume, volume);
      injectMaterial.frameLights.value = frameVolume.lights;
      injectMaterial.frameShadowSteps.value = frameVolume.shadowSteps;
      injectMaterial.frameMultipleScattering.value = getFrameMultipleScattering(
        this.settings.multipleScattering,
        frameVolume,
      );
      getFrameScatteringOctaves(this.settings, injectMaterial.frameScatteringOctaves.value);
      injectMaterial.frameTwoSided.value = getFrameTwoSidedDiffusion(this.settings.multipleScattering);

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
    // NOTE Volume shadows on meshes can make the grid before, in the same render.
    const useShadows =
      this.gridFreshCamera === camera
        ? this.gridReady
        : this.renderShadowDensity(renderer, camera, casters);

    this.gridFreshCamera = null;
    const useEnvironmentGrid = useShadows && lights.environmentGridLights.length > 0;

    const spectral = this.isSpectral();
    const spectralGroups = getFrameSpectralGroups(lights.shadowLightCount);

    if (spectral) {
      this.trimSpectralTransmittanceTargets(useShadows ? spectralGroups : 0);
    }

    if (useShadows) {
      this.transmittanceMaterial.frameShadowDensityMap.value = this.shadowDensityTarget.textures[0];
      this.transmittanceMaterial.frameShadowAbsorptionMap.value = this.shadowDensityTarget.textures.at(-1);
      this.transmittanceMaterial.frameShadowLightCount.value = lights.shadowLightCount;
      // NOTE The 'outward' environment of the density pass also reads sky up and sky down
      this.transmittanceMaterial.frameSkyMarch.value =
        lights.skyLightCount > 0 ||
        (!useEnvironmentGrid && lights.environmentLightCount === 0 && !!scene.environment)
          ? 1.0
          : 0.0;
      this.transmittanceMaterial.frameMultipleScattering.value = getFrameMultipleScattering(
        this.settings.multipleScattering,
        this.settings,
      );
      getFrameScatteringOctaves(this.settings, this.transmittanceMaterial.frameScatteringOctaves.value);
      this.transmittanceMaterial.frameTwoSided.value = getFrameTwoSidedDiffusion(this.settings.multipleScattering);
      this.transmittanceMesh.layers.mask = camera.layers.mask;
      this.transmittanceMaterial.setNeural(this.isNeural());
      this.transmittanceMaterial.setMultiScale(this.isMultiScale());
      this.transmittanceMaterial.frameMultiScaleLevels.value = getFrameMultiScaleLevels(this.settings);

      if (this.isNeural() || this.isMultiScale()) {
        this.gridMipMesh.layers.mask = camera.layers.mask;
        this.renderGridMips(renderer, camera);
      }

      const unchanged = this.transmittanceUnchanged(
        lights.shadowLightCount,
        spectral ? spectralGroups : 0,
        this.lightUniforms.frameSkyDirection.value,
      );

      if (!unchanged && spectral) {
        // NOTE One pass for each slot group in use, each into its own targets
        for (let group = 0; group < spectralGroups; group++) {
          this.transmittanceMaterial.frameSpectralGroup.value = group;

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

    densityShadowUniforms.frameUseShadows.value = useShadows ? 1 : 0;
    if (!spectral) {
      densityShadowUniforms.frameTransmittanceMap0.value = this.transmittanceTarget.textures[0];
      densityShadowUniforms.frameTransmittanceMap1.value = this.transmittanceTarget.textures[1];
      densityShadowUniforms.frameTransmittanceMap2.value = this.transmittanceTarget.textures[2];
      densityShadowUniforms.frameTransmittanceMap3.value = this.transmittanceTarget.textures[3];
    }
    densityShadowUniforms.frameShadowSceneLightCount.value = lights.environmentShadowSlot;
    getFramePhase(this.settings, densityShadowUniforms.framePhase.value);
    getFramePhaseSpectrum(this.settings, densityShadowUniforms.framePhaseSpectrum.value);
    getFrameScatteringOctaves(this.settings, densityShadowUniforms.frameScatteringOctaves.value);
    densityShadowUniforms.frameDiffusion.value = isFrameDiffusion(this.settings.multipleScattering) ? 1 : 0;
    densityShadowUniforms.frameEnvironmentGridMap.value = this.environmentGridTarget.texture;
    densityShadowUniforms.frameEnvironmentMode.value = useEnvironmentGrid
      ? frameDensityEnvironment.grid
      : useShadows && lights.environmentLightCount > 0
        ? frameDensityEnvironment.none
        : frameDensityEnvironment.outward;
    densityShadowUniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);

    // NOTE Spectral: sky up and sky down are in the first two targets of group 0. Without shadows the pass does
    // not read them, and no freed target stays bound.
    if (spectral) {
      const skyMaps = densityShadowUniforms.frameSkyTransmittanceMaps;
      const sky = useShadows ? this.getSpectralTransmittanceTarget(0).textures : null;

      for (let index = 0; index < skyMaps.length; index++) {
        skyMaps[index].value = sky ? sky[index] : emptyMap;
      }
    }

    this.copyEnvironment(this.densityScene, scene);
    this.densityMaterial.setEnvironment(scene.environment);

    // NOTE Density pass. One instanced draw for each volume, one instance for each slice.
    this.updatePool(
      this.densityPool,
      this.densityScene,
      volumes,
      camera,
      this.setupDensityEntry,
      this.createDensityEntry,
    );

    this.densityClearMesh.layers.mask = camera.layers.mask;

    renderer.setRenderTarget(this.densityTarget);
    renderer.render(this.densityClearScene, camera);
    renderer.render(this.densityScene, camera);

    // NOTE Lighting pass. Each froxel is lit one time from the combined data.
    const { lightingMaterial } = this;

    lightingMaterial.frameDensityAlbedoMap.value = this.densityTarget.textures[0];
    lightingMaterial.frameDensityEmissionMap.value = this.densityTarget.textures[1];
    if (spectral) {
      lightingMaterial.frameDensityExtinctionMap.value = this.densityTarget.textures[2];
      lightingMaterial.frameSpectralGroups.value = useShadows ? spectralGroups : 0;

      // NOTE Groups not in use get the targets of group 0, all groups get emptyMap without shadows. The lighting
      // pass does not read them.
      const maps = lightingMaterial.frameSpectralTransmittanceMaps;

      for (let index = 0; index < maps.length; index++) {
        const group = Math.floor(index / 3);
        const target = useShadows ? this.getSpectralTransmittanceTarget(group < spectralGroups ? group : 0) : null;

        maps[index].value = target ? target.textures[index % 3] : emptyMap;
      }
    } else {
      lightingMaterial.frameDensityShadowMap0.value = this.densityTarget.textures[2];
      lightingMaterial.frameDensityShadowMap1.value = this.densityTarget.textures[3];
    }

    lightingMaterial.frameShadowLightCount.value = lights.shadowLightCount;
    lightingMaterial.frameEnvironmentLightCount.value = useShadows ? lights.environmentLightCount : 0;
    lightingMaterial.frameEnvironmentShadowSlot.value = lights.environmentShadowSlot;
    lightingMaterial.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    getFramePhase(this.settings, lightingMaterial.framePhase.value);
    getFramePhaseSpectrum(this.settings, lightingMaterial.framePhaseSpectrum.value);
    getFrameScatteringOctaves(this.settings, lightingMaterial.frameScatteringOctaves.value);

    renderer.setRenderTarget(this.atlasTarget);
    renderer.clear(true, false, false);
    renderer.render(this.injectScene, camera);
  }

  // NOTE Makes the world shadow grid one time in a render, before the first lit mesh.
  // NOTE 'frame' lighting uses it again in the same render. Returns false with no casters.
  prepareShadowGrid(renderer, scene, camera, renderId) {
    if (this.gridRenderId === renderId && this.gridCamera === camera) {
      return this.gridReady;
    }

    this.gridRenderId = renderId;
    this.gridCamera = camera;

    const { casters } = this.collectVolumes(renderer, scene, camera);

    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentScissorTest = renderer.getScissorTest();

    renderer.getClearColor(clearColor);
    renderer.autoClear = false;
    renderer.setScissorTest(false);
    renderer.setClearColor(0x000000, 0.0);

    this.updateGridTargets();
    // NOTE 'volume' lighting: only the last cascade, for the volume shadow maps
    this.gridReady = this.renderShadowDensity(renderer, camera, casters, !this.isFrameLighting());
    this.gridFreshCamera = camera;

    renderer.setScissorTest(currentScissorTest);
    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);

    return this.gridReady;
  }

  // NOTE updatePool setup of the density pass: one instance for each slice of the volume
  setupDensityEntry = (entry, { frameVolume, volume }, camera) => {
    if (!this.getFroxelRect(volume, camera, entry.rect)) {
      return false;
    }

    const { first, count } = this.getSliceRange(volume);

    entry.frameVolume = frameVolume;
    entry.volume = volume;
    entry.sliceStart = first;
    entry.geometry.instanceCount = count;

    return true;
  };

  // NOTE updatePool setup of the shadow density pass: the voxels of the volume in one cascade
  setupShadowEntry = (entry, { frameVolume, volume, cascade }) => {
    const range = this.getGridRange(volume, cascade);

    if (!range) {
      return false;
    }

    entry.frameVolume = frameVolume;
    entry.volume = volume;
    entry.rect.copy(range.rect);
    entry.sliceStart = range.first;
    entry.geometry.instanceCount = range.count;

    return true;
  };

  // NOTE updatePool entries share one material. Each entry sets the volume uniforms before its draw.
  createPoolEntry(geometry, material) {
    const mesh = new Three.Mesh(geometry, material);
    const entry = {
      mesh,
      geometry,
      frameVolume: null,
      volume: null,
      rect: new Three.Vector4(),
      sliceStart: 0,
    };

    mesh.onBeforeRender = () => {
      setVolumeUniforms(material.volumeUniforms, entry.frameVolume, entry.volume);
      material.frameRect.value.copy(entry.rect);
      material.frameSliceStart.value = entry.sliceStart;
    };

    return entry;
  }

  createDensityEntry = (geometry) => this.createPoolEntry(geometry, this.densityMaterial);

  createShadowEntry = (geometry) => this.createPoolEntry(geometry, this.shadowDensityMaterial);

  // NOTE A pooled light record of updateLights: (position, w type), (color, w spot cos), (spot direction, cos), falloff
  getLightRecord(list) {
    if (list.length === list.entries.length) {
      list.entries.push({
        position: new Three.Vector4(),
        color: new Three.Vector4(),
        spot: new Three.Vector4(),
        falloff: new Three.Vector2(),
      });
    }

    const record = list.entries[list.length++];

    record.spot.set(0.0, 0.0, 0.0, 0.0);
    record.falloff.set(0.0, 0.0);

    return record;
  }

  // NOTE Light i of updateLights in slot order: directional, point, spot
  getSortedLight(index) {
    const { directions, points, spots } = this.lightState;

    if (index < directions.length) {
      return directions.entries[index];
    }

    if (index < directions.length + points.length) {
      return points.entries[index - directions.length];
    }

    return spots.entries[index - directions.length - points.length];
  }

  // NOTE traverseVisible callback of updateLights. this.lightState holds the state of the current call.
  visitLight = (light) => {
    const state = this.lightState;

    if (!light.isLight || !light.layers.test(state.camera.layers)) {
      return;
    }

    const {
      frameAmbientColor,
      frameLightProbe,
      frameHemiSkyColor,
      frameHemiGroundColor,
      frameSkyDirection,
      frameHemiSkyColors,
      frameHemiGroundColors,
      frameHemiDirections,
    } = this.lightUniforms;

    lightColor.copy(light.color).multiplyScalar(light.intensity);
    lightPosition.setFromMatrixPosition(light.matrixWorld);

    if (light.isAmbientLight) {
      frameAmbientColor.value.add(lightColor);
    } else if (light.isHemisphereLight) {
      const hemiCount = state.hemiCount;

      if (hemiCount < frameMaxHemisphereLights) {
        frameHemiSkyColors.array[hemiCount].set(lightColor.r, lightColor.g, lightColor.b);
        frameHemiDirections.array[hemiCount].copy(lightPosition).normalize();
      }

      frameHemiSkyColor.value.add(lightColor);
      lightColor.copy(light.groundColor).multiplyScalar(light.intensity);
      frameHemiGroundColor.value.add(lightColor);

      if (hemiCount < frameMaxHemisphereLights) {
        frameHemiGroundColors.array[hemiCount].set(lightColor.r, lightColor.g, lightColor.b);
      }

      state.hemiCount++;

      if (!state.hasSky && lightPosition.lengthSq() > 0.0) {
        frameSkyDirection.value.copy(lightPosition).normalize();
        state.hasSky = true;
      }
    } else if (light.isLightProbe) {
      const { coefficients } = light.sh;

      state.probeCount++;

      for (let i = 0; i < coefficients.length; i++) {
        frameLightProbe.array[i].addScaledVector(coefficients[i], light.intensity);
      }
    } else if (light.isDirectionalLight) {
      const record = this.getLightRecord(state.directions);

      lightTarget.setFromMatrixPosition(light.target.matrixWorld);
      lightPosition.sub(lightTarget).normalize();
      record.position.set(lightPosition.x, lightPosition.y, lightPosition.z, 1.0);
      record.color.set(lightColor.r, lightColor.g, lightColor.b, 0.0);
    } else if (light.isSpotLight) {
      const record = this.getLightRecord(state.spots);

      lightTarget.setFromMatrixPosition(light.target.matrixWorld);
      record.position.set(lightPosition.x, lightPosition.y, lightPosition.z, 3.0);
      record.color.set(lightColor.r, lightColor.g, lightColor.b, Math.cos(light.angle * (1.0 - light.penumbra)));
      lightTarget.subVectors(lightPosition, lightTarget).normalize();
      record.spot.set(lightTarget.x, lightTarget.y, lightTarget.z, Math.cos(light.angle));
      record.falloff.set(light.distance, light.decay);
    } else if (light.isPointLight) {
      const record = this.getLightRecord(state.points);

      record.position.set(lightPosition.x, lightPosition.y, lightPosition.z, 2.0);
      record.color.set(lightColor.r, lightColor.g, lightColor.b, 0.0);
      record.falloff.set(light.distance, light.decay);
    }
  };

  // NOTE Scene lights into the light uniforms. Node materials in custom passes have no three.js light uniforms.
  // Shadow slots follow the light order: directional, point, spot.
  // NOTE Returns this.lightResult, used again in the next call.
  updateLights(scene, camera) {
    const {
      frameAmbientColor,
      frameLightProbe,
      frameHemiSkyColor,
      frameHemiGroundColor,
      frameSkyDirection,
      frameHemiCount,
      frameLightCount,
      frameLightPositions,
      frameLightColors,
      frameLightSpots,
      frameLightFalloffs,
    } = this.lightUniforms;
    const state = this.lightState;
    const { directions, points, spots } = state;

    state.camera = camera;
    state.hemiCount = 0;
    state.probeCount = 0;
    state.hasSky = false;
    directions.length = 0;
    points.length = 0;
    spots.length = 0;

    frameAmbientColor.value.setRGB(0.0, 0.0, 0.0);
    frameHemiSkyColor.value.setRGB(0.0, 0.0, 0.0);
    frameHemiGroundColor.value.setRGB(0.0, 0.0, 0.0);
    frameSkyDirection.value.set(0.0, 1.0, 0.0);

    for (let i = 0; i < frameLightProbe.array.length; i++) {
      frameLightProbe.array[i].set(0.0, 0.0, 0.0);
    }

    scene.traverseVisible(this.visitLight);
    state.camera = null;

    const { hemiCount } = state;
    const lightTotal = directions.length + points.length + spots.length;

    if ((lightTotal > frameMaxLights || hemiCount > frameMaxHemisphereLights) && !this.lightLimitWarned) {
      console.warn(
        `FrameRenderer: too many lights. Only ${frameMaxLights} lights and ${frameMaxHemisphereLights} hemisphere lights (per-volume lighting) are used.`,
      );
      this.lightLimitWarned = true;
    }

    frameHemiCount.value = Math.min(hemiCount, frameMaxHemisphereLights);

    const count = Math.min(lightTotal, frameMaxLights);
    for (let i = 0; i < count; i++) {
      const light = this.getSortedLight(i);

      frameLightPositions.array[i].copy(light.position);
      frameLightColors.array[i].copy(light.color);
      frameLightSpots.array[i].copy(light.spot);
      frameLightFalloffs.array[i].copy(light.falloff);
    }

    frameLightCount.value = count;

    // NOTE 'frame' lighting. Scene lights take the first shadow slots, then the environment lights
    // (core/FrameRenderer.js updateEnvironmentLights).
    const sceneShadowCount = Math.min(count, frameShadowLightSlots);
    const shadowLights = this.transmittanceMaterial.frameShadowLights.array;
    const environmentLightCount = this.updateEnvironmentLights(this.lightUniforms, sceneShadowCount);
    const result = this.lightResult;

    for (let i = 0; i < sceneShadowCount; i++) {
      shadowLights[i].copy(this.getSortedLight(i).position);
    }

    if (environmentLightCount > 0) {
      shadowLights[sceneShadowCount].fromArray(this.environment.directions[0]).setW(1.0);
    }

    result.shadowLightCount = sceneShadowCount + environmentLightCount;
    result.skyLightCount = hemiCount + state.probeCount;

    return result;
  }

  dispose() {
    super.dispose();

    [
      this.injectMaterial,
      this.integrateMaterial,
      this.lightingMaterial,
      this.transmittanceMaterial,
      this.gridMipMaterial,
      this.temporalMaterial,
      this.densityMaterial,
      this.shadowDensityMaterial,
      this.densityClearMaterial,
      this.environmentMapMaterial,
      this.environmentGridMaterial,
    ].forEach((material) => material.dispose());

    [
      this.injectMesh,
      this.lightingMesh,
      this.transmittanceMesh,
      this.gridMipMesh,
      this.densityClearMesh,
      this.environmentMapMesh,
      this.environmentGridMesh,
    ].forEach((mesh) => mesh.geometry.dispose());
  }
}

export const frameRenderer = new FrameRenderer();

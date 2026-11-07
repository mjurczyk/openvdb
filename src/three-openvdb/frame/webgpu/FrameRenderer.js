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
import { FrameTransmittanceMaterial, frameShadowLightSlots } from './FrameTransmittanceMaterial.js';
import { FrameGridMipMaterial } from './FrameGridMipMaterial.js';
import { FrameLightingMaterial } from './FrameLightingMaterial.js';
import { FrameTemporalMaterial } from './FrameTemporalMaterial.js';
import { FrameVolumeShadows } from './FrameVolumeShadows.js';
import { FrameEnvironmentMapMaterial } from './FrameEnvironmentMapMaterial.js';
import { FrameEnvironmentGridMaterial } from './FrameEnvironmentGridMaterial.js';
import { updateVolumeMipmaps, disposeVolumeMipmaps } from './frameMipmaps.js';
import {
  setVolumeUniforms,
  frameMaxShadowCascades,
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
import { getAtlasLayout, getFroxelSize } from '../core/frameLayout.js';
import { FrameVolumeCollector, getFroxelSliceRange, getFroxelRect, getFroxelArea } from '../core/frameView.js';
import {
  updateGridCascades,
  getGridRange,
  getCascadeCasters,
  updateGridSignatures,
  pushVector,
  pushColor,
  pushElements,
  sameValues,
} from '../core/frameGrid.js';
import {
  getFramePhase,
  getFramePhaseSpectrum,
  getFrameMultipleScattering,
  getFrameScatteringOctaves,
  getFrameTwoSidedDiffusion,
  isFrameDiffusion,
} from '../core/framePhase.js';
import {
  getFrameExtinctionSpectrum,
  getFrameSpectralGroups,
} from '../core/frameSpectrum.js';
import { frameNeuralLevels } from '../core/frameNeuralIndirect.js';
import {
  FrameEnvironmentLights,
  frameEnvironmentModes,
  frameEnvironmentMapWidth,
  frameEnvironmentMapHeight,
} from '../core/frameEnvironment.js';

const clearColor = new Three.Color();
const vector3 = new Three.Vector3();
const froxelSize = { width: 1, height: 1 };
const lightPosition = new Three.Vector3();
const lightTarget = new Three.Vector3();
const lightColor = new Three.Color();
const extinctionSpectrum = new Three.Vector3();

// NOTE The shadow density pass reads the extinction and the albedo, so every grid and mip atlas of both
const pushMapId = (values, map) => {
  values.push(map ? map.id : -1, map ? map.version : -1);
};

const pushCasterMaps = (values, volume) => {
  pushMapId(values, volume.densityMap3D);
  pushMapId(values, volume.maskMap3D);
  pushMapId(values, volume.baseColorMap3D);
  pushMapId(values, volume.mipMaps?.densityMap3D?.texture);
  pushMapId(values, volume.mipMaps?.maskMap3D?.texture);
  pushMapId(values, volume.mipMaps?.baseColorMap3D?.texture);
};

// NOTE A texture and its version in a signature. A missing texture is null, -1.
const pushMap = (values, map) => {
  values.push(map ?? null, map ? map.version : -1);
};

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

const tileQuadPosition = new Three.Float32BufferAttribute(
  [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0],
  3,
);

const createRenderTarget = (width, height, options = {}) => {
  return new Three.RenderTarget(width, height, {
    type: Three.HalfFloatType,
    format: Three.RGBAFormat,
    minFilter: Three.LinearFilter,
    magFilter: Three.LinearFilter,
    generateMipmaps: false,
    depthBuffer: false,
    ...options,
  });
};

const createScene = () => {
  const scene = new Three.Scene();
  scene.matrixWorldAutoUpdate = false;

  return scene;
};

// NOTE WebGPURenderer has no capabilities object. Each backend has its own limit.
// NOTE Instanced tile quads: one instance for each slice
const createTileGeometry = () => {
  const geometry = new Three.InstancedBufferGeometry();
  geometry.instanceCount = 0;
  geometry.setAttribute('position', tileQuadPosition);

  return geometry;
};

// NOTE Clip rectangle of a froxel cell rectangle, padding cells larger on each side. An empty rectangle stays empty.
const clipRect = { x0: 0, y0: 0, x1: 0, y1: 0 };

const getClipRect = (rect, width, height, padding) => {
  if (rect.z <= rect.x || rect.w <= rect.y) {
    clipRect.x0 = clipRect.y0 = clipRect.x1 = clipRect.y1 = 0.0;

    return clipRect;
  }

  clipRect.x0 = (Math.max(0, rect.x - padding) / width) * 2.0 - 1.0;
  clipRect.y0 = (Math.max(0, rect.y - padding) / height) * 2.0 - 1.0;
  clipRect.x1 = (Math.min(width, rect.z + padding) / width) * 2.0 - 1.0;
  clipRect.y1 = (Math.min(height, rect.w + padding) / height) * 2.0 - 1.0;

  return clipRect;
};

const getMaxTextureSize = (renderer) => {
  const { backend } = renderer;

  if (backend.device) {
    return backend.device.limits.maxTextureDimension2D;
  }

  if (backend.gl) {
    return backend.gl.getParameter(backend.gl.MAX_TEXTURE_SIZE);
  }

  return Infinity;
};

// NOTE Froxel atlas. Spectral: a second target with the red and blue alpha (and the green alpha in w for blending).
const createAtlasTarget = (width, height, spectral) => {
  if (!spectral) {
    return createRenderTarget(width, height);
  }

  const target = createRenderTarget(width, height, { count: 2 });

  target.textures[1].format = Three.RGFormat;

  return target;
};

const isSpectralTarget = (target) => target.textures.length > 1;

export class FrameRenderer {
  settings = {
    width: 512,
    height: 512,
    // NOTE N above 0: at most one froxel for each N x N canvas (CSS) pixels, for small screens. 0: no cap.
    pixelsPerFroxel: 0,
    depth: 24,
    subSteps: 32,
    near: 0.1,
    far: Infinity,
    jitter: false,
    temporal: true,
    temporalBlend: 0.2,
    lighting: 'frame',
    shadowResolution: 64,
    shadowCascades: 1,
    shadowDistance: 512,
    // NOTE Phase of all volumes with 'frame' lighting. 'volume' lighting uses the phase of each FrameVolume.
    phase: 'henyey-greenstein',
    phaseG: 0.8,
    phaseBackG: -0.3,
    phaseBackWeight: 0.2,
    phaseGExponent: 0.0,
    // NOTE Blend the volumes over the scene in sRGB, the same as WebGLRenderer. false blends in linear space.
    srgbBlending: true,
    // NOTE Volumes cast shadows on meshes, for directional, point and spot lights with castShadow
    castShadows: false,
    // NOTE Texels on each side of a volume shadow map (of each cascade tile and cube face)
    castShadowMapSize: 512,
    // NOTE Directional lights: cascades of the volume shadow map, and the largest view distance that they cover
    castShadowCascades: 1,
    castShadowDistance: 4000,
    // NOTE Grid samples on each light ray of a volume shadow map
    castShadowSteps: 32,
    // NOTE Volume shadow map pieces made again in one render (a cascade tile or a spot map 1, a cube map 6)
    castShadowUpdatesPerFrame: 1,
    // NOTE Very small maps and few samples: soft blob shadows, almost no cost
    castShadowCoarse: false,
    // NOTE Environment light: 'outward', 'directional' or 'spherical-harmonics' (core/frameEnvironment.js)
    environmentLighting: 'directional',
    environmentSamples: 8,
    environmentShOrder: 1,
    // NOTE Multiple scattering in the shadows of all lights (core/framePhase.js). 'neural': scattered light of the
    // scene lights from a network (core/frameNeuralIndirect.js), diffusion elsewhere. true: diffusion toward the light
    // (1D). 'two-sided': diffusion toward and away from the light (2D). 'octaves': indirect light octaves. false: single scattering.
    multipleScattering: 'neural',
    scatteringOctaves: 4,
    scatteringOctaveExtinction: 0.5,
    scatteringOctaveContribution: 0.5,
    scatteringOctavePhase: 0.5,
    // NOTE Extinction of each channel (FrameVolume extinctionScale, angstromExponent) and
    // multiple scattering with the albedo of each channel. false: grey extinction, luminance albedo.
    spectral: false,
  };

  // NOTE TSL uniform nodes. Passes share them, the CPU writes .value.
  froxelUniforms = createFroxelUniforms();
  // NOTE Canvas and drawing buffer sizes that settings.pixelsPerFroxel holds (core/frameLayout.js getFroxelSize)
  froxelHeldSize = { canvasX: 0, canvasY: 0, bufferX: 0, bufferY: 0 };
  froxelTileUniforms = createTileUniforms();
  // NOTE Froxel area of the volumes in this frame. The density clear, lighting and temporal passes draw only it.
  froxelAreaUniforms = createAreaUniforms();
  froxelArea = { rect: new Three.Vector4(), first: 0, count: 0 };
  areaGeometry = createTileGeometry();
  gridUniforms = createGridUniforms(this.froxelUniforms.frameJitter);
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
  densityPool = [];

  // NOTE three.js clears MRT attachments after the first one to alpha 1. The density pass adds to all alpha values.
  // NOTE This pass clears all four attachments to 0.
  densityClearMaterial = new Three.NodeMaterial();
  densityClearScene = createScene();
  densityClearMesh = new Three.Mesh(this.areaGeometry, this.densityClearMaterial);

  shadowScene = createScene();
  shadowPool = [];

  transmittanceScene = createScene();
  transmittanceMesh = new Three.Mesh(createFullscreenGeometry(), this.transmittanceMaterial);

  // NOTE multipleScattering 'neural': mips of the last grid cascade, levels 1 and up (FrameGridMipMaterial)
  gridMipMaterial = new FrameGridMipMaterial();
  gridMipScene = createScene();
  gridMipMesh = new Three.Mesh(createFullscreenGeometry(), this.gridMipMaterial);
  gridMipTargets = [];
  gridMipSignature = [];

  temporalMaterial = new FrameTemporalMaterial(this);
  temporalScene = createScene();
  temporalMesh = new Three.Mesh(this.areaGeometry, this.temporalMaterial);
  historyTargets = [null, null];
  historyIndex = 0;
  historyValid = false;
  historyCamera = null;
  previousViewMatrix = new Three.Matrix4();
  previousProjectionMatrix = new Three.Matrix4();
  previousRange = new Three.Vector2(0.1, 1.0);
  jitterIndex = 0;

  // NOTE Environment lights. A small map of the environment is read one time for each environment change.
  environmentLights = new FrameEnvironmentLights((renderer, scene) =>
    this.renderEnvironmentMap(renderer, scene),
  );
  environmentMapMaterial = new FrameEnvironmentMapMaterial();
  environmentMapScene = createScene();
  environmentMapMesh = new Three.Mesh(createFullscreenGeometry(), this.environmentMapMaterial);
  // NOTE A camera with updateProjectionMatrix(). Renderers call it, for example on a coordinate system change.
  environmentMapCamera = new Three.OrthographicCamera(-1.0, 1.0, 1.0, -1.0, 0.0, 1.0);
  environmentMapTarget = null;
  environment = null;

  // NOTE Environment grid: environment lights with no shadow slot, in the last cascade. Drawn only on a change.
  environmentGridMaterial = new FrameEnvironmentGridMaterial(this);
  environmentGridScene = createScene();
  environmentGridMesh = new Three.Mesh(createFullscreenGeometry(), this.environmentGridMaterial);
  environmentGridTarget = null;
  environmentGridSignature = [];
  nextEnvironmentGridSignature = [];
  scatteringOctaves = new Three.Vector4();

  atlasTarget = null;
  densityTarget = null;
  shadowDensityTarget = null;
  transmittanceTarget = null;
  // NOTE frameRenderer.settings.spectral: 3 transmittance targets for each slot group in use (core/frameSpectrum.js).
  // Made when a group is first used. transmittanceTarget is null.
  spectralTransmittanceTargets = [];
  lightLimitWarned = false;

  // NOTE World shadow grid of the current render. Volume shadows make it before the first lit mesh.
  // NOTE Then 'frame' lighting uses it again. gridVersion changes when the grid content changes.
  gridRenderId = -1;
  gridCamera = null;
  gridReady = false;
  gridFreshCamera = null;
  gridVersion = 0;
  gridSignature = [];
  nextGridSignature = [];
  // NOTE castVersion changes when the last grid cascade (all volumes) changes. Volume shadow maps read only it.
  castVersion = 0;
  castSignature = [];
  nextCastSignature = [];
  casterSignature = [];
  // NOTE What the shadow grid and the transmittance targets were last drawn from. While it stays the same, the
  // targets still hold it and the passes are not drawn again: a still volume under still lights costs nothing.
  shadowDrawnVersion = -1;
  shadowDrawnTarget = null;
  transmittanceSignature = [];
  nextTransmittanceSignature = [];

  // NOTE collectVolumes result of the current render. The grid pass and the proxy use it.
  collected = { renderId: -1, camera: null, scene: null, result: null };
  volumeCollector = new FrameVolumeCollector();
  // NOTE Results of getSliceRange, getGridRange and the cascade casters. They are used again in the next call.
  sliceRange = { first: 0, count: 0 };
  gridRange = { rect: new Three.Vector4(), first: 0, count: 0 };
  cascadeCasterPool = { items: [], entries: [] };
  // NOTE updateLights state and result. Light records are pooled: length is the used count, entries the records.
  lightState = {
    camera: null,
    hemiCount: 0,
    hasSky: false,
    directions: { length: 0, entries: [] },
    points: { length: 0, entries: [] },
    spots: { length: 0, entries: [] },
  };
  lightResult = { shadowLightCount: 0, environmentLightCount: 0, environmentShadowSlot: 0, environmentGridLights: [] };
  environmentGridLightEntries = [];

  // NOTE Mipmaps are built after the conversion. Progressive textures change in each step.
  prepareVolume = (frameVolume, volume) => {
    const converting = !!(frameVolume.source ?? frameVolume).process;

    if (frameVolume.mipmaps && !converting) {
      updateVolumeMipmaps(volume);
    }
  };

  cachedFrame = -1;
  cachedCamera = null;
  rendererWarned = false;

  constructor() {
    [
      this.injectMesh,
      this.lightingMesh,
      this.transmittanceMesh,
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

    // NOTE Override passes (depth, normals) of other effects must not draw or start the frame
    if (scene.overrideMaterial) {
      proxy.geometry.instanceCount = 0;

      return;
    }

    if (frame === this.cachedFrame && camera === this.cachedCamera) {
      proxy.geometry.instanceCount = 0;

      return;
    }

    this.volumeShadows.update(renderer, scene);

    const { volumes, casters } = this.collectVolumes(renderer, scene, camera);

    if (volumes.length > 0) {
      this.renderFrame(renderer, scene, camera, volumes, casters);
    }

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

  isFrameLighting() {
    return this.settings.lighting === 'frame';
  }

  // NOTE Environment grid of the last cascade. It is drawn again only when its signature changes.
  // NOTE Signature: the grid lights, the last cascade, and the caster data that the shadow density pass reads (also the albedo).
  renderEnvironmentGrid(renderer, camera, casters, gridLights) {
    const { frameGridMin, frameGridSize, frameGridCount, frameGridResolution } = this.gridUniforms;
    const cascade = frameGridCount.value - 1;
    const previous = this.environmentGridSignature;
    const signature = this.nextEnvironmentGridSignature;

    this.environmentGridUniforms.frameEnvironmentGridCascade.value = cascade;

    const multipleScattering = getFrameMultipleScattering(this.settings.multipleScattering, this.settings);
    const scatteringOctaves = getFrameScatteringOctaves(this.settings, this.scatteringOctaves);

    signature.length = 0;
    signature.push(
      frameGridResolution.value,
      cascade,
      this.isSpectral() ? 1 : 0,
      multipleScattering,
    );
    pushVector(signature, scatteringOctaves);
    pushVector(signature, frameGridMin.array[cascade]);
    pushVector(signature, frameGridSize.array[cascade]);

    for (let i = 0; i < gridLights.length; i++) {
      pushElements(signature, gridLights[i].direction);
      pushElements(signature, gridLights[i].color);
    }

    for (let i = 0; i < casters.length; i++) {
      const { frameVolume, volume } = casters[i];
      const mipMaps = frameVolume.mipmaps ? volume.mipMaps : null;

      pushMap(signature, volume.densityMap3D);
      pushMap(signature, volume.maskMap3D);
      pushMap(signature, volume.baseColorMap3D);
      pushMap(signature, mipMaps?.densityMap3D?.texture);
      pushMap(signature, mipMaps?.maskMap3D?.texture);
      pushMap(signature, mipMaps?.baseColorMap3D?.texture);

      signature.push(frameVolume.extinction);
      pushVector(signature, getFrameExtinctionSpectrum(frameVolume, extinctionSpectrum));
      signature.push(frameVolume.densityScale, frameVolume.densityCutoff, frameVolume.absorbance);
      pushColor(signature, frameVolume.baseColor);
      signature.push(frameVolume.wrap3D);
      pushVector(signature, frameVolume.offset3D);
      pushElements(signature, volume.matrixWorld.elements);
    }

    if (sameValues(signature, previous)) {
      return;
    }

    this.environmentGridSignature = signature;
    this.nextEnvironmentGridSignature = previous;

    const material = this.environmentGridMaterial;

    material.frameShadowDensityMap.value = this.shadowDensityTarget.textures[0];
    material.frameShadowAbsorptionMap.value = this.shadowDensityTarget.textures.at(-1);
    material.frameLightCount.value = gridLights.length;
    material.frameMultipleScattering.value = multipleScattering;
    material.frameScatteringOctaves.value.copy(scatteringOctaves);

    for (let i = 0; i < gridLights.length; i++) {
      material.frameLightDirections.array[i].fromArray(gridLights[i].direction);
      material.frameLightColors.array[i].fromArray(gridLights[i].color);
    }

    this.environmentGridMesh.layers.mask = camera.layers.mask;

    renderer.setRenderTarget(this.environmentGridTarget);
    renderer.render(this.environmentGridScene, camera);
  }

  // NOTE Draws the lat-long environment map with the rotation of the scene and intensity 1.0, then reads it.
  renderEnvironmentMap(renderer, scene) {
    if (!this.environmentMapTarget) {
      this.environmentMapTarget = createRenderTarget(frameEnvironmentMapWidth, frameEnvironmentMapHeight, {
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

    this.updateMipmapFlags(collected.result.hasMipmaps());

    return collected.result;
  }

  updateMipmapFlags(mipmaps) {
    this.densityMaterial.setMipmaps(mipmaps);
    this.shadowDensityMaterial.setMipmaps(mipmaps);
    this.injectMaterial.setMipmaps(mipmaps);
  }

  // NOTE The world shadow grid is used by 'frame' lighting and by volume shadows on meshes
  usesShadowGrid() {
    return this.isFrameLighting() || this.settings.castShadows;
  }

  isSpectral() {
    return this.settings.spectral === true;
  }

  // NOTE multipleScattering 'neural' uses the network only with grey 'frame' lighting. Other cases use diffusion.
  isNeural() {
    return this.settings.multipleScattering === 'neural' && !this.isSpectral();
  }

  // NOTE Mips of the last grid cascade for the network. Drawn again only when the grid changes.
  renderGridMips(renderer, camera) {
    const { frameGridResolution, frameGridColumns, frameGridCount } = this.gridUniforms;
    const resolution = frameGridResolution.value;
    const source = this.shadowDensityTarget;
    const signature = [this.gridVersion, source.texture.id, resolution, frameGridCount.value, frameGridColumns.value];

    if (sameValues(signature, this.gridMipSignature)) {
      return;
    }

    this.gridMipSignature = signature;

    const material = this.gridMipMaterial;

    for (let level = 1; level < frameNeuralLevels; level++) {
      const side = Math.max(1, resolution >> level);
      let target = this.gridMipTargets[level - 1];

      if (!target || target.width !== side * side || target.height !== side) {
        target?.dispose();
        target = createRenderTarget(side * side, side, { format: Three.RGFormat });
        this.gridMipTargets[level - 1] = target;
      }

      if (level === 1) {
        material.frameMipSource.value = source.texture;
        material.frameMipSourceResolution.value = resolution;
        material.frameMipSourceColumns.value = frameGridColumns.value;
        material.frameMipSourceTile.value = (frameGridCount.value - 1) * resolution;
        material.frameMipSourceSize.value.set(source.width, source.height);
      } else {
        const previous = this.gridMipTargets[level - 2];
        const previousSide = previous.height;

        material.frameMipSource.value = previous.texture;
        material.frameMipSourceResolution.value = previousSide;
        material.frameMipSourceColumns.value = previousSide;
        material.frameMipSourceTile.value = 0;
        material.frameMipSourceSize.value.set(previous.width, previous.height);
      }

      material.frameMipResolution.value = side;
      renderer.setRenderTarget(target);
      renderer.render(this.gridMipScene, camera);
    }

    this.gridMipTargets.forEach((target, index) => {
      this.transmittanceMaterial.frameNeuralMipMaps[index].value = target.texture;
    });
  }

  // NOTE The 3 transmittance targets of a spectral slot group, the same size as the shadow grid
  getSpectralTransmittanceTarget(group) {
    const targets = this.spectralTransmittanceTargets;

    while (targets.length <= group) {
      const { width, height } = this.shadowDensityTarget;

      targets.push(createRenderTarget(width, height, { count: 3 }));
    }

    return targets[group];
  }

  // NOTE Slices of a volume. Returns this.sliceRange ({ first, count }), used again in the next call.
  getSliceRange(volume) {
    const { froxelRange, froxelGrid } = this.froxelUniforms;

    return getFroxelSliceRange(volume, froxelRange.value, froxelGrid.value.z, this.sliceRange);
  }

  updateTargets(renderer) {
    const { depth, subSteps } = this.settings;
    const { width, height } = getFroxelSize(this.settings, renderer, froxelSize, this.froxelHeldSize);
    const spectral = this.isSpectral();
    const froxelAtlas = getAtlasLayout(width, height, depth);

    if (
      !this.atlasTarget ||
      this.atlasTarget.width !== froxelAtlas.width ||
      this.atlasTarget.height !== froxelAtlas.height ||
      isSpectralTarget(this.atlasTarget) !== spectral
    ) {
      const maxTextureSize = getMaxTextureSize(renderer);

      if (froxelAtlas.width > maxTextureSize || froxelAtlas.height > maxTextureSize) {
        console.warn(
          'FrameRenderer: froxel atlas is larger than maxTextureSize. Decrease width, height or depth.',
        );
      }

      if (this.atlasTarget) {
        this.atlasTarget.dispose();
      }

      this.atlasTarget = createAtlasTarget(froxelAtlas.width, froxelAtlas.height, spectral);
      this.historyValid = false;
    }

    this.injectMaterial.setSpectral(spectral);
    this.lightingMaterial.setSpectral(spectral);
    this.temporalMaterial.setSpectral(spectral);
    this.integrateMaterial.setSpectral(spectral);

    const { froxelGrid, froxelColumns } = this.froxelUniforms;

    // NOTE A new grid layout makes the history unusable, also when the atlas keeps its size (600 x 400 to 400 x 600)
    if (
      froxelGrid.value.x !== width ||
      froxelGrid.value.y !== height ||
      froxelGrid.value.z !== depth ||
      froxelColumns.value !== froxelAtlas.columns
    ) {
      this.historyValid = false;
    }

    this.froxelUniforms.froxelGrid.value.set(width, height, depth);
    this.froxelUniforms.froxelColumns.value = froxelAtlas.columns;
    this.froxelUniforms.froxelSubSteps.value = Math.max(1, Math.round(subSteps));
    this.froxelTileUniforms.frameTileSize.value.set(width, height);
    this.froxelTileUniforms.frameTileColumns.value = froxelAtlas.columns;
    this.froxelTileUniforms.frameTargetSize.value.set(froxelAtlas.width, froxelAtlas.height);
    this.froxelUniforms.froxelAtlasSize.value.set(froxelAtlas.width, froxelAtlas.height);
    this.integrateMaterial.froxelAtlas.value = this.atlasTarget.textures[0];
    this.integrateMaterial.froxelAlphaAtlas.value = this.atlasTarget.textures[spectral ? 1 : 0];

    if (this.settings.temporal) {
      for (let index = 0; index < this.historyTargets.length; index++) {
        const target = this.historyTargets[index];

        if (
          !target ||
          target.width !== froxelAtlas.width ||
          target.height !== froxelAtlas.height ||
          isSpectralTarget(target) !== spectral
        ) {
          if (target) {
            target.dispose();
          }

          this.historyTargets[index] = createAtlasTarget(froxelAtlas.width, froxelAtlas.height, spectral);
          this.historyValid = false;
        }
      }
    }

    if (this.isFrameLighting()) {
      // NOTE Spectral: 3 targets (albedo, emission, extinction of each channel), no light slot targets
      const densityCount = spectral ? 3 : 4;

      if (
        !this.densityTarget ||
        this.densityTarget.width !== froxelAtlas.width ||
        this.densityTarget.height !== froxelAtlas.height ||
        this.densityTarget.textures.length !== densityCount
      ) {
        if (this.densityTarget) {
          this.densityTarget.dispose();
        }

        this.densityTarget = createRenderTarget(froxelAtlas.width, froxelAtlas.height, {
          count: densityCount,
          minFilter: Three.NearestFilter,
          magFilter: Three.NearestFilter,
        });
        this.densityClearMaterial.fragmentNode = outputStruct(
          ...Array.from({ length: densityCount }, () => vec4(0.0)),
        );
        this.densityClearMaterial.needsUpdate = true;
      }

      this.densityMaterial.setSpectral(spectral);

      this.updateGridTargets();
    }
  }

  updateGridTargets() {
    const resolution = Math.max(2, Math.round(this.settings.shadowResolution));
    const cascades = this.getCascadeCount();
    const gridAtlas = getAtlasLayout(resolution, resolution, resolution * cascades);
    const spectral = this.isSpectral();

    if (
      !this.shadowDensityTarget ||
      this.shadowDensityTarget.width !== gridAtlas.width ||
      this.shadowDensityTarget.height !== gridAtlas.height ||
      isSpectralTarget(this.shadowDensityTarget) !== spectral
    ) {
      if (this.shadowDensityTarget) {
        this.shadowDensityTarget.dispose();
        this.transmittanceTarget?.dispose();
      }

      this.spectralTransmittanceTargets.forEach((target) => target.dispose());
      this.spectralTransmittanceTargets = [];

      // NOTE Extinction and absorption. Spectral: (extinction rgb, 0) and (absorption rgb, 0).
      this.shadowDensityTarget = spectral
        ? createRenderTarget(gridAtlas.width, gridAtlas.height, { count: 2 })
        : createRenderTarget(gridAtlas.width, gridAtlas.height, { format: Three.RGFormat });
      // NOTE Total transmittance (2 targets), then direct transmittance of the light slots (2 targets).
      // Spectral: the slot group targets (getSpectralTransmittanceTarget).
      this.transmittanceTarget = spectral
        ? null
        : createRenderTarget(gridAtlas.width, gridAtlas.height, { count: 4 });

      // NOTE A new target is empty, so the environment grid is drawn again
      this.environmentGridSignature = [];
    }

    this.shadowDensityMaterial.setSpectral(spectral);
    this.transmittanceMaterial.setSpectral(spectral);
    this.environmentGridMaterial.setSpectral(spectral);

    // NOTE The environment grid is one cascade. A new target is empty, so the signature is reset.
    const environmentAtlas = getAtlasLayout(resolution, resolution, resolution);

    if (
      !this.environmentGridTarget ||
      this.environmentGridTarget.width !== environmentAtlas.width ||
      this.environmentGridTarget.height !== environmentAtlas.height
    ) {
      if (this.environmentGridTarget) {
        this.environmentGridTarget.dispose();
      }

      this.environmentGridTarget = createRenderTarget(environmentAtlas.width, environmentAtlas.height);
      this.environmentGridSignature = [];
    }

    this.environmentGridUniforms.frameEnvironmentGridColumns.value = environmentAtlas.columns;
    this.environmentGridUniforms.frameEnvironmentGridAtlasSize.value.set(
      environmentAtlas.width,
      environmentAtlas.height,
    );

    this.gridUniforms.frameGridResolution.value = resolution;
    this.gridUniforms.frameGridColumns.value = gridAtlas.columns;
    this.gridUniforms.frameGridAtlasSize.value.set(gridAtlas.width, gridAtlas.height);
    this.gridTileUniforms.frameTileSize.value.set(resolution, resolution);
    this.gridTileUniforms.frameTileColumns.value = gridAtlas.columns;
    this.gridTileUniforms.frameTargetSize.value.set(gridAtlas.width, gridAtlas.height);
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

    // NOTE Golden ratio steps give a new, evenly spread jitter value for each frame
    this.froxelUniforms.frameJitter.value = this.settings.jitter
      ? (this.jitterIndex * 0.618034) % 1.0
      : -1.0;
    this.jitterIndex = (this.jitterIndex + 1) % 1024;

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

    if (useShadows) {
      this.transmittanceMaterial.frameShadowDensityMap.value = this.shadowDensityTarget.textures[0];
      this.transmittanceMaterial.frameShadowAbsorptionMap.value = this.shadowDensityTarget.textures.at(-1);
      this.transmittanceMaterial.frameShadowLightCount.value = lights.shadowLightCount;
      this.transmittanceMaterial.frameMultipleScattering.value = getFrameMultipleScattering(
        this.settings.multipleScattering,
        this.settings,
      );
      getFrameScatteringOctaves(this.settings, this.transmittanceMaterial.frameScatteringOctaves.value);
      this.transmittanceMaterial.frameTwoSided.value = getFrameTwoSidedDiffusion(this.settings.multipleScattering);
      this.transmittanceMesh.layers.mask = camera.layers.mask;
      this.transmittanceMaterial.setNeural(this.isNeural());

      if (this.isNeural()) {
        this.gridMipMesh.layers.mask = camera.layers.mask;
        this.renderGridMips(renderer, camera);
      }

      const unchanged = this.transmittanceUnchanged(lights.shadowLightCount, spectral ? spectralGroups : 0);

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

    // NOTE Spectral: sky up and sky down are in the first two targets of group 0
    if (spectral && useShadows) {
      const skyMaps = densityShadowUniforms.frameSkyTransmittanceMaps;

      for (let index = 0; index < skyMaps.length; index++) {
        skyMaps[index].value = this.getSpectralTransmittanceTarget(0).textures[index];
      }
    }

    this.copyEnvironment(this.densityScene, scene);
    this.densityMaterial.setEnvironment(scene.environment);

    // NOTE Density pass. One instanced draw for each volume, one instance for each slice.
    this.updatePool(
      this.densityPool,
      this.densityScene,
      this.densityMaterial,
      volumes,
      camera,
      this.setupDensityEntry,
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

      // NOTE Groups not in use get the targets of group 0. The lighting pass does not read them.
      if (useShadows) {
        const maps = lightingMaterial.frameSpectralTransmittanceMaps;

        for (let index = 0; index < maps.length; index++) {
          const group = Math.floor(index / 3);
          const target = this.getSpectralTransmittanceTarget(group < spectralGroups ? group : 0);

          maps[index].value = target.textures[index % 3];
        }
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

  // NOTE Whether the transmittance targets already hold what this render would draw: the same grid content, targets,
  // shadow lights and settings. A jittered grid changes in each frame, so it is always drawn.
  transmittanceUnchanged(shadowLightCount, spectralGroups) {
    const material = this.transmittanceMaterial;
    const values = this.nextTransmittanceSignature;

    values.length = 0;
    values.push(
      this.gridVersion,
      this.shadowDensityTarget.texture.id,
      // NOTE Spectral rendering has no single transmittance target, only the targets of its groups below
      this.transmittanceTarget ? this.transmittanceTarget.texture.id : -1,
      spectralGroups,
      shadowLightCount,
      material.frameMultipleScattering.value,
      material.neural ? 1 : 0,
      material.frameTwoSided.value,
    );
    pushVector(values, material.frameScatteringOctaves.value);
    pushVector(values, this.lightUniforms.frameSkyDirection.value);

    for (let group = 0; group < spectralGroups; group++) {
      values.push(this.getSpectralTransmittanceTarget(group).texture.id);
    }

    for (let i = 0; i < shadowLightCount; i++) {
      pushVector(values, material.frameShadowLights.array[i]);
    }

    const jittered = this.froxelUniforms.frameJitter.value >= 0.0;
    const same = !jittered && sameValues(values, this.transmittanceSignature);

    // NOTE A jittered draw matches no signature, so the first frame after jitter is turned off draws again
    if (jittered) {
      values.length = 0;
    }

    this.nextTransmittanceSignature = this.transmittanceSignature;
    this.transmittanceSignature = values;

    return same;
  }

  // NOTE Extinction of all casters in the world shadow grid cascades. Returns false with no casters.
  // NOTE onlyLast: only the last cascade (all volumes), drawn only when castVersion changed.
  // NOTE Volume shadows on meshes read only the last cascade. 'frame' lighting needs all cascades.
  renderShadowDensity(renderer, camera, casters, onlyLast = false) {
    const ready = casters.length > 0 && this.updateGrid(casters, camera);
    const castChanged = this.updateGridVersion(ready ? casters : []);

    if (!ready) {
      return false;
    }

    if (onlyLast && !castChanged) {
      return true;
    }

    if (!onlyLast && this.shadowDrawnVersion === this.gridVersion && this.shadowDrawnTarget === this.shadowDensityTarget) {
      return true;
    }

    // NOTE The clear below empties every cascade, so a draw of the last one alone leaves no full grid to keep
    this.shadowDrawnVersion = onlyLast ? -1 : this.gridVersion;
    this.shadowDrawnTarget = this.shadowDensityTarget;

    const count = this.gridUniforms.frameGridCount.value;
    const cascadeCasters = getCascadeCasters(casters, onlyLast ? count - 1 : 0, count, this.cascadeCasterPool);

    this.updatePool(
      this.shadowPool,
      this.shadowScene,
      this.shadowDensityMaterial,
      cascadeCasters,
      camera,
      this.setupShadowEntry,
    );

    renderer.setRenderTarget(this.shadowDensityTarget);
    renderer.clear(true, false, false);
    renderer.render(this.shadowScene, camera);

    return true;
  }

  // NOTE gridVersion changes when the cascades, a caster transform, a caster grid or a caster shadow prop change.
  // NOTE castVersion changes only for the last cascade. Returns true when castVersion changed. Arrays are reused.
  updateGridVersion(casters) {
    const { frameGridMin, frameGridSize, frameGridCount, frameGridResolution } = this.gridUniforms;

    return updateGridSignatures(
      this,
      casters,
      frameGridCount.value,
      frameGridResolution.value,
      this.isSpectral(),
      frameGridMin.array,
      frameGridSize.array,
      pushCasterMaps,
    );
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

  // NOTE Pool entries are reused between frames. Unused entries are hidden.
  // All entries share one material. Each entry sets the volume uniforms before its draw.
  updatePool(pool, scene, material, items, camera, setup) {
    let used = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!pool[used]) {
        const geometry = new Three.InstancedBufferGeometry();
        geometry.setAttribute('position', tileQuadPosition);

        const mesh = new Three.Mesh(geometry, material);
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;

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

        scene.add(mesh);
        pool[used] = entry;
      }

      const entry = pool[used];

      if (setup(entry, item, camera)) {
        entry.mesh.visible = true;
        entry.mesh.layers.mask = camera.layers.mask;
        used++;
      }
    }

    for (let i = used; i < pool.length; i++) {
      pool[i].mesh.visible = false;
    }
  }

  // NOTE Screen rectangle of the volume in froxel cells. Writes target (Vector4). Returns false when it covers no cell.
  getFroxelRect(volume, camera, target) {
    const { x: width, y: height } = this.froxelUniforms.froxelGrid.value;

    return getFroxelRect(volume, camera, width, height, target);
  }

  getCascadeCount() {
    return Math.min(frameMaxShadowCascades, Math.max(1, Math.round(this.settings.shadowCascades)));
  }

  // NOTE Shadow grid cascades of the casters (core/frameGrid.js). Returns false with no casters.
  updateGrid(casters, camera) {
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount, frameGridResolution } = this.gridUniforms;
    const count = updateGridCascades(
      casters,
      camera,
      this.settings.shadowDistance,
      frameGridResolution.value,
      this.getCascadeCount(),
      frameGridMin.array,
      frameGridSize.array,
      frameGridVoxel.array,
    );

    if (count > 0) {
      frameGridCount.value = count;
    }

    return count > 0;
  }

  // NOTE Voxel rectangle and atlas slices of the volume in one shadow grid cascade
  getGridRange(volume, cascade) {
    const { frameGridMin, frameGridVoxel, frameGridResolution } = this.gridUniforms;
    const found = getGridRange(
      volume,
      cascade,
      frameGridResolution.value,
      frameGridMin.array,
      frameGridVoxel.array,
      this.gridRange,
    );

    return found ? this.gridRange : null;
  }

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
      frameEnvironmentCount,
      frameEnvironmentDirections,
      frameEnvironmentColors,
      frameEnvironmentUnshadowed,
    } = this.lightUniforms;
    const state = this.lightState;
    const { directions, points, spots } = state;

    state.camera = camera;
    state.hemiCount = 0;
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

    // NOTE Environment lights. 'volume' lighting marches all of them in each volume.
    const { environment } = this;
    const environmentCount = environment ? environment.count : 0;

    frameEnvironmentCount.value = environmentCount;

    for (let i = 0; i < environmentCount; i++) {
      frameEnvironmentDirections.array[i].fromArray(environment.directions[i]);
      frameEnvironmentColors.array[i].fromArray(environment.colors[i]);
    }

    // NOTE 'frame' lighting. Scene lights take the first shadow slots.
    // NOTE The dominant 'directional' environment light (light 0) takes the next free slot. Other environment lights go to the environment grid.
    const sceneShadowCount = Math.min(count, frameShadowLightSlots);
    const shadowLights = this.transmittanceMaterial.frameShadowLights.array;
    const frameLighting = this.isFrameLighting() && environmentCount > 0;
    const environmentLightCount =
      frameLighting &&
      environment.mode === frameEnvironmentModes.directional &&
      sceneShadowCount < frameShadowLightSlots &&
      // NOTE Diffusion: all environment lights use the environment grid. Then both lights of an opposite pair get the same march.
      !isFrameDiffusion(this.settings.multipleScattering)
        ? 1
        : 0;
    const result = this.lightResult;
    const environmentGridLights = result.environmentGridLights;

    environmentGridLights.length = 0;

    for (let i = 0; i < sceneShadowCount; i++) {
      shadowLights[i].copy(this.getSortedLight(i).position);
    }

    if (environmentLightCount > 0) {
      shadowLights[sceneShadowCount].fromArray(environment.directions[0]).setW(1.0);
    }

    frameEnvironmentUnshadowed.value.set(0.0, 0.0, 0.0);

    if (frameLighting) {
      for (let i = environmentLightCount; i < environmentCount; i++) {
        const entries = this.environmentGridLightEntries;
        const index = environmentGridLights.length;

        if (index === entries.length) {
          entries.push({ direction: null, color: null });
        }

        entries[index].direction = environment.directions[i];
        entries[index].color = environment.colors[i];
        environmentGridLights.push(entries[index]);
        frameEnvironmentUnshadowed.value.add(frameEnvironmentColors.array[i]);
      }
    }

    frameEnvironmentUnshadowed.value.max(vector3.set(0.0, 0.0, 0.0));

    result.shadowLightCount = sceneShadowCount + environmentLightCount;
    result.environmentLightCount = environmentLightCount;
    result.environmentShadowSlot = sceneShadowCount;

    return result;
  }

  dispose() {
    this.volumeShadows.dispose();
    this.historyTargets.forEach((target) => target && target.dispose());
    this.historyTargets = [null, null];
    this.historyValid = false;

    [
      'atlasTarget',
      'densityTarget',
      'shadowDensityTarget',
      'transmittanceTarget',
      'environmentMapTarget',
      'environmentGridTarget',
    ].forEach((key) => {
      if (this[key]) {
        this[key].dispose();
        this[key] = null;
      }
    });

    this.spectralTransmittanceTargets.forEach((target) => target.dispose());
    this.spectralTransmittanceTargets = [];
    this.gridMipTargets.forEach((target) => target.dispose());
    this.gridMipTargets = [];
    this.gridMipSignature = [];

    this.environmentLights = new FrameEnvironmentLights((renderer, scene) =>
      this.renderEnvironmentMap(renderer, scene),
    );
    this.environment = null;
    this.environmentGridSignature = [];

    [...this.densityPool, ...this.shadowPool].forEach(({ mesh, geometry }) => {
      mesh.parent.remove(mesh);
      geometry.dispose();
    });

    this.densityPool = [];
    this.shadowPool = [];

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

    this.cachedFrame = -1;
    this.cachedCamera = null;
  }
}

export const frameRenderer = new FrameRenderer();

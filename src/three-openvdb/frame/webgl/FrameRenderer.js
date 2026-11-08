import * as Three from 'three';
import { FrameInjectMaterial } from './FrameInjectMaterial.js';
import { FrameIntegrateMaterial, FrameIntegrateTransmittanceMaterial } from './FrameIntegrateMaterial.js';
import { FrameDensityMaterial, frameDensityEnvironment } from './FrameDensityMaterial.js';
import { FrameShadowDensityMaterial } from './FrameShadowDensityMaterial.js';
import { FrameTransmittanceMaterial, frameShadowLightSlots } from './FrameTransmittanceMaterial.js';
import { FrameGridMipMaterial } from './FrameGridMipMaterial.js';
import { FrameLightingMaterial } from './FrameLightingMaterial.js';
import { FrameTemporalMaterial } from './FrameTemporalMaterial.js';
import { FrameVolumeShadows } from './FrameVolumeShadows.js';
import { FrameEnvironmentMapMaterial } from './FrameEnvironmentMapMaterial.js';
import { FrameEnvironmentGridMaterial } from './FrameEnvironmentGridMaterial.js';
import {
  setVolumeUniforms,
  frameMaxShadowCascades,
  createEnvironmentUniforms,
  createEnvironmentGridUniforms,
} from './frameShaderChunks.js';
import {
  getFramePhase,
  getFramePhaseSpectrum,
  getFrameMultipleScattering,
  getFrameScatteringOctaves,
  getFrameTwoSidedDiffusion,
  isFrameDiffusion,
} from '../core/framePhase.js';
import { getAtlasLayout, getFroxelSize } from '../core/frameLayout.js';
import { frameNeuralLevels } from '../core/frameNeuralIndirect.js';
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
import { getFrameExtinctionSpectrum, getFrameSpectralGroups } from '../core/frameSpectrum.js';
import {
  FrameEnvironmentLights,
  frameEnvironmentModes,
  frameEnvironmentMapWidth,
  frameEnvironmentMapHeight,
} from '../core/frameEnvironment.js';

const textureKeys = ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'];

const viewport = new Three.Vector4();
const clearColor = new Three.Color();
const vector3 = new Three.Vector3();
const lightPosition = new Three.Vector3();
const lightTarget = new Three.Vector3();
const froxelSize = { width: 1, height: 1 };

// NOTE A texture and its version in a signature. A missing texture is null, -1.
const pushMap = (values, map) => {
  values.push(map ?? null, map ? map.version : -1);
};

// NOTE The shadow density pass reads the extinction and the albedo. Mipmaps are made on the textures, so their
// versions follow them.
const pushCasterMaps = (values, volume) => {
  values.push(
    volume.densityMap3D ? volume.densityMap3D.id : -1,
    volume.densityMap3D ? volume.densityMap3D.version : -1,
    volume.maskMap3D ? volume.maskMap3D.id : -1,
    volume.maskMap3D ? volume.maskMap3D.version : -1,
    volume.baseColorMap3D ? volume.baseColorMap3D.id : -1,
    volume.baseColorMap3D ? volume.baseColorMap3D.version : -1,
  );
};

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

const tileQuadPosition = new Three.Float32BufferAttribute(
  [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0],
  3,
);

const createRenderTarget = (width, height, options = {}) => {
  return new Three.WebGLRenderTarget(width, height, {
    type: Three.HalfFloatType,
    format: Three.RGBAFormat,
    minFilter: Three.LinearFilter,
    magFilter: Three.LinearFilter,
    generateMipmaps: false,
    depthBuffer: false,
    ...options,
  });
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

const extinctionSpectrum = new Three.Vector3();


// NOTE Instanced tile quads: one instance for each slice
const createTileGeometry = () => {
  const geometry = new Three.InstancedBufferGeometry();
  geometry.instanceCount = 0;
  geometry.setAttribute('position', tileQuadPosition);

  return geometry;
};

// NOTE A quad. The integrate materials put it on the screen rectangle of the froxel area.
const createQuadGeometry = () => {
  const geometry = new Three.BufferGeometry();
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

const createScene = () => {
  const scene = new Three.Scene();
  scene.matrixWorldAutoUpdate = false;

  return scene;
};

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

  // NOTE Canvas and drawing buffer sizes that settings.pixelsPerFroxel holds (core/frameLayout.js getFroxelSize)
  froxelHeldSize = { canvasX: 0, canvasY: 0, bufferX: 0, bufferY: 0 };
  froxelUniforms = {
    froxelGrid: { value: new Three.Vector3(1.0, 1.0, 1.0) },
    froxelColumns: { value: 1.0 },
    froxelRange: { value: new Three.Vector2(0.1, 1.0) },
    froxelProjectionInverse: { value: new Three.Matrix4() },
    froxelSubSteps: { value: 6 },
    frameJitter: { value: 0.5 },
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
  froxelArea = { rect: new Three.Vector4(), first: 0, count: 0 };
  areaGeometry = createTileGeometry();

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
    frameJitter: this.froxelUniforms.frameJitter,
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
    ...this.environmentUniforms,
  });
  volumeShadows = new FrameVolumeShadows(this);
  depthMaterial = new Three.MeshBasicMaterial({ colorWrite: false, side: Three.DoubleSide });

  // NOTE The light scene holds the light copies. It draws the volume inject pass or the frame lighting pass.
  injectScene = createScene();
  injectMesh = new Three.Mesh(createTileGeometry(), this.injectMaterial);
  lightingMesh = new Three.Mesh(this.areaGeometry, this.lightingMaterial);
  lightProxies = {};

  densityScene = createScene();
  densityPool = [];

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

  temporalMaterial = new FrameTemporalMaterial({
    ...this.froxelUniforms,
    ...this.froxelTileUniforms,
    ...this.froxelAreaUniforms,
  });
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
  environmentGridMaterial = new FrameEnvironmentGridMaterial({
    ...this.gridUniforms,
    ...this.environmentUniforms,
    ...this.environmentGridUniforms,
  });
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
  depthTarget = null;

  // NOTE World shadow grid for volume shadows, made before the first lit mesh. 'frame' lighting uses it again.
  // NOTE gridVersion changes when the grid content changes, castVersion when the last cascade (all volumes) changes.
  gridFrame = -1;
  gridCamera = null;
  gridReady = false;
  gridFreshCamera = null;
  gridVersion = 0;
  gridSignature = [];
  nextGridSignature = [];
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

  cachedFrame = -1;
  cachedCamera = null;
  rendererWarned = false;

  // NOTE Results of collectVolumes, getSliceRange, getGridRange and the cascade casters. They are used again in the next call.
  viewCollector = new FrameVolumeCollector();
  gridCollector = new FrameVolumeCollector();
  sliceRange = { first: 0, count: 0 };
  gridRange = { rect: new Three.Vector4(), first: 0, count: 0 };
  cascadeCasterPool = { items: [], entries: [] };
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
  };
  environmentShadowLight = new Three.Vector4();
  environmentGridLightEntries = [];

  constructor() {
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

    // NOTE Override passes (depth, normals) of other effects must not draw or start the frame
    if (scene.overrideMaterial) {
      proxy.geometry.setDrawRange(0, 0);

      return;
    }

    if (frame === this.cachedFrame && camera === this.cachedCamera) {
      proxy.geometry.setDrawRange(0, 0);

      return;
    }

    this.volumeShadows.update(renderer, scene);

    const { volumes, casters } = this.collectVolumes(scene, camera);

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

  // NOTE FrameVolume mipmaps can change after creation. The textures are uploaded again.
  updateMipmaps = (frameVolume, volume) => {
    for (let i = 0; i < textureKeys.length; i++) {
      const texture = volume[textureKeys[i]];

      if (texture && texture.generateMipmaps !== frameVolume.mipmaps) {
        this.configureTexture(texture, frameVolume.mipmaps);
        texture.needsUpdate = true;
      }
    }
  };

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
    pushVector(signature, frameGridMin.value[cascade]);
    pushVector(signature, frameGridSize.value[cascade]);

    for (let i = 0; i < gridLights.length; i++) {
      pushElements(signature, gridLights[i].direction);
      pushElements(signature, gridLights[i].color);
    }

    for (let i = 0; i < casters.length; i++) {
      const { frameVolume, volume } = casters[i];

      pushMap(signature, volume.densityMap3D);
      pushMap(signature, volume.maskMap3D);
      pushMap(signature, volume.baseColorMap3D);

      signature.push(frameVolume.extinction);
      pushVector(signature, getFrameExtinctionSpectrum(frameVolume, extinctionSpectrum));
      signature.push(frameVolume.getDensityScale(), frameVolume.densityCutoff, frameVolume.absorbance);
      pushColor(signature, frameVolume.baseColor);
      signature.push(frameVolume.wrap3D, frameVolume.mipmaps);
      pushVector(signature, frameVolume.offset3D);
      pushElements(signature, volume.matrixWorld.elements);
    }

    if (sameValues(signature, previous)) {
      return;
    }

    this.environmentGridSignature = signature;
    this.nextEnvironmentGridSignature = previous;

    const { uniforms } = this.environmentGridMaterial;

    uniforms.frameShadowDensityMap.value = this.shadowDensityTarget.textures[0];
    uniforms.frameShadowAbsorptionMap.value = this.shadowDensityTarget.textures.at(-1);
    uniforms.frameLightCount.value = gridLights.length;
    uniforms.frameMultipleScattering.value = multipleScattering;
    uniforms.frameScatteringOctaves.value.copy(scatteringOctaves);

    for (let i = 0; i < gridLights.length; i++) {
      uniforms.frameLightDirections.value[i].fromArray(gridLights[i].direction);
      uniforms.frameLightColors.value[i].fromArray(gridLights[i].color);
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
    // NOTE The world shadow grid is used by 'frame' lighting and by volume shadows on meshes
    const useGrid = this.isFrameLighting() || this.settings.castShadows;
    const result = collector.collect(scene, camera, this.settings, useGrid, this.updateMipmaps);

    if (result.volumes.length > 0) {
      this.froxelUniforms.froxelRange.value.set(result.near, result.far);
    }

    return result;
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
        target = createRenderTarget(layout.width, layout.height, { format: Three.RGFormat });
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
      const { maxTextureSize } = renderer.capabilities;

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
    this.integrateMaterial.uniforms.froxelAtlas.value = this.atlasTarget.textures[0];
    this.integrateMaterial.uniforms.froxelAlphaAtlas.value = this.atlasTarget.textures.at(-1);

    if (this.settings.temporal) {
      this.historyTargets.forEach((target, index) => {
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
      });
    }
    this.integrateMaterial.uniforms.froxelAtlasSize.value.set(
      froxelAtlas.width,
      froxelAtlas.height,
    );

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
      }

      this.updateGridTargets();
    }

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

      this.castSignature = [];
      // NOTE A new target is empty, so the environment grid is drawn again
      this.environmentGridSignature = [];
    }

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
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const currentShadowNeedsUpdate = renderer.shadowMap.needsUpdate;

    renderer.getClearColor(clearColor);

    // NOTE null: the environment uses the 'outward' path
    this.environment = this.environmentLights.update(renderer, scene, this.settings);

    this.updateTargets(renderer);
    this.updateFroxelArea(volumes, camera);

    this.froxelUniforms.froxelProjectionInverse.value.copy(camera.projectionMatrixInverse);
    this.integrateMaterial.uniforms.frameCameraNear.value = camera.near;
    this.integrateMaterial.uniforms.frameCameraFar.value = camera.far;

    // NOTE Shadow maps of this frame are ready. Nested renders must not update them again.
    renderer.autoClear = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = false;
    renderer.setClearColor(0x000000, 0.0);

    // NOTE Golden ratio steps give a new, evenly spread jitter value for each frame
    this.froxelUniforms.frameJitter.value = this.settings.jitter
      ? (this.jitterIndex * 0.618034) % 1.0
      : -1.0;
    this.jitterIndex = (this.jitterIndex + 1) % 1024;

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
  renderDepth(renderer, scene, camera) {
    const hidden = [];

    scene.traverseVisible((object) => {
      if (!object.material) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];

      if (materials.every((material) => material.depthWrite === false)) {
        hidden.push(object);
      }
    });

    hidden.forEach((object) => {
      object.visible = false;
    });

    const background = scene.background;
    const overrideMaterial = scene.overrideMaterial;

    scene.background = null;
    scene.overrideMaterial = this.depthMaterial;

    renderer.setRenderTarget(this.depthTarget);
    renderer.clear(false, true, false);
    renderer.render(scene, camera);

    scene.overrideMaterial = overrideMaterial;
    scene.background = background;

    hidden.forEach((object) => {
      object.visible = true;
    });
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

    if (useShadows) {
      const transmittanceUniforms = this.transmittanceMaterial.uniforms;

      transmittanceUniforms.frameShadowDensityMap.value = this.shadowDensityTarget.textures[0];
      transmittanceUniforms.frameShadowAbsorptionMap.value = this.shadowDensityTarget.textures.at(-1);
      transmittanceUniforms.frameSkyDirection.value.copy(lights.skyDirection);
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

      if (this.isNeural()) {
        this.gridMipMesh.layers.mask = camera.layers.mask;
        this.renderGridMips(renderer, camera);
      }

      const unchanged = this.transmittanceUnchanged(lights.shadowLights.length, spectral ? spectralGroups : 0);

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

    // NOTE Spectral: sky up and sky down are in the first two targets of group 0
    if (spectral && useShadows) {
      densityShadowUniforms.frameSkyTransmittanceMap0.value = this.getSpectralTransmittanceTarget(0).textures[0];
      densityShadowUniforms.frameSkyTransmittanceMap1.value = this.getSpectralTransmittanceTarget(0).textures[1];
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
      this.createDensityMaterial,
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

      // NOTE Groups not in use get the targets of group 0. The lighting pass does not read them.
      if (useShadows) {
        lightingUniforms.frameSpectralTransmittanceMaps.value.forEach((_, index) => {
          const group = Math.floor(index / 3);
          const target = this.getSpectralTransmittanceTarget(group < spectralGroups ? group : 0);

          lightingUniforms.frameSpectralTransmittanceMaps.value[index] = target.textures[index % 3];
        });
      }
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

  // NOTE Whether the transmittance targets already hold what this render would draw: the same grid content, targets,
  // shadow lights and settings. A jittered grid changes in each frame, so it is always drawn.
  transmittanceUnchanged(shadowLightCount, spectralGroups) {
    const uniforms = this.transmittanceMaterial.uniforms;
    const values = this.nextTransmittanceSignature;

    values.length = 0;
    values.push(
      this.gridVersion,
      this.shadowDensityTarget.texture.id,
      // NOTE Spectral rendering has no single transmittance target, only the targets of its groups below
      this.transmittanceTarget ? this.transmittanceTarget.texture.id : -1,
      spectralGroups,
      shadowLightCount,
      uniforms.frameMultipleScattering.value,
      this.transmittanceMaterial.neural ? 1 : 0,
      uniforms.frameTwoSided.value,
    );
    pushVector(values, uniforms.frameScatteringOctaves.value);
    pushVector(values, uniforms.frameSkyDirection.value);

    for (let group = 0; group < spectralGroups; group++) {
      values.push(this.getSpectralTransmittanceTarget(group).texture.id);
    }

    for (let i = 0; i < shadowLightCount; i++) {
      pushVector(values, uniforms.frameShadowLights.value[i]);
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
      cascadeCasters,
      camera,
      this.setupShadowEntry,
      this.createShadowDensityMaterial,
    );

    renderer.setRenderTarget(this.shadowDensityTarget);
    renderer.clear(true, false, false);
    renderer.render(this.shadowScene, camera);

    return true;
  }

  // NOTE gridVersion changes when the cascades, a caster transform, a caster grid or a caster shadow prop change.
  // NOTE castVersion changes only for the last cascade. Returns true when castVersion changed.
  updateGridVersion(casters) {
    const { frameGridMin, frameGridSize, frameGridCount, frameGridResolution } = this.gridUniforms;

    return updateGridSignatures(
      this,
      casters,
      frameGridCount.value,
      frameGridResolution.value,
      this.isSpectral(),
      frameGridMin.value,
      frameGridSize.value,
      pushCasterMaps,
    );
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

  // NOTE Pool entries are reused between frames. Unused entries are hidden.
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

  createDensityMaterial = () =>
    new FrameDensityMaterial({
      ...this.froxelUniforms,
      ...this.froxelTileUniforms,
      ...this.gridUniforms,
      ...this.densityShadowUniforms,
      ...this.environmentUniforms,
      ...this.environmentGridUniforms,
    });

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

  createShadowDensityMaterial = () =>
    new FrameShadowDensityMaterial({ ...this.gridUniforms, ...this.gridTileUniforms });

  updatePool(pool, scene, items, camera, setup, createMaterial) {
    let used = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!pool[used]) {
        const geometry = new Three.InstancedBufferGeometry();
        geometry.setAttribute('position', tileQuadPosition);

        const material = createMaterial();
        const mesh = new Three.Mesh(geometry, material);
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;

        scene.add(mesh);
        pool[used] = { mesh, material, geometry };
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
      frameGridMin.value,
      frameGridSize.value,
      frameGridVoxel.value,
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
      frameGridMin.value,
      frameGridVoxel.value,
      this.gridRange,
    );

    return found ? this.gridRange : null;
  }

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

    // NOTE Environment lights. 'volume' lighting marches all of them in each volume.
    const { environment } = this;
    const environmentCount = environment ? environment.count : 0;
    const { frameEnvironmentCount, frameEnvironmentDirections, frameEnvironmentColors, frameEnvironmentUnshadowed } =
      this.environmentUniforms;

    frameEnvironmentCount.value = environmentCount;

    for (let i = 0; i < environmentCount; i++) {
      frameEnvironmentDirections.value[i].fromArray(environment.directions[i]);
      frameEnvironmentColors.value[i].fromArray(environment.colors[i]);
    }

    // NOTE 'frame' lighting. Scene lights take the first shadow slots.
    // NOTE The dominant 'directional' environment light (light 0) takes the next free slot. Other environment lights go to the environment grid.
    const result = this.lightResult;
    const { shadowLights, environmentGridLights } = result;

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
    const frameLighting = this.isFrameLighting() && environmentCount > 0;
    const environmentLightCount =
      frameLighting &&
      environment.mode === frameEnvironmentModes.directional &&
      sceneShadowCount < frameShadowLightSlots &&
      // NOTE Diffusion: all environment lights use the environment grid. Then both lights of an opposite pair get the same march.
      !isFrameDiffusion(this.settings.multipleScattering)
        ? 1
        : 0;

    if (environmentLightCount > 0) {
      shadowLights.push(this.environmentShadowLight.fromArray(environment.directions[0]).setW(1.0));
    }

    environmentGridLights.length = 0;
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
        frameEnvironmentUnshadowed.value.add(frameEnvironmentColors.value[i]);
      }
    }

    frameEnvironmentUnshadowed.value.max(vector3.set(0.0, 0.0, 0.0));

    result.skyDirection.copy(skyDirection).normalize();
    result.pointOffset = directions.length;
    result.spotOffset = directions.length + points.length;
    result.environmentLightCount = environmentLightCount;
    result.environmentShadowSlot = sceneShadowCount;

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

    if (this.depthTarget) {
      this.depthTarget.depthTexture.dispose();
      this.depthTarget.dispose();
      this.depthTarget = null;
    }

    [...this.densityPool, ...this.shadowPool].forEach(({ mesh, material, geometry }) => {
      mesh.parent.remove(mesh);
      material.dispose();
      geometry.dispose();
    });

    this.densityPool = [];
    this.shadowPool = [];

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

    this.cachedFrame = -1;
    this.cachedCamera = null;
  }
}

export const frameRenderer = new FrameRenderer();

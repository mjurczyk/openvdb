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
  createLightUniforms,
  frameFullscreenVertex,
} from './frameShaderChunks.js';
import { getFramePhase, getFrameMultipleScattering, getFrameScatteringOctaves } from '../core/framePhase.js';
import {
  getFrameExtinctionSpectrum,
  getFrameSpectralGroups,
} from '../core/frameSpectrum.js';
import {
  FrameEnvironmentLights,
  frameEnvironmentModes,
  frameEnvironmentMapWidth,
  frameEnvironmentMapHeight,
} from '../core/frameEnvironment.js';

const unitBox = new Three.Box3(
  new Three.Vector3(-0.5, -0.5, -0.5),
  new Three.Vector3(0.5, 0.5, 0.5),
);
const viewBox = new Three.Box3();
const casterBox = new Three.Box3();
const cascadeBox = new Three.Box3();
const frustum = new Three.Frustum();
const projectionScreenMatrix = new Three.Matrix4();
const clipMatrix = new Three.Matrix4();
const corner = new Three.Vector4();
const clearColor = new Three.Color();
const vector3 = new Three.Vector3();
const lightPosition = new Three.Vector3();
const lightTarget = new Three.Vector3();
const lightColor = new Three.Color();
const extinctionSpectrum = new Three.Vector3();


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

const getAtlasLayout = (tileWidth, tileHeight, tileCount) => {
  const columns = Math.ceil(Math.sqrt((tileCount * tileHeight) / tileWidth));
  const rows = Math.ceil(tileCount / columns);

  return { columns, width: tileWidth * columns, height: tileHeight * rows };
};

export class FrameRenderer {
  settings = {
    width: 512,
    height: 512,
    depth: 24,
    subSteps: 32,
    near: 0.1,
    far: Infinity,
    jitter: false,
    temporal: true,
    temporalBlend: 0.2,
    lighting: 'frame',
    shadowResolution: 64,
    shadowCascades: 3,
    shadowDistance: 512,
    // NOTE Phase of all volumes with 'frame' lighting. 'volume' lighting uses the phase of each FrameVolume.
    phase: 'henyey-greenstein',
    phaseG: 0.8,
    phaseBackG: -0.3,
    phaseBackWeight: 0.2,
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
    // NOTE Multiple scattering in the shadows of all lights (core/framePhase.js). true: diffusion approximation.
    // 'octaves': indirect light octaves (experimental). false: single scattering.
    multipleScattering: true,
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
  froxelTileUniforms = createTileUniforms();
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
  injectMesh = new Three.Mesh(createFullscreenGeometry(), this.injectMaterial);
  lightingMesh = new Three.Mesh(createFullscreenGeometry(), this.lightingMaterial);

  densityScene = createScene();
  densityPool = [];

  // NOTE three.js clears MRT attachments after the first one to alpha 1. The density pass adds to all alpha values.
  // NOTE This pass clears all four attachments to 0.
  densityClearMaterial = new Three.NodeMaterial();
  densityClearScene = createScene();
  densityClearMesh = new Three.Mesh(createFullscreenGeometry(), this.densityClearMaterial);

  shadowScene = createScene();
  shadowPool = [];

  transmittanceScene = createScene();
  transmittanceMesh = new Three.Mesh(createFullscreenGeometry(), this.transmittanceMaterial);

  temporalMaterial = new FrameTemporalMaterial(this);
  temporalScene = createScene();
  temporalMesh = new Three.Mesh(createFullscreenGeometry(), this.temporalMaterial);
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

  // NOTE collectVolumes result of the current render. The grid pass and the proxy use it.
  collected = { renderId: -1, camera: null, scene: null, result: null };

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

    this.densityClearMaterial.vertexNode = frameFullscreenVertex;
    this.densityClearMaterial.fragmentNode = outputStruct(vec4(0.0), vec4(0.0), vec4(0.0), vec4(0.0));
    this.densityClearMaterial.depthTest = false;
    this.densityClearMaterial.depthWrite = false;
    this.densityClearMaterial.blending = Three.NoBlending;
    this.densityClearScene.add(this.densityClearMesh);

    this.injectScene.add(this.injectMesh, this.lightingMesh);
    this.transmittanceScene.add(this.transmittanceMesh);
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
  createProxyGeometry() {
    return createFullscreenGeometry();
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
      ...scatteringOctaves.toArray(),
      ...frameGridMin.array[cascade].toArray(),
      ...frameGridSize.array[cascade].toArray(),
    );

    gridLights.forEach(({ direction, color }) => signature.push(...direction, ...color));

    casters.forEach(({ frameVolume, volume }) => {
      const mipMaps = frameVolume.mipmaps ? volume.mipMaps : null;

      [
        volume.densityMap3D,
        volume.maskMap3D,
        volume.baseColorMap3D,
        mipMaps?.densityMap3D?.texture,
        mipMaps?.maskMap3D?.texture,
        mipMaps?.baseColorMap3D?.texture,
      ].forEach((map) => signature.push(map, map ? map.version : -1));

      signature.push(
        frameVolume.extinction,
        ...getFrameExtinctionSpectrum(frameVolume, extinctionSpectrum).toArray(),
        frameVolume.densityScale,
        frameVolume.densityCutoff,
        frameVolume.absorbance,
        ...frameVolume.baseColor.toArray(),
        frameVolume.wrap3D,
        ...frameVolume.offset3D.toArray(),
        ...volume.matrixWorld.elements,
      );
    });

    if (
      signature.length === previous.length &&
      signature.every((value, index) => value === previous[index])
    ) {
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

    gridLights.forEach(({ direction, color }, index) => {
      material.frameLightDirections.array[index].fromArray(direction);
      material.frameLightColors.array[index].fromArray(color);
    });

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
    collected.result = this.findVolumes(scene, camera);

    return collected.result;
  }

  findVolumes(scene, camera) {
    const { settings } = this;
    const volumes = [];
    const casters = [];
    const useGrid = this.usesShadowGrid();

    projectionScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projectionScreenMatrix);

    let near = Infinity;
    let far = 0.0;

    scene.traverseVisible((object) => {
      if (!object.isFrameVolume || !object.proxy.layers.test(camera.layers)) {
        return;
      }

      // NOTE Mipmaps are built after the conversion. Progressive textures change in each step.
      const converting = !!(object.source ?? object).process;

      object.volumes.forEach((volume) => {
        if (!volume.ready) {
          return;
        }

        if (object.mipmaps && !converting) {
          updateVolumeMipmaps(volume);
        }

        volume.matrixWorld.multiplyMatrices(object.matrixWorld, volume.matrix);
        volume.worldToLocal.copy(volume.matrixWorld).invert();
        volume.worldBox.copy(unitBox).applyMatrix4(volume.matrixWorld);

        // NOTE Volumes out of the view can still cast shadows on visible volumes
        if (useGrid) {
          casters.push({ frameVolume: object, volume });
        }

        if (!frustum.intersectsBox(volume.worldBox)) {
          return;
        }

        volume.localToView.multiplyMatrices(camera.matrixWorldInverse, volume.matrixWorld);
        volume.viewToLocal.copy(volume.localToView).invert();
        viewBox.copy(unitBox).applyMatrix4(volume.localToView);

        volume.viewNear = -viewBox.max.z;
        volume.viewFar = -viewBox.min.z;

        near = Math.min(near, volume.viewNear);
        far = Math.max(far, volume.viewFar);

        volumes.push({ frameVolume: object, volume });
      });
    });

    // NOTE Fit the slices to the visible volumes. Then no slices are used for empty space.
    near = Math.max(near, settings.near, camera.near);
    far = Math.min(far, settings.far, camera.far);

    if (volumes.length === 0 || far <= near) {
      // NOTE Volumes out of the view still cast shadows on meshes
      this.updateMipmapFlags(casters);

      return { volumes: [], casters };
    }

    this.froxelUniforms.froxelRange.value.set(near, Math.max(far, near * 1.0001));

    this.updateMipmapFlags([...volumes, ...casters]);

    return { volumes, casters };
  }

  updateMipmapFlags(items) {
    const mipmaps = items.some(({ frameVolume }) => frameVolume.mipmaps);

    [this.densityMaterial, this.shadowDensityMaterial, this.injectMaterial].forEach((material) =>
      material.setMipmaps(mipmaps),
    );
  }

  // NOTE The world shadow grid is used by 'frame' lighting and by volume shadows on meshes
  usesShadowGrid() {
    return this.isFrameLighting() || this.settings.castShadows;
  }

  isSpectral() {
    return this.settings.spectral === true;
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

  getSlice(viewDepth) {
    const range = this.froxelUniforms.froxelRange.value;
    const depth = this.froxelUniforms.froxelGrid.value.z;

    return (depth * Math.log(Math.max(viewDepth, range.x) / range.x)) / Math.log(range.y / range.x);
  }

  getSliceRange(volume) {
    const depth = this.froxelUniforms.froxelGrid.value.z;
    const first = Math.max(0, Math.floor(this.getSlice(volume.viewNear)));
    const last = Math.min(depth - 1, Math.ceil(this.getSlice(volume.viewFar)));

    return { first, count: last - first + 1 };
  }

  updateTargets(renderer) {
    const { width, height, depth, subSteps } = this.settings;
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

    this.froxelUniforms.froxelProjectionInverse.value.copy(camera.projectionMatrixInverse);
    this.integrateMaterial.frameCameraNear.value = camera.near;
    this.integrateMaterial.frameCameraFar.value = camera.far;
    this.integrateMaterial.frameCameraOrthographic.value = camera.isOrthographicCamera ? 1 : 0;
    this.integrateMaterial.setSrgbBlending(
      this.settings.srgbBlending && renderer.outputColorSpace === Three.SRGBColorSpace,
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

    renderer.setRenderTarget(writeTarget);
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
    const { atlasTarget, injectScene } = this;
    const { froxelGrid, froxelColumns } = this.froxelUniforms;
    const { injectMaterial } = this;

    this.prepareLightScene(scene, camera, this.injectMesh);

    injectMaterial.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    injectMaterial.setEnvironment(scene.environment);

    renderer.setRenderTarget(atlasTarget);
    renderer.clear(true, false, false);

    const columns = froxelColumns.value;
    const sliceHeight = froxelGrid.value.y;

    volumes.forEach(({ frameVolume, volume }) => {
      setVolumeUniforms(injectMaterial.volumeUniforms, frameVolume, volume);
      injectMaterial.frameLights.value = frameVolume.lights;
      injectMaterial.frameShadowSteps.value = frameVolume.shadowSteps;
      injectMaterial.frameMultipleScattering.value = getFrameMultipleScattering(
        this.settings.multipleScattering,
        frameVolume,
      );
      getFrameScatteringOctaves(this.settings, injectMaterial.frameScatteringOctaves.value);

      // NOTE Draw only the atlas rows that contain the slices of this volume.
      // Scissor y starts at the top of the target.
      const { first, count } = this.getSliceRange(volume);
      const firstRow = Math.floor(first / columns);
      const lastRow = Math.floor((first + count - 1) / columns);
      const scissorHeight = (lastRow - firstRow + 1) * sliceHeight;

      atlasTarget.scissor.set(
        0,
        atlasTarget.height - firstRow * sliceHeight - scissorHeight,
        atlasTarget.width,
        scissorHeight,
      );

      renderer.setScissorTest(true);
      renderer.setRenderTarget(atlasTarget);
      renderer.render(injectScene, camera);
    });

    renderer.setScissorTest(false);
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
      this.transmittanceMesh.layers.mask = camera.layers.mask;

      if (spectral) {
        // NOTE One pass for each slot group in use, each into its own targets
        for (let group = 0; group < spectralGroups; group++) {
          this.transmittanceMaterial.frameSpectralGroup.value = group;

          renderer.setRenderTarget(this.getSpectralTransmittanceTarget(group));
          renderer.render(this.transmittanceScene, camera);
        }
      } else {
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
    getFrameScatteringOctaves(this.settings, densityShadowUniforms.frameScatteringOctaves.value);
    densityShadowUniforms.frameEnvironmentGridMap.value = this.environmentGridTarget.texture;
    densityShadowUniforms.frameEnvironmentMode.value = useEnvironmentGrid
      ? frameDensityEnvironment.grid
      : useShadows && lights.environmentLightCount > 0
        ? frameDensityEnvironment.none
        : frameDensityEnvironment.outward;
    densityShadowUniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);

    // NOTE Spectral: sky up and sky down are in the first two targets of group 0
    if (spectral && useShadows) {
      densityShadowUniforms.frameSkyTransmittanceMaps.forEach((map, index) => {
        map.value = this.getSpectralTransmittanceTarget(0).textures[index];
      });
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
      (entry, { frameVolume, volume }) => {
        const rect = this.getFroxelRect(volume, camera);

        if (!rect) {
          return false;
        }

        const { first, count } = this.getSliceRange(volume);

        entry.frameVolume = frameVolume;
        entry.volume = volume;
        entry.rect.copy(rect);
        entry.sliceStart = first;
        entry.geometry.instanceCount = count;

        return true;
      },
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
        lightingMaterial.frameSpectralTransmittanceMaps.forEach((map, index) => {
          const group = Math.floor(index / 3);
          const target = this.getSpectralTransmittanceTarget(group < spectralGroups ? group : 0);

          map.value = target.textures[index % 3];
        });
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
    getFrameScatteringOctaves(this.settings, lightingMaterial.frameScatteringOctaves.value);

    renderer.setRenderTarget(this.atlasTarget);
    renderer.clear(true, false, false);
    renderer.render(this.injectScene, camera);
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

    const count = this.gridUniforms.frameGridCount.value;
    const cascadeCasters = [];

    for (let cascade = onlyLast ? count - 1 : 0; cascade < count; cascade++) {
      casters.forEach((caster) => cascadeCasters.push({ ...caster, cascade }));
    }

    this.updatePool(
      this.shadowPool,
      this.shadowScene,
      this.shadowDensityMaterial,
      cascadeCasters,
      camera,
      (entry, { frameVolume, volume, cascade }) => {
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
      },
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
    const count = frameGridCount.value;
    const casterValues = this.casterSignature;
    const castValues = this.nextCastSignature;
    const gridValues = this.nextGridSignature;
    const same = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

    casterValues.length = 0;
    casters.forEach(({ frameVolume, volume }) => {
      casterValues.push(...volume.matrixWorld.elements);

      [volume.densityMap3D, volume.maskMap3D, volume.mipMaps?.densityMap3D?.texture].forEach((map) => {
        casterValues.push(map ? map.id : -1, map ? map.version : -1);
      });

      casterValues.push(
        frameVolume.densityScale,
        frameVolume.densityCutoff,
        frameVolume.extinction,
        ...getFrameExtinctionSpectrum(frameVolume, extinctionSpectrum).toArray(),
        frameVolume.absorbance,
        frameVolume.mipmaps ? 1 : 0,
        frameVolume.wrap3D,
        ...frameVolume.offset3D.toArray(),
      );
    });

    // NOTE The cascade count changes the atlas layout, so a new count needs a new draw
    castValues.length = 0;
    castValues.push(casters.length, count, frameGridResolution.value, this.isSpectral() ? 1 : 0);

    if (count > 0) {
      castValues.push(...frameGridMin.array[count - 1].toArray(), ...frameGridSize.array[count - 1].toArray());
    }

    castValues.push(...casterValues);

    gridValues.length = 0;
    gridValues.push(count);

    for (let i = 0; i < count; i++) {
      gridValues.push(...frameGridMin.array[i].toArray(), ...frameGridSize.array[i].toArray());
    }

    gridValues.push(...castValues);

    if (!same(gridValues, this.gridSignature)) {
      this.gridVersion++;
      this.nextGridSignature = this.gridSignature;
      this.gridSignature = gridValues;
    }

    const castChanged = !same(castValues, this.castSignature);

    if (castChanged) {
      this.castVersion++;
      this.nextCastSignature = this.castSignature;
      this.castSignature = castValues;
    }

    return castChanged;
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

  // NOTE Pool entries are reused between frames. Unused entries are hidden.
  // All entries share one material. Each entry sets the volume uniforms before its draw.
  updatePool(pool, scene, material, items, camera, setup) {
    let used = 0;

    items.forEach((item) => {
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

      if (setup(entry, item)) {
        entry.mesh.visible = true;
        entry.mesh.layers.mask = camera.layers.mask;
        used++;
      }
    });

    for (let i = used; i < pool.length; i++) {
      pool[i].mesh.visible = false;
    }
  }

  // NOTE Screen rectangle of the volume in froxel cells, with one cell of padding for the linear filter
  getFroxelRect(volume, camera) {
    const { x: width, y: height } = this.froxelUniforms.froxelGrid.value;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let fullScreen = false;

    clipMatrix.multiplyMatrices(camera.projectionMatrix, volume.localToView);

    for (let i = 0; i < 8 && !fullScreen; i++) {
      corner
        .set(i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, i & 4 ? 0.5 : -0.5, 1.0)
        .applyMatrix4(clipMatrix);

      if (corner.w <= 1e-6) {
        fullScreen = true;
      } else {
        minX = Math.min(minX, corner.x / corner.w);
        minY = Math.min(minY, corner.y / corner.w);
        maxX = Math.max(maxX, corner.x / corner.w);
        maxY = Math.max(maxY, corner.y / corner.w);
      }
    }

    if (fullScreen) {
      return new Three.Vector4(0.0, 0.0, width, height);
    }

    const x0 = Math.max(0, Math.floor((minX * 0.5 + 0.5) * width) - 1);
    const y0 = Math.max(0, Math.floor((minY * 0.5 + 0.5) * height) - 1);
    const x1 = Math.min(width, Math.ceil((maxX * 0.5 + 0.5) * width) + 1);
    const y1 = Math.min(height, Math.ceil((maxY * 0.5 + 0.5) * height) + 1);

    if (x1 <= x0 || y1 <= y0) {
      return null;
    }

    return new Three.Vector4(x0, y0, x1, y1);
  }

  getCascadeCount() {
    return Math.min(frameMaxShadowCascades, Math.max(1, Math.round(this.settings.shadowCascades)));
  }

  // NOTE The last cascade fits all casters. Then far volumes get coarse shadows, not no shadows.
  // Finer cascades are around the camera, in shadowDistance. Each one is half the size of the next.
  // Power-of-two voxels and snapped bounds keep shadows stable when the camera moves.
  updateGrid(casters, camera) {
    const resolution = this.gridUniforms.frameGridResolution.value;
    const cascades = this.getCascadeCount();
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount } = this.gridUniforms;

    casterBox.makeEmpty();
    casters.forEach(({ volume }) => casterBox.union(volume.worldBox));

    if (casterBox.isEmpty()) {
      return false;
    }

    vector3.setFromMatrixPosition(camera.matrixWorld);

    const fineHalfSize = Math.min(
      this.settings.shadowDistance,
      0.5 *
        Math.max(
          casterBox.max.x - casterBox.min.x,
          casterBox.max.y - casterBox.min.y,
          casterBox.max.z - casterBox.min.z,
        ),
    );

    let count = 0;

    for (let cascade = 0; cascade < cascades; cascade++) {
      if (cascade === cascades - 1) {
        cascadeBox.copy(casterBox);
      } else {
        const halfSize = fineHalfSize / Math.pow(2.0, cascades - 1 - cascade);

        cascadeBox.min.copy(vector3).subScalar(halfSize);
        cascadeBox.max.copy(vector3).addScalar(halfSize);
        cascadeBox.intersect(casterBox);
      }

      // NOTE A fine cascade that covers all casters is the same as the last cascade
      if (cascadeBox.isEmpty() || (cascade < cascades - 1 && cascadeBox.equals(casterBox))) {
        continue;
      }

      ['x', 'y', 'z'].forEach((axis) => {
        const extent = Math.max(cascadeBox.max[axis] - cascadeBox.min[axis], 1e-6);
        const voxel = Math.pow(2.0, Math.ceil(Math.log2(extent / (resolution - 1))));

        frameGridVoxel.array[count][axis] = voxel;
        frameGridMin.array[count][axis] = Math.floor(cascadeBox.min[axis] / voxel) * voxel;
        frameGridSize.array[count][axis] = voxel * resolution;
      });

      count++;
    }

    frameGridCount.value = count;

    return count > 0;
  }

  // NOTE Voxel rectangle and atlas slices of the volume in one shadow grid cascade
  getGridRange(volume, cascade) {
    const resolution = this.gridUniforms.frameGridResolution.value;
    const gridMin = this.gridUniforms.frameGridMin.array[cascade];
    const voxel = this.gridUniforms.frameGridVoxel.array[cascade];
    const { min, max } = volume.worldBox;

    const toCell = (value, axis, round) => {
      return Math.min(resolution, Math.max(0, round((value - gridMin[axis]) / voxel[axis])));
    };

    const x0 = toCell(min.x, 'x', Math.floor);
    const y0 = toCell(min.y, 'y', Math.floor);
    const z0 = toCell(min.z, 'z', Math.floor);
    const x1 = toCell(max.x, 'x', Math.ceil);
    const y1 = toCell(max.y, 'y', Math.ceil);
    const z1 = toCell(max.z, 'z', Math.ceil);

    if (x1 <= x0 || y1 <= y0 || z1 <= z0) {
      return null;
    }

    return {
      rect: new Three.Vector4(x0, y0, x1, y1),
      first: cascade * resolution + z0,
      count: z1 - z0,
    };
  }

  // NOTE Scene lights into the light uniforms. Node materials in custom passes have no three.js light uniforms.
  // Shadow slots follow the light order: directional, point, spot.
  updateLights(scene, camera) {
    const {
      frameAmbientColor,
      frameLightProbe,
      frameHemiSkyColor,
      frameHemiGroundColor,
      frameSkyDirection,
      frameHemiCount,
      frameHemiSkyColors,
      frameHemiGroundColors,
      frameHemiDirections,
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
    const directions = [];
    let hemiCount = 0;
    const points = [];
    const spots = [];
    let hasSky = false;

    frameAmbientColor.value.setRGB(0.0, 0.0, 0.0);
    frameHemiSkyColor.value.setRGB(0.0, 0.0, 0.0);
    frameHemiGroundColor.value.setRGB(0.0, 0.0, 0.0);
    frameSkyDirection.value.set(0.0, 1.0, 0.0);
    frameLightProbe.array.forEach((coefficient) => coefficient.set(0.0, 0.0, 0.0));

    scene.traverseVisible((light) => {
      if (!light.isLight || !light.layers.test(camera.layers)) {
        return;
      }

      lightColor.copy(light.color).multiplyScalar(light.intensity);
      lightPosition.setFromMatrixPosition(light.matrixWorld);

      if (light.isAmbientLight) {
        frameAmbientColor.value.add(lightColor);
      } else if (light.isHemisphereLight) {
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

        hemiCount++;

        if (!hasSky && lightPosition.lengthSq() > 0.0) {
          frameSkyDirection.value.copy(lightPosition).normalize();
          hasSky = true;
        }
      } else if (light.isLightProbe) {
        light.sh.coefficients.forEach((coefficient, index) => {
          frameLightProbe.array[index].addScaledVector(coefficient, light.intensity);
        });
      } else if (light.isDirectionalLight) {
        lightTarget.setFromMatrixPosition(light.target.matrixWorld);

        directions.push({
          position: new Three.Vector4(...lightPosition.sub(lightTarget).normalize().toArray(), 1.0),
          color: new Three.Vector4(...lightColor.toArray(), 0.0),
          spot: new Three.Vector4(),
          falloff: new Three.Vector2(),
        });
      } else if (light.isSpotLight) {
        lightTarget.setFromMatrixPosition(light.target.matrixWorld);

        spots.push({
          position: new Three.Vector4(...lightPosition.toArray(), 3.0),
          color: new Three.Vector4(
            ...lightColor.toArray(),
            Math.cos(light.angle * (1.0 - light.penumbra)),
          ),
          spot: new Three.Vector4(
            ...lightTarget.subVectors(lightPosition, lightTarget).normalize().toArray(),
            Math.cos(light.angle),
          ),
          falloff: new Three.Vector2(light.distance, light.decay),
        });
      } else if (light.isPointLight) {
        points.push({
          position: new Three.Vector4(...lightPosition.toArray(), 2.0),
          color: new Three.Vector4(...lightColor.toArray(), 0.0),
          spot: new Three.Vector4(),
          falloff: new Three.Vector2(light.distance, light.decay),
        });
      }
    });

    const lights = [...directions, ...points, ...spots];

    if (
      (lights.length > frameMaxLights || hemiCount > frameMaxHemisphereLights) &&
      !this.lightLimitWarned
    ) {
      console.warn(
        `FrameRenderer: too many lights. Only ${frameMaxLights} lights and ${frameMaxHemisphereLights} hemisphere lights (per-volume lighting) are used.`,
      );
      this.lightLimitWarned = true;
    }

    frameHemiCount.value = Math.min(hemiCount, frameMaxHemisphereLights);

    const count = Math.min(lights.length, frameMaxLights);

    for (let i = 0; i < count; i++) {
      frameLightPositions.array[i].copy(lights[i].position);
      frameLightColors.array[i].copy(lights[i].color);
      frameLightSpots.array[i].copy(lights[i].spot);
      frameLightFalloffs.array[i].copy(lights[i].falloff);
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
      sceneShadowCount < frameShadowLightSlots
        ? 1
        : 0;
    const environmentGridLights = [];

    for (let i = 0; i < sceneShadowCount; i++) {
      shadowLights[i].copy(lights[i].position);
    }

    if (environmentLightCount > 0) {
      shadowLights[sceneShadowCount].set(...environment.directions[0], 1.0);
    }

    frameEnvironmentUnshadowed.value.set(0.0, 0.0, 0.0);

    if (frameLighting) {
      for (let i = environmentLightCount; i < environmentCount; i++) {
        environmentGridLights.push({ direction: environment.directions[i], color: environment.colors[i] });
        frameEnvironmentUnshadowed.value.add(frameEnvironmentColors.array[i]);
      }
    }

    frameEnvironmentUnshadowed.value.max(vector3.set(0.0, 0.0, 0.0));

    return {
      shadowLightCount: sceneShadowCount + environmentLightCount,
      environmentLightCount,
      environmentShadowSlot: sceneShadowCount,
      environmentGridLights,
    };
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
      this.densityClearMesh,
      this.environmentMapMesh,
      this.environmentGridMesh,
    ].forEach((mesh) => mesh.geometry.dispose());

    this.cachedFrame = -1;
    this.cachedCamera = null;
  }
}

export const frameRenderer = new FrameRenderer();

import * as Three from 'three';
import { getFrameMultipleScattering, getFrameScatteringOctaves, isFrameDiffusion } from './framePhase.js';
import { getAtlasLayout, getFroxelSize } from './frameLayout.js';
import { getFroxelSliceRange, getFroxelRect } from './frameView.js';
import {
  updateGridCascades,
  getGridRange,
  getCascadeCasters,
  updateGridSignatures,
  pushVector,
  pushColor,
  pushElements,
  sameValues,
} from './frameGrid.js';
import { getFrameExtinctionSpectrum } from './frameSpectrum.js';
import { FrameEnvironmentLights, frameEnvironmentModes } from './frameEnvironment.js';
import { frameMaxShadowCascades, frameShadowLightSlots } from './frameLimits.js';

const vector3 = new Three.Vector3();
const froxelSize = { width: 1, height: 1 };
const extinctionSpectrum = new Three.Vector3();

// NOTE Lighting renders in a row that need fewer spectral groups before the extra group targets are freed
const spectralReleaseRenders = 120;

// NOTE A texture and its version in a signature. A missing texture is null, -1.
const pushMap = (values, map) => {
  values.push(map ?? null, map ? map.version : -1);
};

const pushMapId = (values, map) => {
  values.push(map ? map.id : -1, map ? map.version : -1);
};

// NOTE The shadow density pass reads the extinction and the albedo, so every grid and mip atlas of both.
// NOTE WebGL makes mipmaps in the textures (no mipMaps), so their versions follow them.
const pushCasterMaps = (values, volume) => {
  pushMapId(values, volume.densityMap3D);
  pushMapId(values, volume.maskMap3D);
  pushMapId(values, volume.baseColorMap3D);
  pushMapId(values, volume.mipMaps?.densityMap3D?.texture);
  pushMapId(values, volume.mipMaps?.maskMap3D?.texture);
  pushMapId(values, volume.mipMaps?.baseColorMap3D?.texture);
};

export const tileQuadPosition = new Three.Float32BufferAttribute(
  [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0],
  3,
);

// NOTE Instanced tile quads: one instance for each slice
export const createTileGeometry = () => {
  const geometry = new Three.InstancedBufferGeometry();
  geometry.instanceCount = 0;
  geometry.setAttribute('position', tileQuadPosition);

  return geometry;
};

export const createScene = () => {
  const scene = new Three.Scene();
  scene.matrixWorldAutoUpdate = false;

  return scene;
};

// NOTE Clip rectangle of a froxel cell rectangle, padding cells larger on each side. An empty rectangle stays empty.
const clipRect = { x0: 0, y0: 0, x1: 0, y1: 0 };

export const getClipRect = (rect, width, height, padding) => {
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

const isSpectralTarget = (target) => target.textures.length > 1;

// NOTE CPU side of the frame renderer: settings, targets, grid signatures, environment light slots, pools and dispose.
// NOTE The FrameRenderer of each backend makes the uniforms, materials, scenes and passes, and draws them.
// NOTE Backend hooks: renderTargetClass, getUniforms(material) (the object with the uniforms of a pass material),
// getUniformArray(uniform) (the elements of an array uniform), getMaxTextureSize(renderer).
// NOTE Backend fields: uniforms, materials, meshes, scenes, lightResult, setupShadowEntry and createShadowEntry.
export class FrameRendererBase {
  settings = {
    width: 512,
    height: 512,
    // NOTE N above 0: at most one froxel for each N x N canvas (CSS) pixels, for small screens. 0: no cap.
    pixelsPerFroxel: 0,
    depth: 24,
    subSteps: 32,
    near: 0.1,
    far: Infinity,
    // NOTE View distance where the volume density is 0. Density fades from the camera to it, as FogExp2. Infinity: no fade.
    fadeRadius: Infinity,
    temporal: true,
    temporalBlend: 0.2,
    lighting: 'frame',
    shadowResolution: 64,
    shadowCascades: 1,
    shadowDistance: 512,
    // NOTE Phase of all volumes with 'frame' lighting. 'volume' lighting uses the phase of each FrameVolume.
    phase: 'dual-lobe',
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
    // (1D). 'two-sided': diffusion toward and away from the light (2D). 'octaves': indirect light octaves.
    // 'multi-scale': scattered light of the scene lights from grid mips toward the light, diffusion elsewhere. false: single scattering.
    multipleScattering: 'neural',
    // NOTE Grid mip levels that 'multi-scale' reads toward the light (1 to 6)
    multiScaleLevels: 6,
    scatteringOctaves: 4,
    scatteringOctaveExtinction: 0.5,
    scatteringOctaveContribution: 0.5,
    scatteringOctavePhase: 0.5,
    // NOTE Extinction of each channel (FrameVolume extinctionScale, angstromExponent) and
    // multiple scattering with the albedo of each channel. false: grey extinction, luminance albedo.
    spectral: true,
  };

  // NOTE Canvas and drawing buffer sizes that settings.pixelsPerFroxel holds (core/frameLayout.js getFroxelSize)
  froxelHeldSize = { canvasX: 0, canvasY: 0, bufferX: 0, bufferY: 0 };
  // NOTE Froxel area of the volumes in this frame (core/frameView.js). Passes over the froxel grid draw only it.
  froxelArea = { rect: new Three.Vector4(), first: 0, count: 0 };
  areaGeometry = createTileGeometry();

  densityPool = [];
  shadowPool = [];

  // NOTE multipleScattering 'neural' and 'multi-scale': mips of the last grid cascade, levels 1 and up (FrameGridMipMaterial)
  gridMipTargets = [];
  gridMipSignature = [];

  historyTargets = [null, null];
  historyIndex = 0;
  historyValid = false;
  historyCamera = null;
  previousViewMatrix = new Three.Matrix4();
  previousProjectionMatrix = new Three.Matrix4();
  previousRange = new Three.Vector2(0.1, 1.0);

  // NOTE Environment lights. A small map of the environment is read one time for each environment change.
  environmentLights = new FrameEnvironmentLights((renderer, scene) =>
    this.renderEnvironmentMap(renderer, scene),
  );
  // NOTE A camera with updateProjectionMatrix(). Renderers call it, for example on a coordinate system change.
  environmentMapCamera = new Three.OrthographicCamera(-1.0, 1.0, 1.0, -1.0, 0.0, 1.0);
  environmentMapTarget = null;
  environment = null;

  // NOTE Environment grid: environment lights with no shadow slot, in the last cascade. Drawn only on a change.
  environmentGridTarget = null;
  environmentGridSignature = [];
  nextEnvironmentGridSignature = [];
  environmentGridLightEntries = [];
  scatteringOctaves = new Three.Vector4();

  atlasTarget = null;
  densityTarget = null;
  shadowDensityTarget = null;
  transmittanceTarget = null;
  // NOTE frameRenderer.settings.spectral: 3 transmittance targets for each slot group in use (core/frameSpectrum.js).
  // Made when a group is first used. transmittanceTarget is null.
  spectralTransmittanceTargets = [];
  // NOTE trimSpectralTransmittanceTargets: lighting renders in a row that needed fewer groups, and the most they needed
  spectralLowRenders = 0;
  spectralLowGroups = 0;

  // NOTE World shadow grid for volume shadows, made before the first lit mesh. 'frame' lighting uses it again.
  // NOTE gridVersion changes when the grid content changes.
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

  cachedFrame = -1;
  cachedCamera = null;
  rendererWarned = false;

  // NOTE Results of getSliceRange, getGridRange and the cascade casters. They are used again in the next call.
  sliceRange = { first: 0, count: 0 };
  gridRange = { rect: new Three.Vector4(), first: 0, count: 0 };
  cascadeCasterPool = { items: [], entries: [] };

  // NOTE renderTargetClass: the render target class of the backend
  createRenderTarget(width, height, options = {}) {
    return new this.renderTargetClass(width, height, {
      type: Three.HalfFloatType,
      format: Three.RGBAFormat,
      minFilter: Three.LinearFilter,
      magFilter: Three.LinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
      ...options,
    });
  }

  // NOTE Froxel atlas. Spectral: a second target with the red and blue alpha (and the green alpha in w for blending).
  createAtlasTarget(width, height, spectral) {
    if (!spectral) {
      return this.createRenderTarget(width, height);
    }

    const target = this.createRenderTarget(width, height, { count: 2 });

    target.textures[1].format = Three.RGFormat;

    return target;
  }

  isFrameLighting() {
    return this.settings.lighting === 'frame';
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

  // NOTE multipleScattering 'multi-scale' uses the grid mips only with grey 'frame' lighting. Other cases use diffusion.
  isMultiScale() {
    return this.settings.multipleScattering === 'multi-scale' && !this.isSpectral();
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
    pushVector(signature, this.getUniformArray(frameGridMin)[cascade]);
    pushVector(signature, this.getUniformArray(frameGridSize)[cascade]);

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
      signature.push(frameVolume.getDensityScale(), frameVolume.densityCutoff, frameVolume.absorbance);
      pushColor(signature, frameVolume.baseColor);
      // NOTE The mipmaps flag selects the mip levels that the pass reads. WebGL keeps them in the same textures.
      signature.push(frameVolume.wrap3D, frameVolume.mipmaps);
      pushVector(signature, frameVolume.offset3D);
      pushElements(signature, volume.matrixWorld.elements);
    }

    if (sameValues(signature, previous)) {
      return;
    }

    this.environmentGridSignature = signature;
    this.nextEnvironmentGridSignature = previous;

    const uniforms = this.getUniforms(this.environmentGridMaterial);
    const lightDirections = this.getUniformArray(uniforms.frameLightDirections);
    const lightColors = this.getUniformArray(uniforms.frameLightColors);

    uniforms.frameShadowDensityMap.value = this.shadowDensityTarget.textures[0];
    uniforms.frameShadowAbsorptionMap.value = this.shadowDensityTarget.textures.at(-1);
    uniforms.frameLightCount.value = gridLights.length;
    uniforms.frameMultipleScattering.value = multipleScattering;
    uniforms.frameScatteringOctaves.value.copy(scatteringOctaves);

    for (let i = 0; i < gridLights.length; i++) {
      lightDirections[i].fromArray(gridLights[i].direction);
      lightColors[i].fromArray(gridLights[i].color);
    }

    this.environmentGridMesh.layers.mask = camera.layers.mask;

    renderer.setRenderTarget(this.environmentGridTarget);
    renderer.render(this.environmentGridScene, camera);
  }

  // NOTE The 3 transmittance targets of a spectral slot group, the same size as the shadow grid
  getSpectralTransmittanceTarget(group) {
    const targets = this.spectralTransmittanceTargets;

    while (targets.length <= group) {
      const { width, height } = this.shadowDensityTarget;

      targets.push(this.createRenderTarget(width, height, { count: 3 }));
    }

    return targets[group];
  }

  // NOTE Slices of a volume. Returns this.sliceRange ({ first, count }), used again in the next call.
  getSliceRange(volume) {
    const { froxelRange, froxelGrid } = this.froxelUniforms;

    return getFroxelSliceRange(volume, froxelRange.value, froxelGrid.value.z, this.sliceRange);
  }

  // NOTE Froxel atlas, history and 'frame' lighting targets for the settings and the canvas size
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
      const maxTextureSize = this.getMaxTextureSize(renderer);

      if (froxelAtlas.width > maxTextureSize || froxelAtlas.height > maxTextureSize) {
        console.warn(
          'FrameRenderer: froxel atlas is larger than maxTextureSize. Decrease width, height or depth.',
        );
      }

      if (this.atlasTarget) {
        this.atlasTarget.dispose();
      }

      this.atlasTarget = this.createAtlasTarget(froxelAtlas.width, froxelAtlas.height, spectral);
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

    const integrateUniforms = this.getUniforms(this.integrateMaterial);

    this.froxelUniforms.froxelGrid.value.set(width, height, depth);
    this.froxelUniforms.froxelColumns.value = froxelAtlas.columns;
    this.froxelUniforms.froxelSubSteps.value = Math.max(1, Math.round(subSteps));
    this.froxelTileUniforms.frameTileSize.value.set(width, height);
    this.froxelTileUniforms.frameTileColumns.value = froxelAtlas.columns;
    this.froxelTileUniforms.frameTargetSize.value.set(froxelAtlas.width, froxelAtlas.height);
    integrateUniforms.froxelAtlas.value = this.atlasTarget.textures[0];
    integrateUniforms.froxelAlphaAtlas.value = this.atlasTarget.textures.at(-1);

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

          this.historyTargets[index] = this.createAtlasTarget(froxelAtlas.width, froxelAtlas.height, spectral);
          this.historyValid = false;
        }
      }
    } else {
      this.releaseHistoryTargets();
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

        this.densityTarget = this.createRenderTarget(froxelAtlas.width, froxelAtlas.height, {
          count: densityCount,
          minFilter: Three.NearestFilter,
          magFilter: Three.NearestFilter,
        });
      }

      this.updateGridTargets();

      if (!this.isNeural() && !this.isMultiScale()) {
        this.releaseGridMipTargets();
      }
    } else {
      this.releaseFrameLightingTargets();
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
      }

      this.transmittanceTarget?.dispose();
      this.transmittanceTarget = null;
      this.releaseSpectralTransmittanceTargets();

      // NOTE Extinction and absorption. Spectral: (extinction rgb, 0) and (absorption rgb, 0).
      this.shadowDensityTarget = spectral
        ? this.createRenderTarget(gridAtlas.width, gridAtlas.height, { count: 2 })
        : this.createRenderTarget(gridAtlas.width, gridAtlas.height, { format: Three.RGFormat });

      // NOTE A new target is empty, so the last cascade and the environment grid are drawn again
      this.castSignature = [];
      this.environmentGridSignature = [];
    }

    // NOTE 'volume' lighting with volume shadows on meshes uses only the shadow grid
    if (this.isFrameLighting()) {
      // NOTE Total transmittance (2 targets), then direct transmittance of the light slots (2 targets), the size of
      // the shadow grid. Spectral: the slot group targets (getSpectralTransmittanceTarget).
      if (!spectral && !this.transmittanceTarget) {
        this.transmittanceTarget = this.createRenderTarget(gridAtlas.width, gridAtlas.height, { count: 4 });
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

        this.environmentGridTarget = this.createRenderTarget(environmentAtlas.width, environmentAtlas.height);
        this.environmentGridSignature = [];
      }

      this.environmentGridUniforms.frameEnvironmentGridColumns.value = environmentAtlas.columns;
      this.environmentGridUniforms.frameEnvironmentGridAtlasSize.value.set(
        environmentAtlas.width,
        environmentAtlas.height,
      );
    }

    this.gridUniforms.frameGridResolution.value = resolution;
    this.gridUniforms.frameGridColumns.value = gridAtlas.columns;
    this.gridUniforms.frameGridAtlasSize.value.set(gridAtlas.width, gridAtlas.height);
    this.gridTileUniforms.frameTileSize.value.set(resolution, resolution);
    this.gridTileUniforms.frameTileColumns.value = gridAtlas.columns;
    this.gridTileUniforms.frameTargetSize.value.set(gridAtlas.width, gridAtlas.height);
  }

  // NOTE Whether the transmittance targets already hold what this render would draw: the same grid content, targets,
  // shadow lights and settings.
  transmittanceUnchanged(shadowLightCount, spectralGroups, skyDirection) {
    const material = this.transmittanceMaterial;
    const uniforms = this.getUniforms(material);
    const shadowLights = this.getUniformArray(uniforms.frameShadowLights);
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
      material.neural ? 1 : 0,
      material.multiScale ? uniforms.frameMultiScaleLevels.value : 0,
      uniforms.frameTwoSided.value,
      uniforms.frameSkyMarch.value,
    );
    pushVector(values, uniforms.frameScatteringOctaves.value);
    pushVector(values, skyDirection);

    for (let group = 0; group < spectralGroups; group++) {
      values.push(this.getSpectralTransmittanceTarget(group).texture.id);
    }

    for (let i = 0; i < shadowLightCount; i++) {
      pushVector(values, shadowLights[i]);
    }

    const same = sameValues(values, this.transmittanceSignature);

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
      this.createShadowEntry,
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
      this.getUniformArray(frameGridMin),
      this.getUniformArray(frameGridSize),
      pushCasterMaps,
    );
  }

  // NOTE Pool entries are reused between frames. Unused entries are hidden.
  // NOTE createEntry(geometry) of the backend makes the mesh of a new entry. setup() fills the entry for one item.
  updatePool(pool, scene, items, camera, setup, createEntry) {
    let used = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!pool[used]) {
        const geometry = new Three.InstancedBufferGeometry();
        geometry.setAttribute('position', tileQuadPosition);

        const entry = createEntry(geometry);

        entry.mesh.frustumCulled = false;
        entry.mesh.matrixAutoUpdate = false;

        scene.add(entry.mesh);
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
      this.getUniformArray(frameGridMin),
      this.getUniformArray(frameGridSize),
      this.getUniformArray(frameGridVoxel),
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
      this.getUniformArray(frameGridMin),
      this.getUniformArray(frameGridVoxel),
      this.gridRange,
    );

    return found ? this.gridRange : null;
  }

  // NOTE Environment lights into the uniforms and the light slots.
  // NOTE 'volume' lighting marches all of them in each volume.
  // NOTE 'frame' lighting: scene lights take the first sceneShadowCount slots.
  // NOTE The dominant 'directional' environment light (light 0) takes the next free slot. Other environment lights go to the environment grid.
  // NOTE Writes the environment fields of this.lightResult. Returns the environment lights with a slot (0 or 1).
  updateEnvironmentLights(uniforms, sceneShadowCount) {
    const { environment } = this;
    const environmentCount = environment ? environment.count : 0;
    const { frameEnvironmentCount, frameEnvironmentUnshadowed } = uniforms;
    const directions = this.getUniformArray(uniforms.frameEnvironmentDirections);
    const colors = this.getUniformArray(uniforms.frameEnvironmentColors);

    frameEnvironmentCount.value = environmentCount;

    for (let i = 0; i < environmentCount; i++) {
      directions[i].fromArray(environment.directions[i]);
      colors[i].fromArray(environment.colors[i]);
    }

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
    const { environmentGridLights } = result;

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
        frameEnvironmentUnshadowed.value.add(colors[i]);
      }
    }

    frameEnvironmentUnshadowed.value.max(vector3.set(0.0, 0.0, 0.0));

    result.environmentLightCount = environmentLightCount;
    result.environmentShadowSlot = sceneShadowCount;

    return environmentLightCount;
  }

  // NOTE temporal false. updateTargets makes the targets again, empty, with historyValid false.
  releaseHistoryTargets() {
    const targets = this.historyTargets;

    for (let i = 0; i < targets.length; i++) {
      targets[i]?.dispose();
      targets[i] = null;
    }

    this.historyValid = false;
  }

  // NOTE No 'neural' or 'multi-scale'. renderGridMips draws all levels again, the signature is empty.
  releaseGridMipTargets() {
    const targets = this.gridMipTargets;

    for (let i = 0; i < targets.length; i++) {
      targets[i].dispose();
    }

    targets.length = 0;
    this.gridMipSignature.length = 0;
  }

  // NOTE Frees the slot group targets from index count up. A new group target has a new texture id, so the pass
  // draws again.
  releaseSpectralTransmittanceTargets(count = 0) {
    const targets = this.spectralTransmittanceTargets;

    for (let group = count; group < targets.length; group++) {
      targets[group].dispose();
    }

    targets.length = Math.min(targets.length, count);
    this.spectralLowRenders = 0;
    this.spectralLowGroups = 0;
  }

  // NOTE Frees spectral group targets when spectralReleaseRenders lighting renders in a row need fewer groups.
  // Cameras with different needs in one frame then do not free and make targets in each frame.
  trimSpectralTransmittanceTargets(groups) {
    if (groups >= this.spectralTransmittanceTargets.length) {
      this.spectralLowRenders = 0;
      this.spectralLowGroups = 0;

      return;
    }

    this.spectralLowGroups = Math.max(this.spectralLowGroups, groups);
    this.spectralLowRenders++;

    if (this.spectralLowRenders >= spectralReleaseRenders) {
      this.releaseSpectralTransmittanceTargets(this.spectralLowGroups);
    }
  }

  // NOTE 'volume' lighting. Volume shadows on meshes keep the shadow grid. New targets are empty, so the
  // signatures are reset and each pass draws again.
  releaseFrameLightingTargets() {
    this.densityTarget?.dispose();
    this.transmittanceTarget?.dispose();
    this.environmentGridTarget?.dispose();
    this.densityTarget = null;
    this.transmittanceTarget = null;
    this.environmentGridTarget = null;

    this.releaseSpectralTransmittanceTargets();
    this.releaseGridMipTargets();
    this.environmentGridSignature.length = 0;
    this.transmittanceSignature.length = 0;

    // NOTE updateGridTargets makes the grid again and resets castSignature. shadowDrawnTarget then differs.
    if (!this.settings.castShadows && this.shadowDensityTarget) {
      this.shadowDensityTarget.dispose();
      this.shadowDensityTarget = null;
      this.shadowDrawnTarget = null;
    }
  }

  // NOTE Frees the targets and the pools. The backend frees its materials and pass geometries.
  dispose() {
    this.volumeShadows.dispose();
    this.releaseHistoryTargets();

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

    this.releaseSpectralTransmittanceTargets();
    this.releaseGridMipTargets();

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

    this.cachedFrame = -1;
    this.cachedCamera = null;
  }
}

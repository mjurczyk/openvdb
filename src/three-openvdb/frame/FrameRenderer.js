import * as Three from 'three/webgpu';
import { vec4, outputStruct } from 'three/tsl';
import { FrameInjectMaterial } from './FrameInjectMaterial';
import { FrameIntegrateMaterial } from './FrameIntegrateMaterial';
import { FrameDensityMaterial, createDensityShadowUniforms } from './FrameDensityMaterial';
import { FrameShadowDensityMaterial } from './FrameShadowDensityMaterial';
import { FrameTransmittanceMaterial, frameShadowLightSlots } from './FrameTransmittanceMaterial';
import { FrameLightingMaterial } from './FrameLightingMaterial';
import { FrameTemporalMaterial } from './FrameTemporalMaterial';
import { updateVolumeMipmaps } from './frameMipmaps';
import {
  setVolumeUniforms,
  frameMaxShadowCascades,
  frameMaxLights,
  frameMaxHemisphereLights,
  createFroxelUniforms,
  createGridUniforms,
  createTileUniforms,
  createLightUniforms,
  frameFullscreenVertex,
} from './frameShaderChunks';

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
    // NOTE Blend the volumes over the scene in sRGB, the same as WebGLRenderer. false blends in linear space.
    srgbBlending: true,
  };

  // NOTE TSL uniform nodes. Passes share them, the CPU writes .value.
  froxelUniforms = createFroxelUniforms();
  froxelTileUniforms = createTileUniforms();
  gridUniforms = createGridUniforms(this.froxelUniforms.frameJitter);
  gridTileUniforms = createTileUniforms();
  densityShadowUniforms = createDensityShadowUniforms();
  lightUniforms = createLightUniforms();

  injectMaterial = new FrameInjectMaterial(this);
  integrateMaterial = new FrameIntegrateMaterial(this);
  lightingMaterial = new FrameLightingMaterial(this);
  transmittanceMaterial = new FrameTransmittanceMaterial(this);
  densityMaterial = new FrameDensityMaterial(this);
  shadowDensityMaterial = new FrameShadowDensityMaterial(this);

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

  atlasTarget = null;
  densityTarget = null;
  shadowDensityTarget = null;
  transmittanceTarget = null;
  lightLimitWarned = false;

  cachedFrame = -1;
  cachedCamera = null;

  constructor() {
    [
      this.injectMesh,
      this.lightingMesh,
      this.transmittanceMesh,
      this.temporalMesh,
      this.densityClearMesh,
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
  }

  // NOTE Each FrameVolume proxy calls this. The first proxy in a frame renders the frame.
  // Other proxies draw nothing.
  render(renderer, scene, camera, proxy) {
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

    const { volumes, casters } = this.collectVolumes(scene, camera);

    if (volumes.length > 0) {
      this.renderFrame(renderer, scene, camera, volumes, casters);
    }

    // NOTE Nested renders increase info.render.calls. Keep the new value.
    // Then other proxies in this frame skip.
    this.cachedFrame = renderer.info.render.calls;
    this.cachedCamera = camera;

    proxy.geometry.instanceCount = volumes.length > 0 ? 1 : 0;
  }

  isFrameLighting() {
    return this.settings.lighting === 'frame';
  }

  collectVolumes(scene, camera) {
    const { settings } = this;
    const volumes = [];
    const casters = [];
    const frameLighting = this.isFrameLighting();

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
        if (frameLighting) {
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
      return { volumes: [], casters: [] };
    }

    this.froxelUniforms.froxelRange.value.set(near, Math.max(far, near * 1.0001));

    const mipmaps = [...volumes, ...casters].some(({ frameVolume }) => frameVolume.mipmaps);

    [this.densityMaterial, this.shadowDensityMaterial, this.injectMaterial].forEach((material) =>
      material.setMipmaps(mipmaps),
    );

    return { volumes, casters };
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
    const { width, height, depth, subSteps, shadowResolution, shadowCascades } = this.settings;
    const froxelAtlas = getAtlasLayout(width, height, depth);

    if (
      !this.atlasTarget ||
      this.atlasTarget.width !== froxelAtlas.width ||
      this.atlasTarget.height !== froxelAtlas.height
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

      this.atlasTarget = createRenderTarget(froxelAtlas.width, froxelAtlas.height);
      this.historyValid = false;
    }

    this.froxelUniforms.froxelGrid.value.set(width, height, depth);
    this.froxelUniforms.froxelColumns.value = froxelAtlas.columns;
    this.froxelUniforms.froxelSubSteps.value = Math.max(1, Math.round(subSteps));
    this.froxelTileUniforms.frameTileSize.value.set(width, height);
    this.froxelTileUniforms.frameTileColumns.value = froxelAtlas.columns;
    this.froxelTileUniforms.frameTargetSize.value.set(froxelAtlas.width, froxelAtlas.height);
    this.froxelUniforms.froxelAtlasSize.value.set(froxelAtlas.width, froxelAtlas.height);
    this.integrateMaterial.froxelAtlas.value = this.atlasTarget.texture;

    if (this.settings.temporal) {
      this.historyTargets.forEach((target, index) => {
        if (!target || target.width !== froxelAtlas.width || target.height !== froxelAtlas.height) {
          if (target) {
            target.dispose();
          }

          this.historyTargets[index] = createRenderTarget(froxelAtlas.width, froxelAtlas.height);
          this.historyValid = false;
        }
      });
    }

    if (this.isFrameLighting()) {
      if (
        !this.densityTarget ||
        this.densityTarget.width !== froxelAtlas.width ||
        this.densityTarget.height !== froxelAtlas.height
      ) {
        if (this.densityTarget) {
          this.densityTarget.dispose();
        }

        this.densityTarget = createRenderTarget(froxelAtlas.width, froxelAtlas.height, {
          count: 4,
          minFilter: Three.NearestFilter,
          magFilter: Three.NearestFilter,
        });
      }

      const resolution = Math.max(2, Math.round(shadowResolution));
      const cascades = this.getCascadeCount();
      const gridAtlas = getAtlasLayout(resolution, resolution, resolution * cascades);

      if (
        !this.shadowDensityTarget ||
        this.shadowDensityTarget.width !== gridAtlas.width ||
        this.shadowDensityTarget.height !== gridAtlas.height
      ) {
        if (this.shadowDensityTarget) {
          this.shadowDensityTarget.dispose();
          this.transmittanceTarget.dispose();
        }

        this.shadowDensityTarget = createRenderTarget(gridAtlas.width, gridAtlas.height, {
          format: Three.RedFormat,
        });
        this.transmittanceTarget = createRenderTarget(gridAtlas.width, gridAtlas.height, {
          count: 2,
        });
      }

      this.gridUniforms.frameGridResolution.value = resolution;
      this.gridUniforms.frameGridColumns.value = gridAtlas.columns;
      this.gridUniforms.frameGridAtlasSize.value.set(gridAtlas.width, gridAtlas.height);
      this.gridTileUniforms.frameTileSize.value.set(resolution, resolution);
      this.gridTileUniforms.frameTileColumns.value = gridAtlas.columns;
      this.gridTileUniforms.frameTargetSize.value.set(gridAtlas.width, gridAtlas.height);
    }
  }

  renderFrame(renderer, scene, camera, volumes, casters) {
    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentScissorTest = renderer.getScissorTest();

    renderer.getClearColor(clearColor);

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

    material.frameCurrentMap.value = this.atlasTarget.texture;
    material.frameHistoryMap.value = readTarget.texture;
    material.frameUseHistory.value = this.historyValid && this.historyCamera === camera ? 1 : 0;
    material.frameTemporalBlend.value = Math.min(1.0, Math.max(0.01, this.settings.temporalBlend));
    material.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    material.framePreviousViewMatrix.value.copy(this.previousViewMatrix);
    material.framePreviousProjectionMatrix.value.copy(this.previousProjectionMatrix);
    material.framePreviousRange.value.copy(this.previousRange);

    this.temporalMesh.layers.mask = camera.layers.mask;

    renderer.setRenderTarget(writeTarget);
    renderer.render(this.temporalScene, camera);

    this.integrateMaterial.froxelAtlas.value = writeTarget.texture;

    this.historyIndex = 1 - this.historyIndex;
    this.historyValid = true;
    this.historyCamera = camera;
    this.previousViewMatrix.copy(camera.matrixWorldInverse);
    this.previousProjectionMatrix.copy(camera.projectionMatrix);
    this.previousRange.copy(this.froxelUniforms.froxelRange.value);
  }

  prepareLightScene(scene, camera, mesh) {
    const { injectScene } = this;

    injectScene.environment = scene.environment;
    injectScene.environmentIntensity = scene.environmentIntensity;
    injectScene.environmentRotation.copy(scene.environmentRotation);

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
    const useShadows = casters.length > 0 && this.updateGrid(casters, camera);

    if (useShadows) {
      const cascadeCasters = [];

      for (let cascade = 0; cascade < this.gridUniforms.frameGridCount.value; cascade++) {
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

      this.transmittanceMaterial.frameShadowDensityMap.value = this.shadowDensityTarget.texture;
      this.transmittanceMaterial.frameShadowLightCount.value = lights.shadowLightCount;
      this.transmittanceMesh.layers.mask = camera.layers.mask;

      renderer.setRenderTarget(this.transmittanceTarget);
      renderer.render(this.transmittanceScene, camera);
    }

    const { densityShadowUniforms } = this;

    densityShadowUniforms.frameUseShadows.value = useShadows ? 1 : 0;
    densityShadowUniforms.frameTransmittanceMap0.value = this.transmittanceTarget.textures[0];
    densityShadowUniforms.frameTransmittanceMap1.value = this.transmittanceTarget.textures[1];
    densityShadowUniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);

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
    lightingMaterial.frameDensityShadowMap0.value = this.densityTarget.textures[2];
    lightingMaterial.frameDensityShadowMap1.value = this.densityTarget.textures[3];
    lightingMaterial.frameShadowLightCount.value = lights.shadowLightCount;
    lightingMaterial.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    lightingMaterial.setEnvironment(scene.environment);

    renderer.setRenderTarget(this.atlasTarget);
    renderer.clear(true, false, false);
    renderer.render(this.injectScene, camera);
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
        });
      } else if (light.isPointLight) {
        points.push({
          position: new Three.Vector4(...lightPosition.toArray(), 2.0),
          color: new Three.Vector4(...lightColor.toArray(), 0.0),
          spot: new Three.Vector4(),
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
    }

    frameLightCount.value = count;

    return { shadowLightCount: Math.min(count, frameShadowLightSlots) };
  }

  dispose() {
    this.historyTargets.forEach((target) => target && target.dispose());
    this.historyTargets = [null, null];
    this.historyValid = false;

    ['atlasTarget', 'densityTarget', 'shadowDensityTarget', 'transmittanceTarget'].forEach(
      (key) => {
        if (this[key]) {
          this[key].dispose();
          this[key] = null;
        }
      },
    );

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
    ].forEach((material) => material.dispose());

    [this.injectMesh, this.lightingMesh, this.transmittanceMesh, this.densityClearMesh].forEach((mesh) =>
      mesh.geometry.dispose(),
    );

    this.cachedFrame = -1;
    this.cachedCamera = null;
  }
}

export const frameRenderer = new FrameRenderer();

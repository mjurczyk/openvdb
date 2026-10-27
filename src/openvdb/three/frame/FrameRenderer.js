import * as Three from 'three';
import { FrameInjectMaterial } from './FrameInjectMaterial';
import { FrameIntegrateMaterial } from './FrameIntegrateMaterial';
import { FrameDensityMaterial } from './FrameDensityMaterial';
import { FrameShadowDensityMaterial } from './FrameShadowDensityMaterial';
import { FrameTransmittanceMaterial, frameShadowLightSlots } from './FrameTransmittanceMaterial';
import { FrameLightingMaterial } from './FrameLightingMaterial';
import { FrameTemporalMaterial } from './FrameTemporalMaterial';
import { setVolumeUniforms, frameMaxShadowCascades } from './frameShaderChunks';

const unitBox = new Three.Box3(
  new Three.Vector3(-0.5, -0.5, -0.5),
  new Three.Vector3(0.5, 0.5, 0.5),
);
const viewBox = new Three.Box3();
const cameraBox = new Three.Box3();
const casterBox = new Three.Box3();
const cascadeBox = new Three.Box3();
const frustum = new Three.Frustum();
const projectionScreenMatrix = new Three.Matrix4();
const clipMatrix = new Three.Matrix4();
const viewport = new Three.Vector4();
const corner = new Three.Vector4();
const clearColor = new Three.Color();
const vector3 = new Three.Vector3();

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

const createScene = () => {
  const scene = new Three.Scene();
  scene.matrixWorldAutoUpdate = false;

  return scene;
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
    far: 512.0,
    jitter: false,
    temporal: true,
    temporalBlend: 0.2,
    lighting: 'frame',
    shadowResolution: 64,
    shadowCascades: 3,
    shadowDistance: 512,
  };

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

  injectMaterial = new FrameInjectMaterial(this.froxelUniforms);
  integrateMaterial = new FrameIntegrateMaterial(this.froxelUniforms);
  lightingMaterial = new FrameLightingMaterial({ ...this.froxelUniforms, ...this.gridUniforms });
  transmittanceMaterial = new FrameTransmittanceMaterial(this.gridUniforms);
  depthMaterial = new Three.MeshBasicMaterial({ colorWrite: false, side: Three.DoubleSide });

  // NOTE The light scene holds the light copies. It draws the volume inject pass or the frame lighting pass.
  injectScene = createScene();
  injectMesh = new Three.Mesh(createFullscreenGeometry(), this.injectMaterial);
  lightingMesh = new Three.Mesh(createFullscreenGeometry(), this.lightingMaterial);
  lightProxies = {};

  densityScene = createScene();
  densityPool = [];

  shadowScene = createScene();
  shadowPool = [];

  transmittanceScene = createScene();
  transmittanceMesh = new Three.Mesh(createFullscreenGeometry(), this.transmittanceMaterial);

  temporalMaterial = new FrameTemporalMaterial(this.froxelUniforms);
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
  depthTarget = null;

  cachedFrame = -1;
  cachedCamera = null;

  constructor() {
    [this.injectMesh, this.lightingMesh, this.transmittanceMesh, this.temporalMesh].forEach(
      (mesh) => {
        mesh.frustumCulled = false;
      },
    );

    this.temporalScene.add(this.temporalMesh);

    this.injectScene.add(this.injectMesh, this.lightingMesh);
    this.transmittanceScene.add(this.transmittanceMesh);
  }

  // NOTE Each FrameVolume proxy calls this. The first proxy in a frame renders the frame.
  // Other proxies draw nothing.
  render(renderer, scene, camera, proxy) {
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

    vector3.setFromMatrixPosition(camera.matrixWorld);
    cameraBox.min.copy(vector3).subScalar(settings.shadowDistance);
    cameraBox.max.copy(vector3).addScalar(settings.shadowDistance);

    let near = Infinity;
    let far = 0.0;

    scene.traverseVisible((object) => {
      if (!object.isFrameVolume || !object.proxy.layers.test(camera.layers)) {
        return;
      }

      object.volumes.forEach((volume) => {
        if (!volume.ready) {
          return;
        }

        volume.matrixWorld.multiplyMatrices(object.matrixWorld, volume.matrix);
        volume.worldToLocal.copy(volume.matrixWorld).invert();
        volume.worldBox.copy(unitBox).applyMatrix4(volume.matrixWorld);

        // NOTE Volumes out of the view can still cast shadows on visible volumes
        if (frameLighting && volume.worldBox.intersectsBox(cameraBox)) {
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
      const { maxTextureSize } = renderer.capabilities;

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
    this.integrateMaterial.uniforms.froxelAtlas.value = this.atlasTarget.texture;

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
    this.integrateMaterial.uniforms.froxelAtlasSize.value.set(
      froxelAtlas.width,
      froxelAtlas.height,
    );

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
          count: 2,
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

    this.updateTargets(renderer);

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

    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.shadowMap.needsUpdate = currentShadowNeedsUpdate;
    renderer.autoClear = currentAutoClear;
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  }

  // NOTE Blends this frame into the history. The integrate pass then reads the blended froxels.
  renderTemporal(renderer, camera) {
    const uniforms = this.temporalMaterial.uniforms;
    const readTarget = this.historyTargets[this.historyIndex];
    const writeTarget = this.historyTargets[1 - this.historyIndex];

    uniforms.frameCurrentMap.value = this.atlasTarget.texture;
    uniforms.frameHistoryMap.value = readTarget.texture;
    uniforms.frameAtlasSize.value.set(this.atlasTarget.width, this.atlasTarget.height);
    uniforms.frameUseHistory.value = this.historyValid && this.historyCamera === camera;
    uniforms.frameTemporalBlend.value = Math.min(1.0, Math.max(0.01, this.settings.temporalBlend));
    uniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    uniforms.framePreviousViewMatrix.value.copy(this.previousViewMatrix);
    uniforms.framePreviousProjectionMatrix.value.copy(this.previousProjectionMatrix);
    uniforms.framePreviousRange.value.copy(this.previousRange);

    this.temporalMesh.layers.mask = camera.layers.mask;

    renderer.setRenderTarget(writeTarget);
    renderer.render(this.temporalScene, camera);

    this.integrateMaterial.uniforms.froxelAtlas.value = writeTarget.texture;

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
    const { froxelGrid, froxelColumns } = this.froxelUniforms;
    const uniforms = this.injectMaterial.frameUniforms;

    this.prepareLightScene(scene, camera, this.injectMesh);

    atlasTarget.scissorTest = false;
    renderer.setRenderTarget(atlasTarget);
    renderer.clear(true, false, false);

    const columns = froxelColumns.value;
    const sliceHeight = froxelGrid.value.y;

    volumes.forEach(({ frameVolume, volume }) => {
      setVolumeUniforms(uniforms, frameVolume, volume);
      uniforms.frameLights.value = frameVolume.lights;
      uniforms.frameShadowSteps.value = frameVolume.shadowSteps;

      // NOTE Draw only the atlas rows that contain the slices of this volume
      const { first, count } = this.getSliceRange(volume);
      const firstRow = Math.floor(first / columns);
      const lastRow = Math.floor((first + count - 1) / columns);

      atlasTarget.scissor.set(
        0,
        firstRow * sliceHeight,
        atlasTarget.width,
        (lastRow - firstRow + 1) * sliceHeight,
      );
      atlasTarget.scissorTest = true;

      renderer.setRenderTarget(atlasTarget);
      renderer.render(injectScene, camera);
    });

    atlasTarget.scissorTest = false;
  }

  // NOTE Combined lighting: density of all volumes, one shadow grid, one lighting pass.
  // Render calls do not grow with the number of volumes.
  renderFrameLighting(renderer, scene, camera, volumes, casters) {
    const lights = this.prepareLightScene(scene, camera, this.lightingMesh);

    // NOTE Density pass. One instanced draw for each volume, one instance for each slice.
    this.updatePool(
      this.densityPool,
      this.densityScene,
      volumes,
      camera,
      (entry, { frameVolume, volume }) => {
        const rect = this.getFroxelRect(volume, camera);

        if (!rect) {
          return false;
        }

        const { first, count } = this.getSliceRange(volume);

        setVolumeUniforms(entry.material.uniforms, frameVolume, volume);
        entry.material.uniforms.frameRect.value.copy(rect);
        entry.material.uniforms.frameSliceStart.value = first;
        entry.geometry.instanceCount = count;

        return true;
      },
      () => new FrameDensityMaterial({ ...this.froxelUniforms, ...this.froxelTileUniforms }),
    );

    renderer.setRenderTarget(this.densityTarget);
    renderer.clear(true, false, false);
    renderer.render(this.densityScene, camera);

    // NOTE Shadow pass. Extinction of all casters in one world grid, then transmittance to each light.
    const useShadows = casters.length > 0 && this.updateGrid(casters, camera);

    if (useShadows) {
      const cascadeCasters = [];

      for (let cascade = 0; cascade < this.gridUniforms.frameGridCount.value; cascade++) {
        casters.forEach((caster) => cascadeCasters.push({ ...caster, cascade }));
      }

      this.updatePool(
        this.shadowPool,
        this.shadowScene,
        cascadeCasters,
        camera,
        (entry, { frameVolume, volume, cascade }) => {
          const range = this.getGridRange(volume, cascade);

          if (!range) {
            return false;
          }

          setVolumeUniforms(entry.material.uniforms, frameVolume, volume);
          entry.material.uniforms.frameRect.value.copy(range.rect);
          entry.material.uniforms.frameSliceStart.value = range.first;
          entry.geometry.instanceCount = range.count;

          return true;
        },
        () => new FrameShadowDensityMaterial({ ...this.gridUniforms, ...this.gridTileUniforms }),
      );

      renderer.setRenderTarget(this.shadowDensityTarget);
      renderer.clear(true, false, false);
      renderer.render(this.shadowScene, camera);

      const transmittanceUniforms = this.transmittanceMaterial.uniforms;

      transmittanceUniforms.frameShadowDensityMap.value = this.shadowDensityTarget.texture;
      transmittanceUniforms.frameSkyDirection.value.copy(lights.skyDirection);
      transmittanceUniforms.frameShadowLightCount.value = lights.shadowLights.length;

      lights.shadowLights.forEach((light, index) => {
        transmittanceUniforms.frameShadowLights.value[index].copy(light);
      });

      this.transmittanceMesh.layers.mask = camera.layers.mask;

      renderer.setRenderTarget(this.transmittanceTarget);
      renderer.render(this.transmittanceScene, camera);
    }

    // NOTE Lighting pass. Each froxel is lit one time from the combined data.
    const lightingUniforms = this.lightingMaterial.frameUniforms;

    lightingUniforms.frameDensityAlbedoMap.value = this.densityTarget.textures[0];
    lightingUniforms.frameDensityEmissionMap.value = this.densityTarget.textures[1];
    lightingUniforms.frameTransmittanceMap0.value = this.transmittanceTarget.textures[0];
    lightingUniforms.frameTransmittanceMap1.value = this.transmittanceTarget.textures[1];
    lightingUniforms.frameUseShadows.value = useShadows;
    lightingUniforms.frameCameraMatrixWorld.value.copy(camera.matrixWorld);
    lightingUniforms.frameSkyDirection.value.copy(lights.skyDirection);
    lightingUniforms.frameShadowLightCount.value = lights.shadowLights.length;
    lightingUniforms.frameShadowPointOffset.value = lights.pointOffset;
    lightingUniforms.frameShadowSpotOffset.value = lights.spotOffset;

    renderer.setRenderTarget(this.atlasTarget);
    renderer.clear(true, false, false);
    renderer.render(this.injectScene, camera);
  }

  // NOTE Pool entries are reused between frames. Unused entries are hidden.
  updatePool(pool, scene, items, camera, setup, createMaterial) {
    let used = 0;

    items.forEach((item) => {
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

  // NOTE The last cascade fits all casters. Each finer cascade is half the size, around the camera.
  // Power-of-two voxels and snapped bounds keep shadows stable when the camera moves.
  updateGrid(casters, camera) {
    const resolution = this.gridUniforms.frameGridResolution.value;
    const cascades = this.getCascadeCount();
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount } = this.gridUniforms;

    casterBox.makeEmpty();
    casters.forEach(({ volume }) => casterBox.union(volume.worldBox));
    casterBox.intersect(cameraBox);

    if (casterBox.isEmpty()) {
      return false;
    }

    vector3.setFromMatrixPosition(camera.matrixWorld);

    const outerHalfSize =
      0.5 *
      Math.max(
        casterBox.max.x - casterBox.min.x,
        casterBox.max.y - casterBox.min.y,
        casterBox.max.z - casterBox.min.z,
      );

    let count = 0;

    for (let cascade = 0; cascade < cascades; cascade++) {
      if (cascade === cascades - 1) {
        cascadeBox.copy(casterBox);
      } else {
        const halfSize = outerHalfSize / Math.pow(2.0, cascades - 1 - cascade);

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

        frameGridVoxel.value[count][axis] = voxel;
        frameGridMin.value[count][axis] = Math.floor(cascadeBox.min[axis] / voxel) * voxel;
        frameGridSize.value[count][axis] = voxel * resolution;
      });

      count++;
    }

    frameGridCount.value = count;

    return count > 0;
  }

  // NOTE Voxel rectangle and atlas slices of the volume in one shadow grid cascade
  getGridRange(volume, cascade) {
    const resolution = this.gridUniforms.frameGridResolution.value;
    const gridMin = this.gridUniforms.frameGridMin.value[cascade];
    const voxel = this.gridUniforms.frameGridVoxel.value[cascade];
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

  // NOTE The light scene has copies of the scene lights. Then three.js light uniforms work in its passes.
  // Shadow slots follow the order of the three.js light arrays: directional, point, spot.
  updateLightProxies(scene, camera) {
    const used = {};
    const directions = [];
    const points = [];
    const spots = [];
    const skyDirection = new Three.Vector3(0.0, 1.0, 0.0);
    let hasSky = false;

    scene.traverseVisible((light) => {
      if (!light.isLight || !lightProxyFactories[light.type] || !light.layers.test(camera.layers)) {
        return;
      }

      const index = used[light.type] || 0;
      const proxy = this.getLightProxy(light.type, index);

      used[light.type] = index + 1;

      proxy.visible = true;
      proxy.layers.mask = camera.layers.mask;
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

        if (!hasSky) {
          skyDirection.setFromMatrixPosition(light.matrixWorld);
          hasSky = skyDirection.lengthSq() > 0.0;
        }
      }

      if (light.isLightProbe) {
        proxy.sh.copy(light.sh);
      }

      const position = new Three.Vector3().setFromMatrixPosition(light.matrixWorld);

      if (light.isDirectionalLight) {
        const target = new Three.Vector3().setFromMatrixPosition(light.target.matrixWorld);

        directions.push(
          new Three.Vector4().set(...position.sub(target).normalize().toArray(), 1.0),
        );
      } else if (light.isSpotLight) {
        spots.push(new Three.Vector4().set(...position.toArray(), 2.0));
      } else if (light.isPointLight) {
        points.push(new Three.Vector4().set(...position.toArray(), 2.0));
      }
    });

    Object.entries(this.lightProxies).forEach(([type, proxies]) => {
      proxies.forEach((proxy, index) => {
        if (index >= (used[type] || 0)) {
          proxy.visible = false;
        }
      });
    });

    if (!hasSky) {
      skyDirection.set(0.0, 1.0, 0.0);
    }

    return {
      skyDirection: skyDirection.normalize(),
      shadowLights: [...directions, ...points, ...spots].slice(0, frameShadowLightSlots),
      pointOffset: directions.length,
      spotOffset: directions.length + points.length,
    };
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
      this.lightingMaterial,
      this.transmittanceMaterial,
      this.temporalMaterial,
      this.depthMaterial,
    ].forEach((material) => material.dispose());

    [this.injectMesh, this.lightingMesh, this.transmittanceMesh].forEach((mesh) =>
      mesh.geometry.dispose(),
    );

    this.cachedFrame = -1;
    this.cachedCamera = null;
  }
}

export const frameRenderer = new FrameRenderer();

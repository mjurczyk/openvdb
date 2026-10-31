import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  Discard,
  float,
  int,
  ivec2,
  vec3,
  vec4,
  uniform,
  uniformArray,
  texture,
  property,
  outputStruct,
  positionGeometry,
  positionWorld,
  normalWorld,
  renderGroup,
  luminance,
  select,
  mix,
  exp,
  sqrt,
  sin,
  cos,
  cross,
  normalize,
  dot,
  clamp,
  floor,
  min,
  max,
  abs,
  smoothstep,
  inverseSqrt,
} from 'three/tsl';
import {
  FrameEmissionLightBase,
  frameEmissionDirections as directionCount,
  frameEmissionRays as rayCount,
  frameEmissionMaxCascades as maxCascades,
  frameEmissionAtlasColumns as atlasColumns,
  frameEmissionAtlasSize as atlasSize,
} from '../core/FrameEmissionLight';
import { updateVolumeMipmaps } from './frameMipmaps';
import {
  frameFragCoord,
  frameLoad,
  frameFullscreenVertex,
  createVolumeUniforms,
  createVolumeNodes,
  setVolumeUniforms,
  createGridNodes,
} from './frameShaderChunks';

// NOTE Golden angle in radians. Fibonacci directions turn by this angle.
const goldenAngle = Math.PI * (3.0 - Math.sqrt(5.0));

// NOTE Probe cascades in the uniform names of createGridNodes. Cascade 0 is the finest.
const createProbeGridUniforms = (group) => {
  const nodes = {
    frameGridMin: uniformArray(
      Array.from({ length: maxCascades }, () => new Three.Vector3()),
      'vec3',
    ),
    frameGridSize: uniformArray(
      Array.from({ length: maxCascades }, () => new Three.Vector3(1.0, 1.0, 1.0)),
      'vec3',
    ),
    frameGridCount: uniform(0, 'int'),
    frameGridResolution: uniform(1.0),
    frameGridColumns: uniform(atlasColumns),
    frameGridAtlasSize: uniform(new Three.Vector2(atlasSize, atlasSize)),
  };

  if (group) {
    Object.values(nodes).forEach((node) => node.setGroup(group));
  }

  return nodes;
};

const setProbeGridUniforms = (uniforms, light) => {
  for (let i = 0; i < maxCascades; i++) {
    uniforms.frameGridMin.array[i].copy(light.cascadeMin[i]);
    uniforms.frameGridSize.array[i].copy(light.cascadeSize[i]);
  }

  uniforms.frameGridCount.value = light.cascadeCount;
  uniforms.frameGridResolution.value = light.probeResolution;
};

const fullscreenPositions = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
const quadPositions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0];

const createGeometry = (positions) => {
  const geometry = new Three.BufferGeometry();
  geometry.setAttribute('position', new Three.Float32BufferAttribute(positions, 3));

  return geometry;
};

const createTarget = (count, type, filter, width = 1, height = 1) =>
  new Three.RenderTarget(width, height, {
    count,
    type,
    format: Three.RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    generateMipmaps: false,
    depthBuffer: false,
  });

const setPassMaterial = (material) => {
  material.side = Three.DoubleSide;
  material.depthTest = false;
  material.depthWrite = false;
  material.blending = Three.NoBlending;
};

// NOTE Light that one volume sends in one direction. One texel for each direction, one row for each volume.
// NOTE Parallel rays cover the bounding sphere. Each ray adds the emission with the transmittance of the volume.
// NOTE Output 0: intensity (emission times ray area) and the bounding radius. Output 1: luminance-weighted world position.
class FrameEmissionDirectionMaterial extends Three.NodeMaterial {
  constructor() {
    super();

    this.name = 'FrameEmissionDirectionMaterial';
    this.volumeUniforms = createVolumeUniforms();
    this.frameSlot = uniform(0.0);
    this.frameTargetSize = uniform(new Three.Vector2(directionCount, 1.0));
    this.frameEmitterCenter = uniform(new Three.Vector3());
    this.frameEmitterRadius = uniform(1.0);
    this.frameSteps = uniform(24, 'int');
    this.mipmaps = false;
    this.buildNodes();

    setPassMaterial(this);
  }

  setMipmaps(mipmaps) {
    if (mipmaps !== this.mipmaps) {
      this.mipmaps = mipmaps;
      this.buildNodes();
      this.needsUpdate = true;
    }
  }

  buildNodes() {
    const volume = createVolumeNodes(this.volumeUniforms, this.mipmaps);
    const { frameWorldToLocal, frameWorldScale, frameAbsorbance } = this.volumeUniforms;
    const { frameSlot, frameTargetSize, frameEmitterCenter, frameEmitterRadius, frameSteps } = this;

    const outputIntensity = property('vec4');
    const outputCenter = property('vec4');

    // NOTE The quad covers the row of the slot
    this.vertexNode = vec4(
      positionGeometry.x,
      frameSlot.add(positionGeometry.y.mul(0.5).add(0.5)).div(frameTargetSize.y).mul(2.0).sub(1.0),
      0.0,
      1.0,
    );

    this.colorNode = Fn(() => {
      const index = floor(frameFragCoord(frameTargetSize).x).toVar();

      // NOTE Fibonacci sphere direction, from the volume to the viewer
      const y = float(1.0).sub(index.mul(2.0).add(1.0).div(directionCount)).toVar();
      const ring = sqrt(max(0.0, float(1.0).sub(y.mul(y))));
      const phi = index.mul(goldenAngle);
      const direction = vec3(cos(phi).mul(ring), y, sin(phi).mul(ring)).toVar();
      const helper = select(abs(direction.y).lessThan(0.999), vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0));
      const tangent = normalize(cross(helper, direction)).toVar();
      const bitangent = cross(direction, tangent).toVar();

      const diameter = frameEmitterRadius.mul(2.0).toVar();
      const spacing = diameter.div(rayCount).toVar();
      const stepCount = float(frameSteps).toVar();
      const intensity = vec3(0.0).toVar();
      const center = vec4(0.0).toVar();

      Loop({ start: int(0), end: int(rayCount * rayCount), type: 'int', condition: '<', name: 'r' }, ({ r }) => {
        const u = float(r.mod(int(rayCount))).add(0.5).div(rayCount).mul(2.0).sub(1.0);
        const v = float(r.div(int(rayCount))).add(0.5).div(rayCount).mul(2.0).sub(1.0);
        const worldStart = frameEmitterCenter
          .add(direction.mul(frameEmitterRadius))
          .add(tangent.mul(u.mul(frameEmitterRadius)))
          .add(bitangent.mul(v.mul(frameEmitterRadius)))
          .toVar();
        const worldEnd = worldStart.sub(direction.mul(diameter)).toVar();
        const localStart = frameWorldToLocal.mul(vec4(worldStart, 1.0)).xyz.toVar();
        const localEnd = frameWorldToLocal.mul(vec4(worldEnd, 1.0)).xyz.toVar();
        const segment = volume.boxSegment(localStart, localEnd).toVar();

        If(segment.x.lessThan(segment.y), () => {
          const segmentLength = segment.y.sub(segment.x).toVar();
          const stepLength = segmentLength.mul(diameter).div(stepCount).toVar();
          // NOTE Smoke uses the mip level of the step. Emission uses level 0: power grows with temperature^4, mipmaps lose it.
          const lod = volume.getLod(stepLength.div(frameWorldScale)).toVar();
          const transmittance = float(1.0).toVar();

          Loop({ start: int(0), end: frameSteps, type: 'int', condition: '<', name: 's' }, ({ s }) => {
            const t = segment.x.add(segmentLength.mul(float(s).add(0.5).div(stepCount))).toVar();
            const localPosition = mix(localStart, localEnd, t).toVar();
            const extinction = volume.sampleExtinction(localPosition, lod).toVar();

            If(extinction.greaterThan(0.0), () => {
              // NOTE Absorbance scales the shadow of the volume, the same as for scene lights
              const alpha = float(1.0).sub(exp(extinction.mul(stepLength).negate()));
              const radiance = volume
                .sampleEmission(localPosition, float(0.0))
                .mul(transmittance.mul(alpha))
                .toVar();

              intensity.addAssign(radiance);
              center.addAssign(vec4(mix(worldStart, worldEnd, t), 1.0).mul(luminance(radiance)));
              transmittance.mulAssign(exp(extinction.mul(frameAbsorbance).mul(stepLength).negate()));

              If(transmittance.lessThan(0.01), () => {
                Break();
              });
            });
          });
        });
      });

      const area = spacing.mul(spacing);

      outputIntensity.assign(vec4(intensity.mul(area), frameEmitterRadius));
      outputCenter.assign(center.mul(area));

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(outputIntensity, outputCenter);
  }
}

// NOTE One texel for each volume: mean intensity of all directions, and the center of the visible emission
class FrameEmissionReduceMaterial extends Three.NodeMaterial {
  constructor() {
    super();

    this.name = 'FrameEmissionReduceMaterial';
    this.frameTargetSize = uniform(new Three.Vector2(1.0, 1.0));
    this.frameDirectionSize = uniform(new Three.Vector2(directionCount, 1.0));
    this.frameDirectionIntensity = texture(new Three.Texture());
    this.frameDirectionCenter = texture(new Three.Texture());

    const outputIntensity = property('vec4');
    const outputCenter = property('vec4');

    this.vertexNode = frameFullscreenVertex;

    this.colorNode = Fn(() => {
      const row = int(floor(frameFragCoord(this.frameTargetSize).y)).toVar();
      const intensity = vec4(0.0).toVar();
      const center = vec4(0.0).toVar();

      Loop(directionCount, ({ i }) => {
        const texel = ivec2(i, row);

        intensity.addAssign(frameLoad(this.frameDirectionIntensity, texel, this.frameDirectionSize));
        center.addAssign(frameLoad(this.frameDirectionCenter, texel, this.frameDirectionSize));
      });

      const visible = center.w.greaterThan(0.0);

      outputIntensity.assign(intensity.div(directionCount));
      outputCenter.assign(
        select(visible, vec4(center.xyz.div(max(center.w, 1e-12)), 1.0), vec4(0.0)),
      );

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(outputIntensity, outputCenter);

    setPassMaterial(this);
  }
}

// NOTE L1 irradiance of all volumes at each probe: E(n) = x + dot(yzw, n) for each color channel.
// NOTE Each volume is a point light at its emission center. Near the center, its radius softens the distance.
class FrameEmissionProbeMaterial extends Three.NodeMaterial {
  constructor() {
    super();

    this.name = 'FrameEmissionProbeMaterial';
    this.gridUniforms = createProbeGridUniforms();
    this.frameEmitterCount = uniform(0, 'int');
    this.frameEmitterSize = uniform(new Three.Vector2(1.0, 1.0));
    this.frameEmitterIntensity = texture(new Three.Texture());
    this.frameEmitterCenter = texture(new Three.Texture());

    const outputRed = property('vec4');
    const outputGreen = property('vec4');
    const outputBlue = property('vec4');

    const grid = createGridNodes(this.gridUniforms);
    const { frameGridMin, frameGridSize, frameGridCount, frameGridResolution, frameGridAtlasSize } =
      this.gridUniforms;

    this.vertexNode = frameFullscreenVertex;

    this.colorNode = Fn(() => {
      const fragCoord = frameFragCoord(frameGridAtlasSize).toVar();

      // NOTE Tiles right of the atlas columns are not used. Smaller grids leave them empty.
      If(fragCoord.x.greaterThanEqual(frameGridResolution.mul(atlasColumns)), () => {
        Discard();
      });

      const cell = grid.getGridCell(fragCoord);

      If(cell.cascade.greaterThanEqual(frameGridCount), () => {
        Discard();
      });

      const probe = frameGridMin
        .element(cell.cascade)
        .add(cell.gridUvw.mul(frameGridSize.element(cell.cascade)))
        .toVar();

      const constant = vec3(0.0).toVar();
      const directionRed = vec3(0.0).toVar();
      const directionGreen = vec3(0.0).toVar();
      const directionBlue = vec3(0.0).toVar();

      Loop(this.frameEmitterCount, ({ i }) => {
        const texel = ivec2(int(0), i);
        const center = frameLoad(this.frameEmitterCenter, texel, this.frameEmitterSize).toVar();

        If(center.w.greaterThan(0.0), () => {
          const emitter = frameLoad(this.frameEmitterIntensity, texel, this.frameEmitterSize).toVar();
          const toProbe = probe.sub(center.xyz).toVar();
          const distanceSquared = dot(toProbe, toProbe).toVar();
          const soft = emitter.w.mul(0.25);
          const softDistanceSquared = distanceSquared.add(soft.mul(soft)).toVar();
          const irradiance = emitter.rgb.div(softDistanceSquared).toVar();

          // NOTE L1 projection of a point light: E(n) = E / 4 + E / 2 * dot(l, n). The direction fades near the center.
          const toLight = toProbe
            .mul(inverseSqrt(max(distanceSquared, 1e-12)))
            .mul(distanceSquared.div(softDistanceSquared).mul(-0.5))
            .toVar();

          constant.addAssign(irradiance.mul(0.25));
          directionRed.addAssign(toLight.mul(irradiance.r));
          directionGreen.addAssign(toLight.mul(irradiance.g));
          directionBlue.addAssign(toLight.mul(irradiance.b));
        });
      });

      outputRed.assign(vec4(constant.r, directionRed));
      outputGreen.assign(vec4(constant.g, directionGreen));
      outputBlue.assign(vec4(constant.b, directionBlue));

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(outputRed, outputGreen, outputBlue);

    setPassMaterial(this);
  }
}

// NOTE Pass materials and scenes are shared by all emission lights. Each light sets the uniforms before its passes.
let passes = null;

const getPasses = () => {
  if (!passes) {
    const createPassScene = (material) => {
      const scene = new Three.Scene();
      const mesh = new Three.Mesh(createGeometry(fullscreenPositions), material);

      mesh.frustumCulled = false;
      scene.matrixWorldAutoUpdate = false;
      scene.add(mesh);

      return scene;
    };

    const reduceMaterial = new FrameEmissionReduceMaterial();
    const probeMaterial = new FrameEmissionProbeMaterial();

    passes = {
      directionMaterial: new FrameEmissionDirectionMaterial(),
      reduceMaterial,
      probeMaterial,
      reduceScene: createPassScene(reduceMaterial),
      probeScene: createPassScene(probeMaterial),
      // NOTE WebGPURenderer calls updateProjectionMatrix() on the camera. Three.Camera has no such method.
      camera: new Three.OrthographicCamera(),
    };
  }

  return passes;
};

// NOTE Probe irradiance at the shaded point, from the finest cascade that contains it.
// NOTE Past the last cascade, its edge probes fall off with distance squared.
// NOTE Near the side of a cascade, the next cascade blends in, the same as the shadow grid.
class FrameEmissionLightNode extends Three.AnalyticLightNode {
  static get type() {
    return 'FrameEmissionLightNode';
  }

  constructor(light = null) {
    super(light);

    // NOTE The passes run before the first lit mesh of each render, the same as shadow maps
    this.updateType = Three.NodeUpdateType.RENDER;
    this.updateBeforeType = Three.NodeUpdateType.RENDER;

    const maps = light
      ? light.probeTarget.textures
      : [new Three.Texture(), new Three.Texture(), new Three.Texture()];

    this.probeMaps = maps.map((map) => texture(map));

    // NOTE Render group, the same as three.js lights. Lit materials without node changes update only shared uniforms.
    this.gridUniforms = createProbeGridUniforms(renderGroup);
    this.probeCenter = uniform(new Three.Vector3()).setGroup(renderGroup);
    this.probeActive = uniform(0.0).setGroup(renderGroup);
  }

  updateBefore(frame) {
    // NOTE No passes while three.js precompiles materials (compileAsync), the same as shadow maps
    if (frame.renderer._precompilationState) {
      return;
    }

    this.light.updateProbes(frame.renderer, frame.scene, frame.camera);
  }

  update(frame) {
    super.update(frame);

    const { light } = this;

    setProbeGridUniforms(this.gridUniforms, light);
    this.probeCenter.value.copy(light.probeCenter);
    this.probeActive.value = light.emitterCount > 0 ? 1.0 : 0.0;
  }

  setup(builder) {
    const grid = createGridNodes(this.gridUniforms);
    const { frameGridMin, frameGridSize, frameGridCount, frameGridResolution } = this.gridUniforms;
    const { probeCenter, probeActive } = this;
    const [redMap, greenMap, blueMap] = this.probeMaps;

    const irradiance = Fn(() => {
      const position = positionWorld.toVar();
      const red = vec4(0.0).toVar();
      const green = vec4(0.0).toVar();
      const blue = vec4(0.0).toVar();
      const falloff = float(1.0).toVar();

      const sampleProbes = (cascade, uvw, weight) => {
        red.assign(mix(red, grid.sampleGrid(redMap, cascade, uvw), weight));
        green.assign(mix(green, grid.sampleGrid(greenMap, cascade, uvw), weight));
        blue.assign(mix(blue, grid.sampleGrid(blueMap, cascade, uvw), weight));
      };

      If(frameGridCount.greaterThan(0), () => {
        const cascade = grid.findCascade(position, int(0)).toVar();

        If(cascade.greaterThanEqual(0), () => {
          const uvw = grid.gridUvw(cascade, position).toVar();

          sampleProbes(cascade, uvw, float(1.0));

          const sideDistance = min(uvw, vec3(1.0).sub(uvw));
          const blend = float(1.0)
            .sub(smoothstep(0.0, 0.1, min(sideDistance.x, min(sideDistance.y, sideDistance.z))))
            .toVar();

          If(blend.greaterThan(0.0), () => {
            const nextCascade = grid.findCascade(position, cascade.add(1)).toVar();

            If(nextCascade.greaterThanEqual(0), () => {
              sampleProbes(nextCascade, grid.gridUvw(nextCascade, position), blend);
            });
          });
        }).Else(() => {
          const lastCascade = frameGridCount.sub(1).toVar();
          const inset = float(0.5).div(frameGridResolution);
          const uvw = clamp(
            grid.gridUvw(lastCascade, position),
            vec3(inset),
            vec3(float(1.0).sub(inset)),
          ).toVar();
          const toEdge = frameGridMin
            .element(lastCascade)
            .add(uvw.mul(frameGridSize.element(lastCascade)))
            .sub(probeCenter);
          const toPoint = position.sub(probeCenter);

          sampleProbes(lastCascade, uvw, float(1.0));
          falloff.assign(min(1.0, dot(toEdge, toEdge).div(max(dot(toPoint, toPoint), 1e-6))));
        });
      });

      const normal = normalWorld;

      return max(
        vec3(
          red.x.add(dot(red.yzw, normal)),
          green.x.add(dot(green.yzw, normal)),
          blue.x.add(dot(blue.yzw, normal)),
        ),
        vec3(0.0),
      ).mul(falloff.mul(probeActive));
    })();

    builder.context.irradiance.addAssign(this.colorNode.mul(irradiance));
  }
}

// NOTE Light from the emissive grids of all visible volumes. WebGPURenderer: a light node lights the lit materials.
// NOTE Add one to the scene. Lit pixels read 6 texels (12 near the side of a cascade), for any number of volumes.
export class FrameEmissionLight extends FrameEmissionLightBase {
  constructor(props) {
    super(props);

    // NOTE Float targets for the volumes: intensities in world units do not overflow
    this.directionTarget = createTarget(2, Three.FloatType, Three.NearestFilter);
    this.emitterTarget = createTarget(2, Three.FloatType, Three.NearestFilter);
    this.probeTarget = createTarget(3, Three.HalfFloatType, Three.LinearFilter, atlasSize, atlasSize);

    // NOTE One draw for each changed volume, in one render
    this.directionScene = new Three.Scene();
    this.directionScene.matrixWorldAutoUpdate = false;
    this.directionPool = [];
    // NOTE RendererUtils fills this object. It must not be null.
    this.rendererState = {};

    if (typeof Three.Light.registerNode !== 'function') {
      console.warn('FrameEmissionLight: needs three.js r187 or newer (Light.registerNode).');
    }
  }

  // NOTE CPU mipmaps are built after the conversion, the same as in the frame renderer
  updateMipmaps(frameVolume, volume) {
    if (frameVolume.mipmaps && !(frameVolume.source ?? frameVolume).process) {
      updateVolumeMipmaps(volume);
    }
  }

  // NOTE New targets, because setSize() destroys the GPU textures that materials still bind
  resizeSlots() {
    this.directionTarget.dispose();
    this.emitterTarget.dispose();
    this.directionTarget = createTarget(2, Three.FloatType, Three.NearestFilter, directionCount, this.slotCount);
    this.emitterTarget = createTarget(2, Three.FloatType, Three.NearestFilter, 1, this.slotCount);
  }

  getDirectionMesh(index) {
    if (!this.directionPool[index]) {
      const { directionMaterial } = getPasses();
      const mesh = new Three.Mesh(createGeometry(quadPositions), directionMaterial);

      mesh.frustumCulled = false;
      mesh.matrixAutoUpdate = false;
      mesh.onBeforeRender = () => {
        const { emitter, slot } = mesh.userData;

        setVolumeUniforms(directionMaterial.volumeUniforms, emitter.frameVolume, emitter);
        directionMaterial.frameSlot.value = slot;
        directionMaterial.frameTargetSize.value.set(directionCount, this.slotCount);
        directionMaterial.frameEmitterCenter.value.copy(emitter.center);
        directionMaterial.frameEmitterRadius.value = emitter.radius;
        directionMaterial.frameSteps.value = this.getSteps();
      };

      this.directionScene.add(mesh);
      this.directionPool[index] = mesh;
    }

    return this.directionPool[index];
  }

  // NOTE Runs the passes of changed volumes. Called by the light node before the lit meshes of each render.
  updateProbes(renderer, scene, viewCamera) {
    const changed = this.prepareProbes(scene, viewCamera);

    if (!changed) {
      return;
    }

    changed.forEach(({ emitter, slot }, index) => {
      const mesh = this.getDirectionMesh(index);

      mesh.userData.emitter = emitter;
      mesh.userData.slot = slot;
    });

    const { directionMaterial, reduceMaterial, probeMaterial, reduceScene, probeScene, camera } = getPasses();

    this.rendererState = Three.RendererUtils.resetRendererState(renderer, this.rendererState);

    // NOTE Each pass writes all its texels. Rows of volumes that did not change stay.
    renderer.autoClear = false;

    try {
      if (changed.length > 0) {
        directionMaterial.setMipmaps(
          this.emitters.slice(0, this.emitterCount).some(({ frameVolume }) => frameVolume.mipmaps),
        );

        this.directionPool.forEach((mesh, index) => {
          mesh.visible = index < changed.length;
        });

        renderer.setRenderTarget(this.directionTarget);
        renderer.render(this.directionScene, camera);

        reduceMaterial.frameTargetSize.value.set(1, this.slotCount);
        reduceMaterial.frameDirectionSize.value.set(directionCount, this.slotCount);
        reduceMaterial.frameDirectionIntensity.value = this.directionTarget.textures[0];
        reduceMaterial.frameDirectionCenter.value = this.directionTarget.textures[1];

        renderer.setRenderTarget(this.emitterTarget);
        renderer.render(reduceScene, camera);
      }

      setProbeGridUniforms(probeMaterial.gridUniforms, this);
      probeMaterial.frameEmitterCount.value = this.emitterCount;
      probeMaterial.frameEmitterSize.value.set(1, this.slotCount);
      probeMaterial.frameEmitterIntensity.value = this.emitterTarget.textures[0];
      probeMaterial.frameEmitterCenter.value = this.emitterTarget.textures[1];

      renderer.setRenderTarget(this.probeTarget);
      renderer.render(probeScene, camera);
    } finally {
      Three.RendererUtils.restoreRendererState(renderer, this.rendererState);
    }
  }

  dispose() {
    super.dispose();

    this.directionTarget.dispose();
    this.emitterTarget.dispose();
    this.probeTarget.dispose();
    this.directionPool.forEach((mesh) => mesh.geometry.dispose());
    this.directionPool = [];
  }
}

if (typeof Three.Light.registerNode === 'function') {
  FrameEmissionLight.registerNode(FrameEmissionLightNode);
}

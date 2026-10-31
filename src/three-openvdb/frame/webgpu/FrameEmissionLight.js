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
  vec2,
  vec3,
  vec4,
  uniform,
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
  mod,
  min,
  max,
  abs,
  inverseSqrt,
} from 'three/tsl';
import { updateVolumeMipmaps } from './frameMipmaps';
import {
  frameFragCoord,
  frameLoad,
  frameSample,
  frameFullscreenVertex,
  createVolumeUniforms,
  createVolumeNodes,
  setVolumeUniforms,
} from './frameShaderChunks';

// NOTE Directions of the emitted light of each volume, and rays on each side of the square that covers the volume
const directionCount = 16;
const rayCount = 8;

// NOTE The probe atlas has the size for the largest grid. Then a new resolution does not make a new texture.
// NOTE Lit materials keep old texture bindings until they change, so the probe texture must stay the same.
const maxResolution = 32;
const atlasColumns = Math.ceil(Math.sqrt(maxResolution));
const atlasSize = maxResolution * atlasColumns;

// NOTE Golden angle in radians. Fibonacci directions turn by this angle.
const goldenAngle = Math.PI * (3.0 - Math.sqrt(5.0));

const unitBox = new Three.Box3(
  new Three.Vector3(-0.5, -0.5, -0.5),
  new Three.Vector3(0.5, 0.5, 0.5),
);
const gridBox = new Three.Box3();
const boxSize = new Three.Vector3();
const corner = new Three.Vector3();

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

const textureKey = (map) => (map ? `${map.id}.${map.version}` : '-');

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
    this.frameResolution = uniform(1.0);
    this.frameColumns = uniform(1.0);
    this.frameAtlasSize = uniform(new Three.Vector2(1.0, 1.0));
    this.frameProbeMin = uniform(new Three.Vector3());
    this.frameProbeSize = uniform(new Three.Vector3(1.0, 1.0, 1.0));
    this.frameEmitterCount = uniform(0, 'int');
    this.frameEmitterSize = uniform(new Three.Vector2(1.0, 1.0));
    this.frameEmitterIntensity = texture(new Three.Texture());
    this.frameEmitterCenter = texture(new Three.Texture());

    const outputRed = property('vec4');
    const outputGreen = property('vec4');
    const outputBlue = property('vec4');

    this.vertexNode = frameFullscreenVertex;

    this.colorNode = Fn(() => {
      const fragCoord = frameFragCoord(this.frameAtlasSize).toVar();
      const tile = floor(fragCoord.div(this.frameResolution)).toVar();
      const slice = tile.y.mul(this.frameColumns).add(tile.x).toVar();

      If(tile.x.greaterThanEqual(this.frameColumns).or(slice.greaterThanEqual(this.frameResolution)), () => {
        Discard();
      });

      const probeUvw = vec3(fragCoord.sub(tile.mul(this.frameResolution)), slice.add(0.5)).div(
        this.frameResolution,
      );
      const probe = this.frameProbeMin.add(probeUvw.mul(this.frameProbeSize)).toVar();

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

// NOTE Probe grid irradiance at the shaded point. Past the grid, the edge probes fall off with distance squared.
// NOTE Hardware bilinear filter in a slice, manual linear filter between slices.
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

    // NOTE Render group, the same as three.js lights. Lit materials without node changes refresh only shared bindings.
    this.probeMaps = maps.map((map) => texture(map).setGroup(renderGroup));
    this.probeResolution = uniform(1.0).setGroup(renderGroup);
    this.probeColumns = uniform(1.0).setGroup(renderGroup);
    this.probeAtlasSize = uniform(new Three.Vector2(1.0, 1.0)).setGroup(renderGroup);
    this.probeMin = uniform(new Three.Vector3()).setGroup(renderGroup);
    this.probeSize = uniform(new Three.Vector3(1.0, 1.0, 1.0)).setGroup(renderGroup);
    this.probeCenter = uniform(new Three.Vector3()).setGroup(renderGroup);
    this.probeActive = uniform(0.0).setGroup(renderGroup);
  }

  updateBefore(frame) {
    // NOTE No passes while three.js precompiles materials (compileAsync), the same as shadow maps
    if (frame.renderer._precompilationState) {
      return;
    }

    this.light.updateProbes(frame.renderer, frame.scene);
  }

  update(frame) {
    super.update(frame);

    const { light } = this;

    this.probeResolution.value = light.probeLayout.resolution;
    this.probeColumns.value = light.probeLayout.columns;
    this.probeAtlasSize.value.set(light.probeTarget.width, light.probeTarget.height);
    this.probeMin.value.copy(light.probeMin);
    this.probeSize.value.copy(light.probeSize);
    this.probeCenter.value.copy(light.probeCenter);
    this.probeActive.value = light.emitterCount > 0 ? 1.0 : 0.0;

  }

  setup(builder) {
    const { probeResolution, probeColumns, probeAtlasSize, probeMin, probeSize, probeCenter } = this;
    const [redMap, greenMap, blueMap] = this.probeMaps;

    const irradiance = Fn(() => {
      const position = positionWorld.toVar();
      const inset = float(0.5).div(probeResolution);
      const probeUvw = clamp(
        position.sub(probeMin).div(probeSize),
        vec3(inset),
        vec3(float(1.0).sub(inset)),
      ).toVar();
      const toEdge = probeMin.add(probeUvw.mul(probeSize)).sub(probeCenter);
      const toPoint = position.sub(probeCenter);
      const falloff = min(1.0, dot(toEdge, toEdge).div(max(dot(toPoint, toPoint), 1e-6)));

      const z = probeUvw.z.mul(probeResolution).sub(0.5);
      const z0 = clamp(floor(z), 0.0, probeResolution.sub(1.0)).toVar();
      const z1 = min(z0.add(1.0), probeResolution.sub(1.0)).toVar();
      const blend = clamp(z.sub(z0), 0.0, 1.0).toVar();
      const xy = probeUvw.xy.mul(probeResolution).toVar();

      const tileUv = (slice) =>
        vec2(mod(slice, probeColumns), floor(slice.div(probeColumns)))
          .mul(probeResolution)
          .add(xy)
          .div(probeAtlasSize);

      const sampleProbes = (map) =>
        mix(frameSample(map, tileUv(z0)), frameSample(map, tileUv(z1)), blend).toVar();

      const red = sampleProbes(redMap);
      const green = sampleProbes(greenMap);
      const blue = sampleProbes(blueMap);
      const normal = normalWorld;

      return max(
        vec3(
          red.x.add(dot(red.yzw, normal)),
          green.x.add(dot(green.yzw, normal)),
          blue.x.add(dot(blue.yzw, normal)),
        ),
        vec3(0.0),
      ).mul(falloff.mul(this.probeActive));
    })();

    builder.context.irradiance.addAssign(this.colorNode.mul(irradiance));
  }
}

// NOTE The same fields as a volume of FrameVolume, then setVolumeUniforms reads it. View matrices are not used.
const createEmitter = () => ({
  frameVolume: null,
  volume: null,
  key: '',
  matrixWorld: new Three.Matrix4(),
  worldToLocal: new Three.Matrix4(),
  localToView: new Three.Matrix4(),
  viewToLocal: new Three.Matrix4(),
  worldBox: new Three.Box3(),
  center: new Three.Vector3(),
  radius: 0.0,
  get densityMap3D() {
    return this.volume.densityMap3D;
  },
  get emissiveMap3D() {
    return this.volume.emissiveMap3D;
  },
  get baseColorMap3D() {
    return this.volume.baseColorMap3D;
  },
  get maskMap3D() {
    return this.volume.maskMap3D;
  },
  get mipMaps() {
    return this.volume.mipMaps;
  },
});

// NOTE Light from the emissive grids of all visible FrameVolume objects in the scene, also instances and animations.
// NOTE Add one to the scene. Lit pixels read 6 texels, for any number of volumes.
// NOTE 1. Each changed volume gets its emitted light and emission center. 2. A probe grid adds the light of all volumes.
export class FrameEmissionLight extends Three.Light {
  isFrameEmissionLight = true;

  emitters = [];
  emitterCount = 0;
  slotKeys = [];
  slotCount = 0;
  probeKey = '';

  constructor(props = {}) {
    const {
      color = 0xffffff,
      intensity = 1.0,
      // NOTE Probes on each axis of the probe grid, 2 to 32
      resolution = 16,
      // NOTE Size of the probe grid, as a multiple of the box of all emitting volumes. Past it, light falls off with distance squared.
      range = 3.0,
      // NOTE Steps of each ray in a volume
      steps = 24,
    } = props;

    super(color, intensity);

    this.type = 'FrameEmissionLight';
    this.resolution = resolution;
    this.range = range;
    this.steps = steps;

    this.probeMin = new Three.Vector3();
    this.probeSize = new Three.Vector3(1.0, 1.0, 1.0);
    this.probeCenter = new Three.Vector3();
    this.probeLayout = { resolution: 2, columns: atlasColumns, width: atlasSize, height: atlasSize };

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

  getSteps() {
    return Math.max(1, Math.round(this.steps));
  }

  collectEmitters(scene) {
    let count = 0;

    scene.traverseVisible((object) => {
      if (!object.isFrameVolume) {
        return;
      }

      // NOTE Mipmaps are built after the conversion, the same as in the frame renderer
      const converting = !!(object.source ?? object).process;

      object.volumes.forEach((volume) => {
        if (!volume.ready || !volume.emissiveMap3D) {
          return;
        }

        if (object.mipmaps && !converting) {
          updateVolumeMipmaps(volume);
        }

        if (!this.emitters[count]) {
          this.emitters[count] = createEmitter();
        }

        const emitter = this.emitters[count++];

        emitter.frameVolume = object;
        emitter.volume = volume;
        emitter.matrixWorld.multiplyMatrices(object.matrixWorld, volume.matrix);
        emitter.worldToLocal.copy(emitter.matrixWorld).invert();
        emitter.worldBox.copy(unitBox).applyMatrix4(emitter.matrixWorld);
        emitter.center.setFromMatrixPosition(emitter.matrixWorld);
        emitter.radius = 0.0;

        for (let i = 0; i < 8; i++) {
          corner
            .set(i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, i & 4 ? 0.5 : -0.5)
            .applyMatrix4(emitter.matrixWorld);

          emitter.radius = Math.max(emitter.radius, corner.distanceTo(emitter.center));
        }

        emitter.key = [
          textureKey(volume.densityMap3D),
          textureKey(volume.emissiveMap3D),
          textureKey(volume.maskMap3D),
          Object.values(volume.mipMaps ?? {})
            .map((mip) => mip.texture.id)
            .join(':'),
          object.extinction,
          object.densityScale,
          object.densityCutoff,
          object.absorbance,
          object.emissiveIntensity,
          object.temperatureRange.x,
          object.temperatureRange.y,
          object.offset3D.x,
          object.offset3D.y,
          object.offset3D.z,
          object.wrap3D,
          object.mipmaps,
          this.getSteps(),
          ...emitter.matrixWorld.elements,
        ].join(',');
      });
    });

    this.emitterCount = count;
  }

  // NOTE The box of all emitters, with a margin of (range - 1) / 2 of its longest side on each side
  updateProbeGrid() {
    const resolution = Three.MathUtils.clamp(Math.round(this.resolution), 2, maxResolution);

    this.probeLayout = { resolution, columns: atlasColumns, width: atlasSize, height: atlasSize };

    gridBox.makeEmpty();

    for (let i = 0; i < this.emitterCount; i++) {
      gridBox.union(this.emitters[i].worldBox);
    }

    gridBox.getCenter(this.probeCenter);
    gridBox.getSize(boxSize);
    gridBox.expandByScalar((Math.max(boxSize.x, boxSize.y, boxSize.z) * Math.max(0.0, this.range - 1.0)) / 2.0);
    this.probeMin.copy(gridBox.min);
    gridBox.getSize(this.probeSize).max(corner.set(1e-6, 1e-6, 1e-6));
  }

  // NOTE Slots grow to the next power of two. New targets are empty, so all volumes draw again.
  // NOTE Resize makes new targets. setSize() destroys the GPU textures that materials still bind.
  updateSlots() {
    if (this.emitterCount <= this.slotCount) {
      return;
    }

    this.slotCount = Math.pow(2, Math.ceil(Math.log2(Math.max(1, this.emitterCount))));
    this.slotKeys = [];
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
  updateProbes(renderer, scene) {
    this.collectEmitters(scene);
    this.updateSlots();

    let changed = 0;

    for (let i = 0; i < this.emitterCount; i++) {
      const emitter = this.emitters[i];

      if (this.slotKeys[i] !== emitter.key) {
        this.slotKeys[i] = emitter.key;

        const mesh = this.getDirectionMesh(changed++);

        mesh.userData.emitter = emitter;
        mesh.userData.slot = i;
      }
    }

    const probeKey = `${this.emitterCount},${this.resolution},${this.range}`;

    if (changed === 0 && probeKey === this.probeKey) {
      return;
    }

    this.probeKey = probeKey;

    if (this.emitterCount === 0) {
      return;
    }

    this.updateProbeGrid();

    const { width, height, resolution, columns } = this.probeLayout;

    const { directionMaterial, reduceMaterial, probeMaterial, reduceScene, probeScene, camera } = getPasses();

    this.rendererState = Three.RendererUtils.resetRendererState(renderer, this.rendererState);

    // NOTE Each pass writes all its texels. Rows of volumes that did not change stay.
    renderer.autoClear = false;

    try {
      if (changed > 0) {
        directionMaterial.setMipmaps(
          this.emitters.slice(0, this.emitterCount).some(({ frameVolume }) => frameVolume.mipmaps),
        );

        this.directionPool.forEach((mesh, index) => {
          mesh.visible = index < changed;
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

      probeMaterial.frameResolution.value = resolution;
      probeMaterial.frameColumns.value = columns;
      probeMaterial.frameAtlasSize.value.set(width, height);
      probeMaterial.frameProbeMin.value.copy(this.probeMin);
      probeMaterial.frameProbeSize.value.copy(this.probeSize);
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
    this.directionTarget.dispose();
    this.emitterTarget.dispose();
    this.probeTarget.dispose();
    this.directionPool.forEach((mesh) => mesh.geometry.dispose());
    this.directionPool = [];
    this.slotKeys = [];
    this.probeKey = '';
  }
}

if (typeof Three.Light.registerNode === 'function') {
  FrameEmissionLight.registerNode(FrameEmissionLightNode);
}

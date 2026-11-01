import * as Three from 'three';
import {
  FrameEmissionLightBase,
  frameEmissionDirections,
  frameEmissionRays,
  frameEmissionMaxCascades,
  frameEmissionAtlasColumns,
  frameEmissionAtlasSize,
} from '../core/FrameEmissionLight.js';
import { frameRenderer } from './FrameRenderer.js';
import { volumePars, gridPars, createVolumeUniforms, setVolumeUniforms } from './frameShaderChunks.js';

// NOTE Golden angle in radians. Fibonacci directions turn by this angle.
const goldenAngle = Math.PI * (3.0 - Math.sqrt(5.0));

const fullscreenPositions = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
const quadPositions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0];

const createGeometry = (positions) => {
  const geometry = new Three.BufferGeometry();
  geometry.setAttribute('position', new Three.Float32BufferAttribute(positions, 3));

  return geometry;
};

const createTarget = (count, type, filter, width = 1, height = 1) =>
  new Three.WebGLRenderTarget(width, height, {
    count,
    type,
    format: Three.RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    generateMipmaps: false,
    depthBuffer: false,
  });

const createPassMaterial = (uniforms, vertexShader, fragmentShader) =>
  new Three.ShaderMaterial({
    glslVersion: Three.GLSL3,
    uniforms,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    blending: Three.NoBlending,
  });

const fullscreenVertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// NOTE The quad covers the row of the slot
const directionVertexShader = `
  uniform float frameSlot;
  uniform vec2 frameTargetSize;

  void main() {
    gl_Position = vec4(position.x, (frameSlot + position.y * 0.5 + 0.5) / frameTargetSize.y * 2.0 - 1.0, 0.0, 1.0);
  }
`;

// NOTE Light that one volume sends in one direction. One texel for each direction, one row for each volume.
// NOTE Parallel rays cover the bounding sphere. Each ray adds the emission with the transmittance of the volume.
// NOTE Output 0: intensity (emission times ray area) and the bounding radius. Output 1: luminance-weighted world position.
const directionFragmentShader = `
  precision highp float;

  layout(location = 0) out highp vec4 frameOutputIntensity;
  layout(location = 1) out highp vec4 frameOutputCenter;

  #define FRAME_DIRECTIONS ${frameEmissionDirections}
  #define FRAME_RAYS ${frameEmissionRays}
  #define FRAME_GOLDEN_ANGLE ${goldenAngle}

  ${volumePars}

  uniform vec3 frameEmitterCenter;
  uniform float frameEmitterRadius;
  uniform int frameSteps;

  void main() {
    // NOTE Fibonacci sphere direction, from the volume to the viewer
    float index = floor(gl_FragCoord.x);
    float y = 1.0 - (index * 2.0 + 1.0) / float(FRAME_DIRECTIONS);
    float ring = sqrt(max(0.0, 1.0 - y * y));
    float phi = index * FRAME_GOLDEN_ANGLE;
    vec3 direction = vec3(cos(phi) * ring, y, sin(phi) * ring);
    vec3 helper = abs(direction.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(helper, direction));
    vec3 bitangent = cross(direction, tangent);

    float diameter = frameEmitterRadius * 2.0;
    float spacing = diameter / float(FRAME_RAYS);
    float stepCount = float(frameSteps);
    vec3 intensity = vec3(0.0);
    vec4 center = vec4(0.0);

    for (int r = 0; r < FRAME_RAYS * FRAME_RAYS; r++) {
      float u = (float(r % FRAME_RAYS) + 0.5) / float(FRAME_RAYS) * 2.0 - 1.0;
      float v = (float(r / FRAME_RAYS) + 0.5) / float(FRAME_RAYS) * 2.0 - 1.0;
      vec3 worldStart = frameEmitterCenter + direction * frameEmitterRadius + tangent * (u * frameEmitterRadius) + bitangent * (v * frameEmitterRadius);
      vec3 worldEnd = worldStart - direction * diameter;
      vec3 localStart = (frameWorldToLocal * vec4(worldStart, 1.0)).xyz;
      vec3 localEnd = (frameWorldToLocal * vec4(worldEnd, 1.0)).xyz;
      vec2 segment = frameBoxSegment(localStart, localEnd);

      if (segment.x >= segment.y) {
        continue;
      }

      float segmentLength = segment.y - segment.x;
      float stepLength = segmentLength * diameter / stepCount;
      // NOTE Smoke uses the mip level of the step. Emission uses level 0: power grows with temperature^4, mipmaps lose it.
      float lod = frameLod(stepLength / frameWorldScale);
      float transmittance = 1.0;

      for (int s = 0; s < frameSteps; s++) {
        float t = segment.x + segmentLength * (float(s) + 0.5) / stepCount;
        vec3 localPosition = mix(localStart, localEnd, t);
        float extinction = frameSampleExtinction(localPosition, lod);

        if (extinction <= 0.0) {
          continue;
        }

        // NOTE Absorbance scales the shadow of the volume, the same as for scene lights
        float alpha = 1.0 - exp(-extinction * stepLength);
        vec3 radiance = frameSampleEmission(localPosition, 0.0) * transmittance * alpha;

        intensity += radiance;
        center += vec4(mix(worldStart, worldEnd, t), 1.0) * dot(radiance, vec3(0.2126, 0.7152, 0.0722));
        transmittance *= exp(-extinction * frameAbsorbance * stepLength);

        if (transmittance < 0.01) {
          break;
        }
      }
    }

    float area = spacing * spacing;

    frameOutputIntensity = vec4(intensity * area, frameEmitterRadius);
    frameOutputCenter = center * area;
  }
`;

// NOTE One texel for each volume: mean intensity of all directions, and the center of the visible emission
const reduceFragmentShader = `
  precision highp float;

  layout(location = 0) out highp vec4 frameOutputIntensity;
  layout(location = 1) out highp vec4 frameOutputCenter;

  #define FRAME_DIRECTIONS ${frameEmissionDirections}

  uniform highp sampler2D frameDirectionIntensity;
  uniform highp sampler2D frameDirectionCenter;

  void main() {
    int row = int(gl_FragCoord.y);
    vec4 intensity = vec4(0.0);
    vec4 center = vec4(0.0);

    for (int i = 0; i < FRAME_DIRECTIONS; i++) {
      intensity += texelFetch(frameDirectionIntensity, ivec2(i, row), 0);
      center += texelFetch(frameDirectionCenter, ivec2(i, row), 0);
    }

    frameOutputIntensity = intensity / float(FRAME_DIRECTIONS);
    frameOutputCenter = center.w > 0.0 ? vec4(center.xyz / max(center.w, 1e-12), 1.0) : vec4(0.0);
  }
`;

// NOTE L1 irradiance of all volumes at each probe: E(n) = x + dot(yzw, n) for each color channel.
// NOTE Each volume is a point light at its emission center. Near the center, its radius softens the distance.
const probeFragmentShader = `
  precision highp float;

  layout(location = 0) out highp vec4 frameOutputRed;
  layout(location = 1) out highp vec4 frameOutputGreen;
  layout(location = 2) out highp vec4 frameOutputBlue;

  #define FRAME_ATLAS_COLUMNS ${frameEmissionAtlasColumns}.0

  ${gridPars}

  uniform int frameEmitterCount;
  uniform highp sampler2D frameEmitterIntensity;
  uniform highp sampler2D frameEmitterCenter;

  void main() {
    // NOTE Tiles right of the atlas columns are not used. Smaller grids leave them empty.
    if (gl_FragCoord.x >= frameGridResolution * FRAME_ATLAS_COLUMNS) {
      discard;
    }

    vec3 gridUvw;
    int cascade = frameGetGridCell(gl_FragCoord.xy, gridUvw);

    if (cascade >= frameGridCount) {
      discard;
    }

    vec3 probe = frameGridMin[cascade] + gridUvw * frameGridSize[cascade];
    vec3 constant = vec3(0.0);
    vec3 directionRed = vec3(0.0);
    vec3 directionGreen = vec3(0.0);
    vec3 directionBlue = vec3(0.0);

    for (int i = 0; i < frameEmitterCount; i++) {
      vec4 center = texelFetch(frameEmitterCenter, ivec2(0, i), 0);

      if (center.w <= 0.0) {
        continue;
      }

      vec4 emitter = texelFetch(frameEmitterIntensity, ivec2(0, i), 0);
      vec3 toProbe = probe - center.xyz;
      float distanceSquared = dot(toProbe, toProbe);
      float soft = emitter.w * 0.25;
      float softDistanceSquared = distanceSquared + soft * soft;
      vec3 irradiance = emitter.rgb / softDistanceSquared;

      // NOTE L1 projection of a point light: E(n) = E / 4 + E / 2 * dot(l, n). The direction fades near the center.
      vec3 toLight = toProbe * inversesqrt(max(distanceSquared, 1e-12)) * (distanceSquared / softDistanceSquared * -0.5);

      constant += irradiance * 0.25;
      directionRed += toLight * irradiance.r;
      directionGreen += toLight * irradiance.g;
      directionBlue += toLight * irradiance.b;
    }

    frameOutputRed = vec4(constant.r, directionRed);
    frameOutputGreen = vec4(constant.g, directionGreen);
    frameOutputBlue = vec4(constant.b, directionBlue);
  }
`;

// NOTE Probe cascades in the uniform names of gridPars. Cascade 0 is the finest.
const createProbeGridUniforms = () => ({
  frameGridMin: { value: Array.from({ length: frameEmissionMaxCascades }, () => new Three.Vector3()) },
  frameGridSize: {
    value: Array.from({ length: frameEmissionMaxCascades }, () => new Three.Vector3(1.0, 1.0, 1.0)),
  },
  frameGridVoxel: {
    value: Array.from({ length: frameEmissionMaxCascades }, () => new Three.Vector3(1.0, 1.0, 1.0)),
  },
  frameGridCount: { value: 0 },
  frameGridResolution: { value: 1.0 },
  frameGridColumns: { value: frameEmissionAtlasColumns },
  frameGridAtlasSize: { value: new Three.Vector2(frameEmissionAtlasSize, frameEmissionAtlasSize) },
});

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

    const reduceMaterial = createPassMaterial(
      {
        frameDirectionIntensity: { value: null },
        frameDirectionCenter: { value: null },
      },
      fullscreenVertexShader,
      reduceFragmentShader,
    );
    const probeMaterial = createPassMaterial(
      {
        ...createProbeGridUniforms(),
        frameEmitterCount: { value: 0 },
        frameEmitterIntensity: { value: null },
        frameEmitterCenter: { value: null },
      },
      fullscreenVertexShader,
      probeFragmentShader,
    );

    passes = {
      directionMaterial: createPassMaterial(
        {
          ...createVolumeUniforms(),
          frameSlot: { value: 0.0 },
          frameTargetSize: { value: new Three.Vector2(frameEmissionDirections, 1.0) },
          frameEmitterCenter: { value: new Three.Vector3() },
          frameEmitterRadius: { value: 1.0 },
          frameSteps: { value: 24 },
        },
        directionVertexShader,
        directionFragmentShader,
      ),
      reduceMaterial,
      probeMaterial,
      reduceScene: createPassScene(reduceMaterial),
      probeScene: createPassScene(probeMaterial),
      camera: new Three.OrthographicCamera(),
      clearColor: new Three.Color(),
      updaterMaterial: new Three.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        depthTest: false,
      }),
      patchFrame: -1,
    };
  }

  return passes;
};

const setProbeGridUniforms = (uniforms, light) => {
  for (let i = 0; i < frameEmissionMaxCascades; i++) {
    uniforms.frameGridMin.value[i].copy(light.cascadeMin[i]);
    uniforms.frameGridSize.value[i].copy(light.cascadeSize[i]);
  }

  uniforms.frameGridCount.value = light.cascadeCount;
  uniforms.frameGridResolution.value = light.probeResolution;
};

// NOTE Probe irradiance at a world position, from the finest cascade that contains it.
// NOTE Past the last cascade, its edge probes fall off with distance squared.
// NOTE Near the side of a cascade, the next cascade blends in, the same as the shadow grid.
// NOTE Grid is (resolution, atlas columns, atlas width, atlas height).
const irradiancePars = `
  #define FRAME_EMISSION_CASCADES ${frameEmissionMaxCascades}

  vec3 frameEmissionUvw(vec3 gridMin[FRAME_EMISSION_CASCADES], vec3 gridSize[FRAME_EMISSION_CASCADES], int cascade, vec3 position) {
    return (position - gridMin[cascade]) / gridSize[cascade];
  }

  int frameEmissionFindCascade(
    vec3 gridMin[FRAME_EMISSION_CASCADES],
    vec3 gridSize[FRAME_EMISSION_CASCADES],
    int gridCount,
    float resolution,
    vec3 position,
    int firstCascade
  ) {
    float inset = 0.5 / resolution;

    for (int i = 0; i < FRAME_EMISSION_CASCADES; i++) {
      if (i >= gridCount) {
        break;
      }

      vec3 uvw = frameEmissionUvw(gridMin, gridSize, i, position);

      if (i >= firstCascade && all(greaterThanEqual(uvw, vec3(inset))) && all(lessThanEqual(uvw, vec3(1.0 - inset)))) {
        return i;
      }
    }

    return -1;
  }

  vec4 frameEmissionSample(sampler2D atlas, vec4 grid, int cascade, vec3 uvw) {
    float resolution = grid.x;
    float columns = grid.y;
    float z = uvw.z * resolution - 0.5;
    float z0 = clamp(floor(z), 0.0, resolution - 1.0);
    float z1 = min(z0 + 1.0, resolution - 1.0);
    float blend = clamp(z - z0, 0.0, 1.0);
    vec2 xy = clamp(uvw.xy * resolution, vec2(0.5), vec2(resolution - 0.5));
    float tile0Index = float(cascade) * resolution + z0;
    float tile1Index = float(cascade) * resolution + z1;
    vec2 tile0 = vec2(mod(tile0Index, columns), floor(tile0Index / columns));
    vec2 tile1 = vec2(mod(tile1Index, columns), floor(tile1Index / columns));

    return mix(texture(atlas, (tile0 * resolution + xy) / grid.zw), texture(atlas, (tile1 * resolution + xy) / grid.zw), blend);
  }

  vec3 frameEmissionIrradiance(
    sampler2D mapRed,
    sampler2D mapGreen,
    sampler2D mapBlue,
    vec3 gridMin[FRAME_EMISSION_CASCADES],
    vec3 gridSize[FRAME_EMISSION_CASCADES],
    int gridCount,
    vec4 grid,
    vec3 probeCenter,
    vec3 position,
    vec3 normal
  ) {
    if (gridCount <= 0) {
      return vec3(0.0);
    }

    vec4 red;
    vec4 green;
    vec4 blue;
    float falloff = 1.0;
    int cascade = frameEmissionFindCascade(gridMin, gridSize, gridCount, grid.x, position, 0);

    if (cascade >= 0) {
      vec3 uvw = frameEmissionUvw(gridMin, gridSize, cascade, position);

      red = frameEmissionSample(mapRed, grid, cascade, uvw);
      green = frameEmissionSample(mapGreen, grid, cascade, uvw);
      blue = frameEmissionSample(mapBlue, grid, cascade, uvw);

      vec3 sideDistance = min(uvw, 1.0 - uvw);
      float blend = 1.0 - smoothstep(0.0, 0.1, min(sideDistance.x, min(sideDistance.y, sideDistance.z)));
      int nextCascade = blend > 0.0 ? frameEmissionFindCascade(gridMin, gridSize, gridCount, grid.x, position, cascade + 1) : -1;

      if (nextCascade >= 0) {
        vec3 nextUvw = frameEmissionUvw(gridMin, gridSize, nextCascade, position);

        red = mix(red, frameEmissionSample(mapRed, grid, nextCascade, nextUvw), blend);
        green = mix(green, frameEmissionSample(mapGreen, grid, nextCascade, nextUvw), blend);
        blue = mix(blue, frameEmissionSample(mapBlue, grid, nextCascade, nextUvw), blend);
      }
    } else {
      int lastCascade = gridCount - 1;
      float inset = 0.5 / grid.x;
      vec3 uvw = clamp(frameEmissionUvw(gridMin, gridSize, lastCascade, position), vec3(inset), vec3(1.0 - inset));
      vec3 toEdge = gridMin[lastCascade] + uvw * gridSize[lastCascade] - probeCenter;
      vec3 toPoint = position - probeCenter;

      red = frameEmissionSample(mapRed, grid, lastCascade, uvw);
      green = frameEmissionSample(mapGreen, grid, lastCascade, uvw);
      blue = frameEmissionSample(mapBlue, grid, lastCascade, uvw);
      falloff = min(1.0, dot(toEdge, toEdge) / max(dot(toPoint, toPoint), 1e-6));
    }

    return max(
      vec3(red.x + dot(red.yzw, normal), green.x + dot(green.yzw, normal), blue.x + dot(blue.yzw, normal)),
      vec3(0.0)
    ) * falloff;
  }
`;

const uniformNames = ['Red', 'Green', 'Blue', 'Min', 'Size', 'Count', 'Grid', 'Center', 'Color'];

const getLightPars = (index) => `
  uniform sampler2D frameEmissionRed${index};
  uniform sampler2D frameEmissionGreen${index};
  uniform sampler2D frameEmissionBlue${index};
  uniform vec3 frameEmissionMin${index}[FRAME_EMISSION_CASCADES];
  uniform vec3 frameEmissionSize${index}[FRAME_EMISSION_CASCADES];
  uniform int frameEmissionCount${index};
  uniform vec4 frameEmissionGrid${index};
  uniform vec3 frameEmissionCenter${index};
  uniform vec3 frameEmissionColor${index};
`;

const getLightIrradiance = (index) => `
  irradiance += frameEmissionColor${index} * frameEmissionIrradiance(
    frameEmissionRed${index},
    frameEmissionGreen${index},
    frameEmissionBlue${index},
    frameEmissionMin${index},
    frameEmissionSize${index},
    frameEmissionCount${index},
    frameEmissionGrid${index},
    frameEmissionCenter${index},
    frameEmissionPosition,
    frameEmissionNormal
  );
`;

// NOTE Adds the probe irradiance to the indirect diffuse light of three.js lit materials.
// NOTE World position and normal come from the view-space geometry of lights_fragment_begin. The view matrix is rigid.
const patchShader = (shader, lights) => {
  if (lights.length === 0) {
    return;
  }

  lights.forEach((light, index) => {
    uniformNames.forEach((name) => {
      shader.uniforms[`frameEmission${name}${index}`] = light.materialUniforms[name];
    });
  });

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <lights_pars_begin>',
      `#include <lights_pars_begin>\n${irradiancePars}\n${lights.map((_, index) => getLightPars(index)).join('\n')}`,
    )
    .replace(
      '#include <lights_fragment_maps>',
      `#include <lights_fragment_maps>
      #if defined( RE_IndirectDiffuse )
      {
        vec3 frameEmissionPosition = cameraPosition + ( vec4( geometryPosition, 0.0 ) * viewMatrix ).xyz;
        vec3 frameEmissionNormal = inverseTransformDirection( geometryNormal, viewMatrix );
        ${lights.map((_, index) => getLightIrradiance(index)).join('\n')}
      }
      #endif`,
    );
};

const isLitMaterial = (material) =>
  !material.isShaderMaterial &&
  (material.isMeshStandardMaterial ||
    material.isMeshLambertMaterial ||
    material.isMeshPhongMaterial ||
    material.isMeshToonMaterial);

// NOTE Emission lights of a scene, found one time for each renderer frame
const sceneLights = { scene: null, frame: -1, lights: [], key: '' };

const getSceneLights = (renderer, scene) => {
  const { frame } = renderer.info.render;

  if (sceneLights.scene !== scene || sceneLights.frame !== frame) {
    const lights = [];

    scene.traverseVisible((object) => {
      if (object.isFrameEmissionLight) {
        lights.push(object);
      }
    });

    sceneLights.scene = scene;
    sceneLights.frame = frame;
    sceneLights.lights = lights;
    sceneLights.key = lights.map(({ id }) => id).join(',');
  }

  return sceneLights;
};

const patchedMaterials = new WeakSet();

// NOTE Material hooks keep the shader in sync with the emission lights of the scene.
// NOTE They also run when no emission light is left, then the shader returns to the original code.
const patchMaterial = (material) => {
  if (patchedMaterials.has(material)) {
    return;
  }

  const state = { key: '', lights: [] };
  const { onBeforeCompile, onBeforeRender, customProgramCacheKey } = material;

  material.onBeforeCompile = function (shader, renderer) {
    onBeforeCompile.call(this, shader, renderer);
    patchShader(shader, state.lights);
  };

  material.customProgramCacheKey = function () {
    return `${customProgramCacheKey.call(this)}|${onBeforeCompile.toString()}|frameEmission:${state.lights.length}`;
  };

  material.onBeforeRender = function (renderer, scene, ...rest) {
    const { lights, key } = getSceneLights(renderer, scene);

    if (key !== state.key) {
      state.key = key;
      state.lights = lights;
      this.needsUpdate = true;
    }

    onBeforeRender.call(this, renderer, scene, ...rest);
  };

  patchedMaterials.add(material);
};

const patchScene = (scene) => {
  scene.traverseVisible((object) => {
    if (!object.material) {
      return;
    }

    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
      if (isLitMaterial(material)) {
        patchMaterial(material);
      }
    });
  });
};

// NOTE Light from the emissive grids of all visible volumes. WebGLRenderer: lit materials get a shader patch.
// NOTE Add one to the scene. The updater mesh is first in the opaque render list and draws nothing.
// NOTE Its onBeforeRender patches new lit materials, then runs the passes before the lit meshes.
export class FrameEmissionLight extends FrameEmissionLightBase {
  constructor(props) {
    super(props);

    // NOTE Float targets for the volumes: intensities in world units do not overflow
    this.directionTarget = createTarget(2, Three.FloatType, Three.NearestFilter);
    this.emitterTarget = createTarget(2, Three.FloatType, Three.NearestFilter);
    this.probeTarget = createTarget(
      3,
      Three.HalfFloatType,
      Three.LinearFilter,
      frameEmissionAtlasSize,
      frameEmissionAtlasSize,
    );

    // NOTE One draw for each changed volume, in one render
    this.directionScene = new Three.Scene();
    this.directionScene.matrixWorldAutoUpdate = false;
    this.directionPool = [];

    // NOTE Shared by the patched materials. Values change in place.
    this.materialUniforms = {
      Red: { value: this.probeTarget.textures[0] },
      Green: { value: this.probeTarget.textures[1] },
      Blue: { value: this.probeTarget.textures[2] },
      Min: { value: this.cascadeMin },
      Size: { value: this.cascadeSize },
      Count: { value: 0 },
      Grid: {
        value: new Three.Vector4(2.0, frameEmissionAtlasColumns, frameEmissionAtlasSize, frameEmissionAtlasSize),
      },
      Center: { value: this.probeCenter },
      Color: { value: new Three.Color() },
    };

    const updaterGeometry = createGeometry([0, 0, 0]);
    updaterGeometry.setDrawRange(0, 0);

    this.updater = new Three.Mesh(updaterGeometry, getPasses().updaterMaterial);
    this.updater.name = 'FrameEmissionLightUpdater';
    this.updater.frustumCulled = false;
    this.updater.renderOrder = -1000000;
    this.updater.onBeforeRender = (renderer, scene, camera) => this.update(renderer, scene, camera);
    this.add(this.updater);
  }

  // NOTE WebGL makes GPU mipmaps. FrameVolume mipmaps can change after creation.
  updateMipmaps(frameVolume, volume) {
    frameRenderer.updateMipmaps(frameVolume, volume);
  }

  resizeSlots() {
    this.directionTarget.dispose();
    this.emitterTarget.dispose();
    this.directionTarget = createTarget(
      2,
      Three.FloatType,
      Three.NearestFilter,
      frameEmissionDirections,
      this.slotCount,
    );
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
        const { uniforms } = directionMaterial;

        setVolumeUniforms(uniforms, emitter.frameVolume, emitter);
        uniforms.frameSlot.value = slot;
        uniforms.frameTargetSize.value.set(frameEmissionDirections, this.slotCount);
        uniforms.frameEmitterCenter.value.copy(emitter.center);
        uniforms.frameEmitterRadius.value = emitter.radius;
        uniforms.frameSteps.value = this.getSteps();

        // NOTE The draws share one material. WebGLRenderer uploads changed uniforms only with this flag.
        directionMaterial.uniformsNeedUpdate = true;
      };

      this.directionScene.add(mesh);
      this.directionPool[index] = mesh;
    }

    return this.directionPool[index];
  }

  update(renderer, scene, camera) {
    if (!renderer.isWebGLRenderer) {
      return;
    }

    const shared = getPasses();

    // NOTE The first emission light of a frame patches new lit materials of the scene
    if (shared.patchFrame !== renderer.info.render.frame) {
      shared.patchFrame = renderer.info.render.frame;
      patchScene(scene);
    }

    this.updateProbes(renderer, scene, camera);

    const { materialUniforms } = this;

    materialUniforms.Color.value.copy(this.color).multiplyScalar(this.intensity);
    materialUniforms.Count.value = this.emitterCount > 0 ? this.cascadeCount : 0;
    materialUniforms.Grid.value.x = this.probeResolution;
  }

  // NOTE Runs the passes of changed volumes, before the lit meshes of each render
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

    const { reduceMaterial, probeMaterial, reduceScene, probeScene, camera, clearColor } = getPasses();
    const currentRenderTarget = renderer.getRenderTarget();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentScissorTest = renderer.getScissorTest();

    renderer.getClearColor(clearColor);

    // NOTE Each pass writes all its texels. Rows of volumes that did not change stay.
    renderer.autoClear = false;
    renderer.setScissorTest(false);

    try {
      if (changed.length > 0) {
        this.directionPool.forEach((mesh, index) => {
          mesh.visible = index < changed.length;
        });

        renderer.setRenderTarget(this.directionTarget);
        renderer.render(this.directionScene, camera);

        reduceMaterial.uniforms.frameDirectionIntensity.value = this.directionTarget.textures[0];
        reduceMaterial.uniforms.frameDirectionCenter.value = this.directionTarget.textures[1];

        renderer.setRenderTarget(this.emitterTarget);
        renderer.render(reduceScene, camera);
      }

      setProbeGridUniforms(probeMaterial.uniforms, this);
      probeMaterial.uniforms.frameEmitterCount.value = this.emitterCount;
      probeMaterial.uniforms.frameEmitterIntensity.value = this.emitterTarget.textures[0];
      probeMaterial.uniforms.frameEmitterCenter.value = this.emitterTarget.textures[1];

      renderer.setRenderTarget(this.probeTarget);
      renderer.render(probeScene, camera);
    } finally {
      renderer.setScissorTest(currentScissorTest);
      renderer.autoClear = currentAutoClear;
      renderer.setClearColor(clearColor, currentClearAlpha);
      renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
    }
  }

  dispose() {
    super.dispose();

    this.directionTarget.dispose();
    this.emitterTarget.dispose();
    this.probeTarget.dispose();
    this.updater.geometry.dispose();
    this.directionPool.forEach((mesh) => mesh.geometry.dispose());
    this.directionPool = [];
  }
}

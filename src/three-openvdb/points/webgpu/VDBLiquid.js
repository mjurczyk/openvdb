import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Discard,
  Break,
  select,
  uniform,
  uniformArray,
  texture,
  attribute,
  varying,
  modelViewMatrix,
  cameraProjectionMatrix,
  cameraWorldMatrix,
  cameraNear,
  cameraFar,
  positionGeometry,
  viewportSharedTexture,
  getDistanceAttenuation,
  materialEnvIntensity,
  viewZToPerspectiveDepth,
  viewZToOrthographicDepth,
  refract,
  reflect,
  smoothstep,
  exp,
  sqrt,
  cross,
  normalize,
  dot,
  abs,
  max,
  min,
  clamp,
  mix,
  pow,
  ceil,
  float,
  int,
  ivec2,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { frameFragCoord, frameLoad, frameSample, frameFullscreenVertex } from '../../frame/webgpu/frameShaderChunks.js';
import { FrameEnvironmentMaterial } from '../../frame/webgpu/FrameEnvironmentMaterial.js';
import { buildPointData } from '../pointsCore.js';
import {
  liquidWater,
  liquidRoughness,
  liquidMaxLights,
  liquidMaxPoints,
  liquidFilterSigma,
  liquidFilterDepthRange,
  liquidFilterIterations,
  liquidFilterMaxRadius,
  liquidThicknessResolution,
  liquidThicknessSigma,
  liquidLodSpacing,
  liquidLightTypes,
  createLiquidGeometry,
  createLiquidLightState,
  collectLiquidLights,
  getLiquidWorldScale,
  getLiquidEdgeThickness,
  getLiquidPixelScale,
} from '../liquidCore.js';

const drawingSize = new Three.Vector2();
const clearColor = new Three.Color();

// NOTE Instanced fullscreen triangle. instanceCount 0 skips the draw (no points yet).
const createCompositeGeometry = () => {
  const geometry = new Three.InstancedBufferGeometry();

  geometry.setAttribute('position', new Three.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geometry.instanceCount = 0;

  return geometry;
};

const createTarget = (type, format, depthBuffer, filter = Three.NearestFilter) =>
  new Three.RenderTarget(1, 1, {
    type,
    format,
    minFilter: filter,
    magFilter: filter,
    generateMipmaps: false,
    depthBuffer,
  });

const createPassScene = (material, geometry) => {
  const scene = new Three.Scene();
  const mesh = new Three.Mesh(geometry, material);

  scene.matrixWorldAutoUpdate = false;
  mesh.matrixAutoUpdate = false;
  mesh.frustumCulled = false;
  scene.add(mesh);

  return { scene, mesh };
};

// NOTE Uniforms of all passes of one liquid object
const createUniforms = () => ({
  worldScale: uniform(1.0),
  spacing: uniform(1.0),
  targetSize: uniform(new Three.Vector2(1.0, 1.0)),
  projectionInverse: uniform(new Three.Matrix4()),
  orthographic: uniform(0.0),
  pixelScale: uniform(1.0),
  filterSigma: uniform(1.0),
  depthSigma: uniform(1.0),
  thicknessSize: uniform(new Three.Vector2(1.0, 1.0)),
  thicknessPixelScale: uniform(1.0),
  thicknessSigma: uniform(1.0),
  absorption: uniform(liquidWater.absorption.clone()),
  tint: uniform(new Three.Color(1.0, 1.0, 1.0)),
  edgeThickness: uniform(1.0),
  radiusScale: uniform(1.0),
  lod: uniform(0.0),
});

// NOTE Distance detail scale at a view distance: 1.0 near, larger where the point spacing on screen is below liquidLodSpacing
const getLodScale = (uniforms, distance) => {
  const distanceScale = select(uniforms.orthographic.greaterThan(0.5), float(1.0), distance);
  const pixelSpacing = uniforms.spacing.mul(uniforms.worldScale).mul(uniforms.pixelScale).div(distanceScale);

  return select(uniforms.lod.greaterThan(0.5), max(float(liquidLodSpacing).div(pixelSpacing), 1.0), float(1.0));
};

// NOTE Window depth of a view z, for perspective and orthographic cameras
const getWindowDepth = (viewZ, orthographic) =>
  select(
    orthographic.greaterThan(0.5),
    viewZToOrthographicDepth(viewZ, cameraNear, cameraFar),
    viewZToPerspectiveDepth(viewZ, cameraNear, cameraFar),
  );

// NOTE View position on the pixel ray at view distance. Two NDC points: z 0.0 and 1.0 are in the frustum in WebGPU and WebGL.
const getViewPosition = (uniforms, uv, distance) => {
  const ndc = uv.mul(2.0).sub(1.0);
  const nearPoint = uniforms.projectionInverse.mul(vec4(ndc, 0.0, 1.0));
  const farPoint = uniforms.projectionInverse.mul(vec4(ndc, 1.0, 1.0));
  const near = nearPoint.xyz.div(nearPoint.w);
  const far = farPoint.xyz.div(farPoint.w);
  const t = distance.negate().sub(near.z).div(far.z.sub(near.z));

  return mix(near, far, t);
};

// NOTE Sphere impostors. The square faces the camera, the fragment adds the sphere depth (Green, GDC 2010).
// NOTE Distance detail: points with a rank above 1 / lodScale^3 are moved out of the clip volume.
// Spheres grow by lodScale. The volume scale (point volume / sphere volume) does not change with it.
const createSplatNodes = (uniforms) => {
  const center = attribute('liquidCenter', 'vec3');
  const radius = attribute('liquidRadius', 'float').mul(uniforms.radiusScale);
  const rank = attribute('liquidRank', 'float');
  const viewCenter = modelViewMatrix.mul(vec4(center, 1.0)).xyz;
  const lodScale = getLodScale(uniforms, viewCenter.z.negate());
  const kept = rank.lessThan(float(1.0).div(pow(lodScale, 3.0)));
  const lodRadius = radius.mul(lodScale);
  const viewRadius = lodRadius.mul(uniforms.worldScale);
  const viewPosition = viewCenter.add(vec3(positionGeometry.xy.mul(viewRadius), 0.0));

  const corner = varying(positionGeometry.xy, 'vLiquidCorner');
  const sphereCenterZ = varying(viewCenter.z, 'vLiquidCenterZ');
  const sphereRadius = varying(viewRadius, 'vLiquidRadius');
  const vdbRadius = varying(lodRadius, 'vLiquidVdbRadius');
  const volumeScale = varying(
    pow(uniforms.spacing, 3.0).div(pow(radius, 3.0).mul((4.0 / 3.0) * Math.PI)),
    'vLiquidVolumeScale',
  );
  const height = Fn(() => {
    const distance2 = dot(corner, corner);

    If(distance2.greaterThan(1.0), () => {
      Discard();
    });

    return sqrt(float(1.0).sub(distance2));
  });

  return {
    vertexNode: select(kept, cameraProjectionMatrix.mul(vec4(viewPosition, 1.0)), vec4(0.0, 0.0, 2.0, 1.0)),
    corner,
    sphereCenterZ,
    sphereRadius,
    vdbRadius,
    volumeScale,
    height,
  };
};

// NOTE R: view distance of the nearest sphere surface. The depth buffer keeps the nearest.
class LiquidDepthMaterial extends Three.NodeMaterial {
  constructor(uniforms) {
    super();

    const splat = createSplatNodes(uniforms);
    const surfaceZ = Fn(() => splat.sphereCenterZ.add(splat.sphereRadius.mul(splat.height())));

    this.name = 'LiquidDepthMaterial';
    this.vertexNode = splat.vertexNode;
    this.depthNode = getWindowDepth(surfaceZ(), uniforms.orthographic);
    this.fragmentNode = Fn(() => vec4(surfaceZ().negate(), 0.0, 0.0, 1.0))();
    this.side = Three.DoubleSide;
    this.blending = Three.NoBlending;
  }
}

// NOTE RGB: Cd * thickness (Cd is white without the attribute), then RGB / A is the mean Cd. A: thickness in VDB units.
// NOTE Spheres overlap, so each chord is scaled by the volume of one point (spacing^3) / the sphere volume.
class LiquidThicknessMaterial extends Three.NodeMaterial {
  constructor(uniforms, hasColor) {
    super();

    const splat = createSplatNodes(uniforms);
    const color = hasColor ? varying(attribute('liquidColor', 'vec3'), 'vLiquidColor') : vec3(1.0);

    this.name = 'LiquidThicknessMaterial';
    this.vertexNode = splat.vertexNode;
    this.fragmentNode = Fn(() => {
      const chord = splat.vdbRadius.mul(2.0).mul(splat.height()).mul(splat.volumeScale);

      return vec4(color.mul(chord), chord);
    })();
    this.side = Three.DoubleSide;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.CustomBlending;
    this.blendEquation = Three.AddEquation;
    this.blendSrc = Three.OneFactor;
    this.blendDst = Three.OneFactor;
    this.blendEquationAlpha = Three.AddEquation;
    this.blendSrcAlpha = Three.OneFactor;
    this.blendDstAlpha = Three.OneFactor;
  }
}

// NOTE Sigma in pixels of a world sigma at a view distance. Distance detail spheres are larger, so the sigma is too.
const getPixelSigma = (uniforms, worldSigma, pixelScale, distance) =>
  max(
    worldSigma
      .mul(getLodScale(uniforms, distance))
      .mul(pixelScale)
      .div(select(uniforms.orthographic.greaterThan(0.5), float(1.0), distance)),
    0.5,
  );

// NOTE One axis of a separable filter. Kernel size is in world units (sigma in pixels at each depth), 2 sigma wide.
// 'depth': bilateral filter of the view distance (R). Empty pixels (0.0) are not used and stay empty.
// 'thickness': Gaussian filter of the half-resolution thickness (RGBA). Sigma from the filtered depth.
class LiquidFilterMaterial extends Three.NodeMaterial {
  constructor(uniforms, source, direction, mode) {
    super();

    const sourceNode = texture(source);
    const isDepth = mode === 'depth';
    const size = isDepth ? uniforms.targetSize : uniforms.thicknessSize;
    const step = ivec2(direction.x, direction.y);

    this.name = isDepth ? 'LiquidDepthFilterMaterial' : 'LiquidThicknessFilterMaterial';
    this.vertexNode = frameFullscreenVertex;
    this.fragmentNode = Fn(() => {
      const texel = ivec2(frameFragCoord(size)).toVar();
      const center = frameLoad(sourceNode, texel, size).toVar();
      const maxTexel = ivec2(size).sub(1);

      // NOTE The view distance of this pixel: the depth target, at full resolution for the thickness filter
      const distance = isDepth
        ? center.r
        : frameLoad(
            uniforms.distanceMap,
            clamp(ivec2(vec2(texel).add(0.5).mul(uniforms.targetSize).div(size)), ivec2(0), ivec2(uniforms.targetSize).sub(1)),
            uniforms.targetSize,
          ).r;

      If(isDepth ? distance.lessThanEqual(0.0) : distance.lessThanEqual(0.0).or(center.a.lessThanEqual(0.0)), () => {
        Discard();
      });

      const sigma = isDepth
        ? getPixelSigma(uniforms, uniforms.filterSigma, uniforms.pixelScale, distance).toVar()
        : getPixelSigma(uniforms, uniforms.thicknessSigma, uniforms.thicknessPixelScale, distance).toVar();
      const radius = min(ceil(sigma.mul(2.0)), float(liquidFilterMaxRadius)).toVar();
      const sum = vec4(center).toVar();
      const weightSum = float(1.0).toVar();

      Loop({ start: int(1), end: int(liquidFilterMaxRadius + 1), type: 'int' }, ({ i }) => {
        const offset = float(i);

        If(offset.greaterThan(radius), () => {
          Break();
        });

        const spatial = exp(offset.mul(offset).div(sigma.mul(sigma).mul(-2.0)));

        [1, -1].forEach((side) => {
          const sampleTexel = clamp(texel.add(step.mul(i.mul(int(side)))), ivec2(0), maxTexel);
          const sample = frameLoad(sourceNode, sampleTexel, size);

          if (isDepth) {
            const difference = sample.r.sub(distance).div(uniforms.depthSigma.mul(getLodScale(uniforms, distance)));
            const weight = select(
              sample.r.greaterThan(0.0),
              spatial.mul(exp(difference.mul(difference).mul(-0.5))),
              float(0.0),
            );

            sum.addAssign(sample.mul(weight));
            weightSum.addAssign(weight);
          } else {
            sum.addAssign(sample.mul(spatial));
            weightSum.addAssign(spatial);
          }
        });
      });

      return isDepth ? vec4(sum.r.div(weightSum), 0.0, 0.0, 1.0) : sum.div(weightSum);
    })();
    this.side = Three.DoubleSide;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }
}

// NOTE Shades the smoothed surface. Fresnel (IOR), environment reflection, specular of the scene lights,
// refraction of the scene behind and Beer-Lambert absorption by thickness. Writes the surface depth.
class LiquidCompositeMaterial extends FrameEnvironmentMaterial {
  constructor(uniforms, depthSource, thicknessSource) {
    super();

    this.name = 'LiquidCompositeMaterial';
    this.liquidUniforms = uniforms;
    this.distanceMap = texture(depthSource);
    this.thicknessNode = texture(thicknessSource);
    this.lightState = createLiquidLightState();
    this.lightCount = uniform(0, 'int');
    this.lightPositions = uniformArray(this.lightState.positions, 'vec4');
    this.lightColors = uniformArray(this.lightState.colors, 'vec4');
    this.lightSpots = uniformArray(this.lightState.spots, 'vec4');
    this.lightParams = uniformArray(this.lightState.params, 'vec4');
    this.ambientColor = uniform(this.lightState.ambient);
    this.hemiSkyColor = uniform(this.lightState.hemiSky);
    this.hemiGroundColor = uniform(this.lightState.hemiGround);
    this.hemiUp = uniform(this.lightState.hemiUp);

    this.vertexNode = frameFullscreenVertex;
    this.rebuildNodes();

    this.side = Three.DoubleSide;
    this.transparent = true;
    this.depthTest = true;
    this.depthWrite = true;
    this.blending = Three.NoBlending;
  }

  rebuildNodes() {
    const uniforms = this.liquidUniforms;
    const surfaceDistance = Fn(() => {
      const texel = ivec2(frameFragCoord(uniforms.targetSize));

      return frameLoad(this.distanceMap, texel, uniforms.targetSize).r;
    });

    this.depthNode = Fn(() => {
      const uv = frameFragCoord(uniforms.targetSize).div(uniforms.targetSize);
      const position = getViewPosition(uniforms, uv, surfaceDistance());

      return getWindowDepth(position.z, uniforms.orthographic);
    })();
    this.fragmentNode = this.createFragmentNode();
  }

  createFragmentNode() {
    const uniforms = this.liquidUniforms;
    const { targetSize } = uniforms;
    const depthMap = this.distanceMap;

    return Fn(() => {
      const fragCoord = frameFragCoord(targetSize).toVar();
      const texel = ivec2(fragCoord).toVar();
      const distance = frameLoad(depthMap, texel, targetSize).r.toVar();

      If(distance.lessThanEqual(0.0), () => {
        Discard();
      });

      const maxTexel = ivec2(targetSize).sub(1);
      const position = getViewPosition(uniforms, fragCoord.div(targetSize), distance).toVar();

      // NOTE Neighbour position, or the center when the neighbour is empty
      const neighbour = (dx, dy) => {
        const sampleTexel = clamp(texel.add(ivec2(dx, dy)), ivec2(0), maxTexel);
        const sampleDistance = frameLoad(depthMap, sampleTexel, targetSize).r;
        const uv = vec2(sampleTexel).add(0.5).div(targetSize);

        return select(
          sampleDistance.greaterThan(0.0),
          getViewPosition(uniforms, uv, sampleDistance),
          position,
        );
      };

      // NOTE Of the two one-sided differences, the one with the smaller depth step (no edge)
      const pickDifference = (forward, backward) =>
        select(
          abs(forward.z).lessThan(abs(backward.z)).and(dot(forward, forward).greaterThan(0.0)).or(dot(backward, backward).equal(0.0)),
          forward,
          backward,
        );

      const ddx = pickDifference(neighbour(1, 0).sub(position), position.sub(neighbour(-1, 0)));
      const ddy = pickDifference(neighbour(0, 1).sub(position), position.sub(neighbour(0, -1)));
      const crossNormal = cross(ddx, ddy);
      const normal = normalize(select(dot(crossNormal, crossNormal).greaterThan(0.0), crossNormal, vec3(0.0, 0.0, 1.0))).toVar();

      normal.assign(select(dot(normal, position).greaterThan(0.0), normal.negate(), normal));

      const viewDirection = normalize(position.negate()).toVar();
      const dotNV = clamp(dot(normal, viewDirection), 1e-4, 1.0).toVar();
      const f0 = ((liquidWater.ior - 1.0) / (liquidWater.ior + 1.0)) ** 2;
      const fresnel = float(f0).add(float(1.0 - f0).mul(pow(float(1.0).sub(dotNV), 5.0))).toVar();

      // NOTE Reflection: environment along the reflected ray, ambient and hemisphere lights as uniform sky radiance
      const reflected = reflect(viewDirection.negate(), normal).toVar();
      const reflectedWorld = cameraWorldMatrix.mul(vec4(reflected, 0.0)).xyz;
      const hemiMix = dot(reflected, this.hemiUp).mul(0.5).add(0.5);
      const reflection = vec3(this.ambientColor)
        .add(mix(this.hemiGroundColor, this.hemiSkyColor, hemiMix))
        .mul(1.0 / Math.PI)
        .toVar();

      if (this.environment) {
        reflection.addAssign(this.environmentRadiance(reflectedWorld, 0.0).mul(materialEnvIntensity));
      }

      // NOTE Specular of the scene lights, GGX (same terms as three.js BRDF_GGX)
      const alpha = liquidRoughness * liquidRoughness;
      const alpha2 = alpha * alpha;
      const specular = vec3(0.0).toVar();

      Loop(this.lightCount, ({ i }) => {
        const lightPosition = this.lightPositions.element(i);
        const lightColor = this.lightColors.element(i);
        const lightSpot = this.lightSpots.element(i);
        const lightParams = this.lightParams.element(i);
        const type = lightPosition.w;
        const toLight = lightPosition.xyz.sub(position).toVar();
        const lightDistance = toLight.length();
        const lightDirection = select(type.lessThan(0.5), normalize(lightPosition.xyz), normalize(toLight)).toVar();
        const distanceAttenuation = getDistanceAttenuation({
          lightDistance,
          cutoffDistance: lightColor.w,
          decayExponent: lightParams.y,
        });
        const spotAttenuation = smoothstep(lightSpot.w, lightParams.x, dot(lightDirection.negate(), lightSpot.xyz));
        const attenuation = select(
          type.lessThan(0.5),
          float(1.0),
          select(type.lessThan(1.5), distanceAttenuation, distanceAttenuation.mul(spotAttenuation)),
        );

        const halfVector = normalize(lightDirection.add(viewDirection));
        const dotNL = clamp(dot(normal, lightDirection), 0.0, 1.0);
        const dotNH = clamp(dot(normal, halfVector), 0.0, 1.0);
        const dotVH = clamp(dot(viewDirection, halfVector), 0.0, 1.0);
        const lightFresnel = float(f0).add(float(1.0 - f0).mul(pow(float(1.0).sub(dotVH), 5.0)));
        const smithV = dotNL.mul(sqrt(dotNV.mul(dotNV).mul(1.0 - alpha2).add(alpha2)));
        const smithL = dotNV.mul(sqrt(dotNL.mul(dotNL).mul(1.0 - alpha2).add(alpha2)));
        const visibility = float(0.5).div(max(smithV.add(smithL), 1e-6));
        const denominator = dotNH.mul(dotNH).mul(alpha2 - 1.0).add(1.0);
        const distribution = float(alpha2 / Math.PI).div(denominator.mul(denominator));

        specular.addAssign(
          lightColor.xyz.mul(attenuation).mul(dotNL).mul(lightFresnel.mul(visibility).mul(distribution)),
        );
      });

      // NOTE Refraction: the scene behind, where the refracted ray leaves the liquid. Absorption by thickness.
      const screenUv = fragCoord.div(targetSize).toVar();
      const thicknessData = frameSample(this.thicknessNode, screenUv).toVar();
      const thickness = thicknessData.a;
      const refracted = refract(viewDirection.negate(), normal, 1.0 / liquidWater.ior);
      const exitPosition = position.add(refracted.mul(thickness.mul(uniforms.worldScale)));
      const exitClip = cameraProjectionMatrix.mul(vec4(exitPosition, 1.0));
      const exitUv = clamp(exitClip.xy.div(exitClip.w).mul(0.5).add(0.5), vec2(0.0), vec2(1.0));
      const behind = viewportSharedTexture(vec2(exitUv.x, float(1.0).sub(exitUv.y))).rgb;
      // NOTE Water absorbs by thickness. Cd (mean along the ray) and color tint the liquid one time, as a filter.
      const meanColor = select(thickness.greaterThan(0.0), thicknessData.rgb.div(max(thickness, 1e-6)), vec3(1.0));
      const transmittance = exp(uniforms.absorption.mul(thickness).negate()).mul(meanColor).mul(uniforms.tint);

      const color = behind
        .mul(transmittance)
        .mul(float(1.0).sub(fresnel))
        .add(reflection.mul(fresnel))
        .add(specular);

      // NOTE Soft edge: the liquid fades into the scene where it is thinner than one point
      const edgeThickness = uniforms.edgeThickness.mul(getLodScale(uniforms, distance));
      const coverage = clamp(thickness.div(edgeThickness), 0.0, 1.0);
      const scene = viewportSharedTexture(vec2(screenUv.x, float(1.0).sub(screenUv.y))).rgb;

      return vec4(mix(scene, color, coverage), 1.0);
    })();
  }

  updateLights(scene, camera) {
    collectLiquidLights(scene, camera, this.lightState);
    this.lightCount.value = this.lightState.count;
  }
}

// NOTE Screen-space passes of one liquid object: depth splat, thickness splat, depth filter, composite material.
class LiquidPasses {
  constructor() {
    const uniforms = createUniforms();

    this.uniforms = uniforms;
    this.hasColor = false;
    // NOTE depthTarget: splat depth, then the filter result (filter: depthTarget -> filterTarget -> depthTarget)
    this.depthTarget = createTarget(Three.FloatType, Three.RedFormat, true);
    this.filterTarget = createTarget(Three.FloatType, Three.RedFormat, false);
    // NOTE Half resolution. thicknessTarget -> thicknessFilterTarget -> thicknessTarget.
    this.thicknessTarget = createTarget(Three.HalfFloatType, Three.RGBAFormat, false, Three.LinearFilter);
    this.thicknessFilterTarget = createTarget(Three.HalfFloatType, Three.RGBAFormat, false, Three.LinearFilter);
    uniforms.distanceMap = texture(this.depthTarget.texture);

    // NOTE The pass meshes get the point geometry in setGeometry()
    this.depthPass = createPassScene(new LiquidDepthMaterial(uniforms), new Three.BufferGeometry());
    this.thicknessPass = createPassScene(new LiquidThicknessMaterial(uniforms, false), new Three.BufferGeometry());

    const fullscreen = createCompositeGeometry();
    fullscreen.instanceCount = 1;

    const createFilter = (source, direction, mode) =>
      createPassScene(new LiquidFilterMaterial(uniforms, source.texture, direction, mode), fullscreen);

    this.fullscreenGeometry = fullscreen;
    this.filterPasses = [
      createFilter(this.depthTarget, new Three.Vector2(1, 0), 'depth'),
      createFilter(this.filterTarget, new Three.Vector2(0, 1), 'depth'),
    ];
    this.thicknessFilterPasses = [
      createFilter(this.thicknessTarget, new Three.Vector2(1, 0), 'thickness'),
      createFilter(this.thicknessFilterTarget, new Three.Vector2(0, 1), 'thickness'),
    ];

    this.material = new LiquidCompositeMaterial(uniforms, this.depthTarget.texture, this.thicknessTarget.texture);
  }

  setSize(width, height) {
    const thicknessWidth = Math.max(1, Math.round(width * liquidThicknessResolution));
    const thicknessHeight = Math.max(1, Math.round(height * liquidThicknessResolution));

    if (this.depthTarget.width !== width || this.depthTarget.height !== height) {
      this.depthTarget.setSize(width, height);
      this.filterTarget.setSize(width, height);
      this.thicknessTarget.setSize(thicknessWidth, thicknessHeight);
      this.thicknessFilterTarget.setSize(thicknessWidth, thicknessHeight);
    }

    this.uniforms.targetSize.value.set(width, height);
    this.uniforms.thicknessSize.value.set(thicknessWidth, thicknessHeight);
  }

  // NOTE The thickness material reads liquidColor only when the points have Cd
  setGeometry(geometry) {
    const hasColor = !!geometry.getAttribute('liquidColor');

    if (hasColor !== this.hasColor) {
      this.hasColor = hasColor;
      this.thicknessPass.mesh.material.dispose();
      this.thicknessPass.mesh.material = new LiquidThicknessMaterial(this.uniforms, hasColor);
    }

    this.depthPass.mesh.geometry = geometry;
    this.thicknessPass.mesh.geometry = geometry;
  }

  render(renderer, scene, camera, liquid, data) {
    const { uniforms } = this;
    const currentTarget = renderer.getRenderTarget();

    if (currentTarget) {
      drawingSize.set(currentTarget.width, currentTarget.height);
    } else {
      renderer.getDrawingBufferSize(drawingSize);
    }

    this.setSize(drawingSize.x, drawingSize.y);

    const worldScale = getLiquidWorldScale(liquid);

    uniforms.worldScale.value = worldScale;
    uniforms.spacing.value = data.spacing;
    uniforms.projectionInverse.value.copy(camera.projectionMatrixInverse);
    uniforms.orthographic.value = camera.isOrthographicCamera ? 1.0 : 0.0;
    uniforms.pixelScale.value = getLiquidPixelScale(camera, drawingSize.y);
    const { radiusScale, blend, lod, color } = liquid.pointSource;
    const radius = data.meanRadius * radiusScale;

    uniforms.radiusScale.value = radiusScale;
    uniforms.lod.value = lod ? 1.0 : 0.0;
    uniforms.filterSigma.value = radius * worldScale * liquidFilterSigma * blend;
    uniforms.depthSigma.value = radius * worldScale * liquidFilterDepthRange;
    uniforms.thicknessPixelScale.value = getLiquidPixelScale(camera, uniforms.thicknessSize.value.y);
    uniforms.thicknessSigma.value = radius * worldScale * liquidThicknessSigma;
    uniforms.tint.value.copy(color);
    uniforms.edgeThickness.value = getLiquidEdgeThickness(radius, data.spacing);

    this.depthPass.mesh.matrixWorld.copy(liquid.matrixWorld);
    this.thicknessPass.mesh.matrixWorld.copy(liquid.matrixWorld);

    const currentAutoClear = renderer.autoClear;
    const currentClearAlpha = renderer.getClearAlpha();
    const currentActiveCubeFace = renderer.getActiveCubeFace();
    const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();

    renderer.getClearColor(clearColor);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);

    renderer.setRenderTarget(this.depthTarget);
    renderer.clear(true, true, false);
    renderer.render(this.depthPass.scene, camera);

    renderer.setRenderTarget(this.thicknessTarget);
    renderer.clear(true, false, false);
    renderer.render(this.thicknessPass.scene, camera);

    for (let i = 0; i < liquidFilterIterations; i++) {
      renderer.setRenderTarget(this.filterTarget);
      renderer.clear(true, false, false);
      renderer.render(this.filterPasses[0].scene, camera);

      renderer.setRenderTarget(this.depthTarget);
      renderer.clear(true, false, false);
      renderer.render(this.filterPasses[1].scene, camera);
    }

    // NOTE After the depth filter: the thickness filter reads the filtered depth
    renderer.setRenderTarget(this.thicknessFilterTarget);
    renderer.clear(true, false, false);
    renderer.render(this.thicknessFilterPasses[0].scene, camera);

    renderer.setRenderTarget(this.thicknessTarget);
    renderer.clear(true, false, false);
    renderer.render(this.thicknessFilterPasses[1].scene, camera);

    renderer.setRenderTarget(currentTarget, currentActiveCubeFace, currentActiveMipmapLevel);
    renderer.setClearColor(clearColor, currentClearAlpha);
    renderer.autoClear = currentAutoClear;

    this.material.setEnvironment(scene.environment);
    this.material.updateLights(scene, camera);
  }

  dispose() {
    this.depthTarget.dispose();
    this.filterTarget.dispose();
    this.thicknessTarget.dispose();
    this.thicknessFilterTarget.dispose();
    this.fullscreenGeometry.dispose();
    [this.depthPass, this.thicknessPass, ...this.filterPasses, ...this.thicknessFilterPasses].forEach(({ mesh }) =>
      mesh.material.dispose(),
    );
    this.material.dispose();
  }
}

// NOTE Point data grid as a liquid surface (WebGPURenderer): screen-space fluid rendering. color: tint, a filter
// color (white is clear water). Lit by the scene lights and the environment, refracts the scene behind.
export class VDBLiquid extends Three.Mesh {
  isVDBLiquid = true;
  cancel = null;
  spacing = 1.0;
  pointCount = 0;
  // NOTE Point data of the source: { geometry, meanRadius, spacing }. Instances read it from pointSource.
  data = null;

  constructor(
    source,
    { maxPoints = liquidMaxPoints, color = 0xffffff, radiusScale = 1.0, blend = 1.0, lod = false } = {},
    onConverted,
  ) {
    // NOTE Own passes and material for each liquid object. Instances share only the point data.
    const passes = new LiquidPasses();

    super(createCompositeGeometry(), passes.material);

    this.passes = passes;
    this.color = new Three.Color(color);
    // NOTE radiusScale: sphere radius multiplier. blend: depth filter multiplier (how much spheres merge).
    // lod: distance detail, fewer and larger spheres far from the camera. Instances read these from pointSource.
    this.radiusScale = radiusScale;
    this.blend = blend;
    this.lod = lod;
    this.pointSource = this;
    this.onConverted = onConverted;
    this.frustumCulled = false;

    if (source) {
      this.cancel = buildPointData(source, { maxPoints }, (pointData) => {
        this.cancel = null;
        this.setPointData(pointData);
        this.onConverted?.(this);
      });
    }

    this.onBeforeRender = (renderer, scene, camera) => this.renderPasses(renderer, scene, camera);
  }

  setPointData(pointData) {
    this.data?.geometry.dispose();

    const { geometry, meanRadius } = createLiquidGeometry(pointData);

    this.data = { geometry, meanRadius, spacing: pointData.spacing };
    this.pointCount = pointData.count;
    this.spacing = pointData.spacing;
  }

  renderPasses(renderer, scene, camera) {
    const data = this.pointSource.data;

    // NOTE Override passes (shadows, depth) of other effects do not draw the liquid
    if (!data || data.geometry.instanceCount === 0 || scene.overrideMaterial) {
      this.geometry.instanceCount = 0;

      return;
    }

    this.passes.setGeometry(data.geometry);
    this.passes.render(renderer, scene, camera, this, data);
    this.geometry.instanceCount = 1;
  }

  createInstance() {
    return this.applyToInstance(new VDBLiquid(null));
  }

  // NOTE Makes a liquid show these points. FrameVolume instances use it for each new frame.
  applyToInstance(instance) {
    instance.pointSource = this;

    return instance;
  }

  dispose() {
    this.cancel?.();
    this.cancel = null;

    if (this.pointSource === this) {
      this.data?.geometry.dispose();
    }

    this.data = null;
    this.passes.dispose();
    this.geometry.dispose();
  }
}

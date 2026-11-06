import * as Three from 'three';
import {
  If,
  Loop,
  Break,
  float,
  int,
  ivec2,
  vec2,
  vec3,
  vec4,
  uniform,
  uniformArray,
  texture3D,
  screenCoordinate,
  positionGeometry,
  instanceIndex,
  select,
  mix,
  pow,
  exp,
  exp2,
  log,
  log2,
  fract,
  dot,
  floor,
  ceil,
  clamp,
  min,
  max,
  abs,
  mod,
  smoothstep,
  sqrt,
  acos,
  texture,
} from 'three/tsl';
import { getFramePhase, frameMieAsymmetry, frameMaxScatteringOctaves } from '../core/framePhase.js';
import { frameMieTable, frameMieTableSize } from '../core/frameMieTable.js';
import { frameMaxEnvironmentLights } from '../core/frameEnvironment.js';
import { getFrameExtinctionSpectrum } from '../core/frameSpectrum.js';
import {
  getFrameBlackbodyTable,
  getFrameEmissionSpectrum,
  frameBlackbodyTableSize,
  frameBlackbodyTableRows,
  frameBlackbodyMinTemperature,
  frameBlackbodyMaxTemperature,
  frameMaxSootExponent,
} from '../core/frameBlackbody.js';

// NOTE Shaders use the bottom-left pixel origin of GLSL (gl_FragCoord).
// NOTE three.js nodes use the top-left origin of WebGPU. These helpers convert between them.

export const minComponent = (value) => min(value.x, min(value.y, value.z));
export const maxComponent = (value) => max(value.x, max(value.y, value.z));

export const frameFragCoord = (targetSize) =>
  vec2(screenCoordinate.x, targetSize.y.sub(screenCoordinate.y));

// NOTE Bottom-left texel of a render target texture
export const frameLoad = (textureNode, texel, targetSize) =>
  textureNode.load(ivec2(texel.x, int(targetSize.y).sub(texel.y).sub(1)));

// NOTE Bottom-left uv of a render target texture. Level 0, then sampling is allowed in loops and branches.
export const frameSample = (textureNode, uv) =>
  textureNode.sample(vec2(uv.x, float(1.0).sub(uv.y))).level(float(0.0));

// NOTE Fullscreen triangle. Positions are clip coordinates.
export const frameFullscreenVertex = vec4(positionGeometry.xy, 0.0, 1.0);

// NOTE Froxel grid layout and view reconstruction. Shared by all froxel passes.
export const createFroxelUniforms = () => ({
  froxelGrid: uniform(new Three.Vector3(1.0, 1.0, 1.0)),
  froxelColumns: uniform(1.0),
  froxelRange: uniform(new Three.Vector2(0.1, 1.0)),
  froxelProjectionInverse: uniform(new Three.Matrix4()),
  froxelSubSteps: uniform(6, 'int'),
  froxelAtlasSize: uniform(new Three.Vector2(1.0, 1.0)),
  frameJitter: uniform(0.5),
});

export const frameSliceDepth = (froxel, t) =>
  froxel.froxelRange.x.mul(pow(froxel.froxelRange.y.div(froxel.froxelRange.x), t));

// NOTE Two points on the pixel ray. NDC depth 0.0 and 1.0 are in the frustum in WebGPU and WebGL.
export const frameGetViewPosition = (froxel, uv, viewDepth) => {
  const ndc = uv.mul(2.0).sub(1.0);
  const nearPoint = froxel.froxelProjectionInverse.mul(vec4(ndc, 0.0, 1.0));
  const farPoint = froxel.froxelProjectionInverse.mul(vec4(ndc, 1.0, 1.0));
  const near = nearPoint.xyz.div(nearPoint.w);
  const far = farPoint.xyz.div(farPoint.w);
  const t = viewDepth.add(near.z).div(near.z.sub(far.z));

  return mix(near, far, t);
};

// NOTE Slice, uv and view positions of the froxel at an atlas pixel
export const frameGetFroxel = (froxel, fragCoord) => {
  const { froxelGrid, froxelColumns } = froxel;
  const tile = floor(fragCoord.div(froxelGrid.xy));
  const slice = tile.y.mul(froxelColumns).add(tile.x);
  const uv = fragCoord.sub(tile.mul(froxelGrid.xy)).div(froxelGrid.xy);
  const sliceNear = frameSliceDepth(froxel, slice.div(froxelGrid.z));
  const sliceFar = frameSliceDepth(froxel, slice.add(1.0).div(froxelGrid.z));

  return {
    tile,
    slice,
    uv,
    sliceNear,
    sliceFar,
    viewNear: frameGetViewPosition(froxel, uv, sliceNear),
    viewFar: frameGetViewPosition(froxel, uv, sliceFar),
  };
};

// NOTE Mip level of a froxel from its width or the sub-step length, the larger one
export const getFroxelLod = (froxel, cell, volume, subStepLength, worldScale) => {
  const sliceMiddle = cell.sliceNear.add(cell.sliceFar).mul(0.5);
  const neighborUv = cell.uv.add(vec2(float(1.0).div(froxel.froxelGrid.x), 0.0));
  const froxelWidth = frameGetViewPosition(froxel, neighborUv, sliceMiddle)
    .sub(frameGetViewPosition(froxel, cell.uv, sliceMiddle))
    .length();

  return volume.getLod(max(froxelWidth, subStepLength).div(worldScale)).toVar();
};

// NOTE The mip level the extinction is read from for this froxel width: level 0 without mipmaps, and no level past the
// ones the density grid and the mask grid have, which are 0 while their mipmaps are not built yet.
export const getSampledLod = (volumeUniforms, widthLod, mipmaps) => {
  if (!mipmaps) {
    return float(0.0);
  }

  const { frameDensityMipLevels, frameMaskMipLevels, frameUseMaskMap } = volumeUniforms;
  const maskLevels = select(frameUseMaskMap.equal(1), frameMaskMipLevels, widthLod);

  return min(widthLod, min(frameDensityMipLevels, maskLevels));
};

// NOTE Sub-steps for the part of a slice inside the volume box: two for each voxel of the mip level that is read, at
// most froxelSubSteps. A thin slice or a far volume needs fewer than froxelSubSteps, and the steps outside the box are
// not taken at all.
export const getBoxSteps = (volume, localNear, localFar, segment, sampledLod, froxelSubSteps) => {
  const boxLength = localFar.sub(localNear).length().mul(segment);
  const steps = ceil(exp2(volume.getLod(boxLength).sub(sampledLod)).mul(2.0));

  return int(clamp(steps, 1.0, float(froxelSubSteps))).toVar();
};

// NOTE Per-pixel noise that changes each frame. Jitter turns banding into noise, temporal accumulation removes the noise.
// Interleaved gradient noise - https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
// NOTE Returns 0.5 when jitter is off (frameJitter is negative).
export const frameNoise = (jitter, pixel) => {
  const noise = fract(float(52.9829189).mul(fract(dot(pixel, vec2(0.06711056, 0.00583715)))));

  return select(jitter.lessThan(0.0), float(0.5), fract(noise.add(jitter)));
};

// NOTE Henyey-Greenstein phase divided by the isotropic phase 1 / (4 PI). g = 0 gives 1.
const frameHenyeyGreenstein = (cosTheta, g) => {
  const g2 = g.mul(g);

  return float(1.0)
    .sub(g2)
    .div(pow(max(float(1.0).add(g2).sub(g.mul(2.0).mul(cosTheta)), 1e-4), 1.5));
};

// NOTE Lorenz-Mie phase table, see core/frameMieTable.js. Float values, read with load and a linear blend.
const frameMieTexture = new Three.DataTexture(
  frameMieTable,
  frameMieTableSize,
  1,
  Three.RedFormat,
  Three.FloatType,
);

frameMieTexture.minFilter = Three.NearestFilter;
frameMieTexture.magFilter = Three.NearestFilter;
frameMieTexture.needsUpdate = true;

const frameMieMap = texture(frameMieTexture);

// NOTE Emission color table, see core/frameBlackbody.js. Float values, read with load and a bilinear blend.
const frameBlackbodyTexture = new Three.DataTexture(
  getFrameBlackbodyTable(),
  frameBlackbodyTableSize,
  frameBlackbodyTableRows,
  Three.RGBAFormat,
  Three.FloatType,
);

frameBlackbodyTexture.minFilter = Three.NearestFilter;
frameBlackbodyTexture.magFilter = Three.NearestFilter;
frameBlackbodyTexture.needsUpdate = true;

const frameBlackbodyMap = texture(frameBlackbodyTexture);

// NOTE Emission color of the table, temperature in Kelvin. Texel x is on a log temperature scale, texel y is the soot exponent.
const frameBlackbodyColor = (temperature, exponent) => {
  const temperatureScale = Math.log(frameBlackbodyMaxTemperature / frameBlackbodyMinTemperature);
  const logTemperature = log(max(temperature, 1e-3).div(frameBlackbodyMinTemperature));
  const x = clamp(logTemperature.div(temperatureScale), 0.0, 1.0)
    .mul(frameBlackbodyTableSize - 1)
    .toVar();
  const y = clamp(exponent.div(frameMaxSootExponent), 0.0, 1.0)
    .mul(frameBlackbodyTableRows - 1)
    .toVar();
  const column = min(int(x), int(frameBlackbodyTableSize - 2)).toVar();
  const row = min(int(y), int(frameBlackbodyTableRows - 2)).toVar();
  const blendX = x.sub(float(column)).toVar();
  const texel = (offsetX, offsetY) =>
    frameBlackbodyMap.load(ivec2(column.add(offsetX), row.add(offsetY))).rgb;

  return mix(
    mix(texel(0, 0), texel(1, 0), blendX),
    mix(texel(0, 1), texel(1, 1), blendX),
    y.sub(float(row)),
  );
};

// NOTE Table texel u is at the scattering angle PI * u^2
const frameMiePhase = (cosTheta) => {
  const u = sqrt(acos(clamp(cosTheta, -1.0, 1.0)).mul(1.0 / Math.PI));
  const texel = u.mul(frameMieTableSize - 1).toVar();
  const index = min(int(texel), int(frameMieTableSize - 2)).toVar();
  const a = frameMieMap.load(ivec2(index, 0)).r;
  const b = frameMieMap.load(ivec2(index.add(1), 0)).r;

  return mix(a, b, texel.sub(float(index)));
};

// NOTE framePhase is (forward g, back g, back weight, Lorenz-Mie weight). Call in a Fn body.
// NOTE rayDirection: from the camera to the sample. lightDirection: from the sample to the light.
export const framePhaseWeight = (framePhase, rayDirection, lightDirection) => {
  const cosTheta = dot(rayDirection, lightDirection).toVar();
  const weight = mix(
    frameHenyeyGreenstein(cosTheta, framePhase.x),
    frameHenyeyGreenstein(cosTheta, framePhase.y),
    framePhase.z,
  ).toVar();

  If(framePhase.w.greaterThan(0.0), () => {
    weight.assign(mix(weight, frameMiePhase(cosTheta), framePhase.w));
  });

  return weight;
};

// NOTE Phase with all g multiplied by gScale. Lorenz-Mie uses Henyey-Greenstein with the table asymmetry g.
const framePhaseWeightScaled = (framePhase, cosTheta, gScale) =>
  mix(
    mix(
      frameHenyeyGreenstein(cosTheta, framePhase.x.mul(gScale)),
      frameHenyeyGreenstein(cosTheta, framePhase.y.mul(gScale)),
      framePhase.z,
    ),
    frameHenyeyGreenstein(cosTheta, gScale.mul(frameMieAsymmetry)),
    framePhase.w,
  );

// NOTE Absorption of the shadow extinction: the part of the light that the albedo (linear luminance) does not scatter
export const frameShadowAbsorption = (extinction, albedo) =>
  extinction.mul(float(1.0).sub(clamp(dot(albedo, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0)));

// NOTE Shadow march values for each unit of length: (extinction, effective extinction, reduced scattering).
// multipleScattering is 1 - g (core/framePhase.js). Diffusion approximation: effective = sqrt(3 * absorption * (absorption + reduced)).
export const frameShadowStep = (extinction, absorption, multipleScattering) => {
  const absorbed = min(absorption, extinction).toVar();
  const reducedScattering = extinction.sub(absorbed).mul(multipleScattering).toVar();

  return vec3(extinction, sqrt(absorbed.mul(3.0).mul(absorbed.add(reducedScattering))), reducedScattering);
};

// NOTE -log of the total shadow transmittance (direct and scattered light) of the summed march values.
// exp(-effective) / (1 + 0.75 * reduced), never less than the direct light exp(-extinction). 0.0 multipleScattering: direct only.
export const frameShadowDepth = (depths, multipleScattering) =>
  select(
    multipleScattering.greaterThan(0.0),
    min(depths.x, depths.y.add(log(depths.z.mul(0.75).add(1.0)))),
    depths.x,
  );

// NOTE octaves is (count N, extinction a, contribution b, phase c) of the indirect light octaves (core/framePhase.js). N 0 is off.

// NOTE Optical depth of the least shadowed light term. Marches stop when it is large.
// Octaves: the last octave has extinction * a^N, so the march goes deeper.
export const frameShadowMarchDepth = (depths, multipleScattering, octaves) =>
  select(
    octaves.x.greaterThan(0.0),
    depths.x.mul(pow(octaves.y, octaves.x)),
    frameShadowDepth(depths, multipleScattering),
  );

// NOTE Shadow values (direct, total) transmittance. Direct light gets the phase function, scattered light (total - direct) is isotropic.
// NOTE Octaves: y is 1 / (1 + optical depth). Half float targets keep it for deep volumes, and 1.0 is no shadow.
export const frameShadowTransmittance = (depths, multipleScattering, octaves) =>
  vec2(
    exp(depths.x.negate()),
    select(
      octaves.x.greaterThan(0.0),
      float(1.0).div(depths.x.add(1.0)),
      exp(frameShadowDepth(depths, multipleScattering).negate()),
    ),
  );

// NOTE Optical depth from the y shadow value of octaves
const frameShadowOpticalDepth = (shadowY) => max(float(1.0).div(max(shadowY, 1e-6)).sub(1.0), 0.0);

// NOTE Sum of b^n * phase(g * c^n) * exp(-a^n * optical depth), n 1 to N. Call in a Fn body.
// NOTE framePhase null is isotropic (phase 1).
const frameOctaveLight = (octaves, opticalDepth, framePhase, cosTheta) => {
  const light = float(0.0).toVar();
  const extinctionScale = float(1.0).toVar();
  const contribution = float(1.0).toVar();
  const gScale = float(1.0).toVar();

  Loop(frameMaxScatteringOctaves, ({ i }) => {
    If(float(i.add(1)).greaterThan(octaves.x), () => {
      Break();
    });

    extinctionScale.mulAssign(octaves.y);
    contribution.mulAssign(octaves.z);
    gScale.mulAssign(octaves.w);

    const phase = framePhase ? framePhaseWeightScaled(framePhase, cosTheta, gScale) : float(1.0);

    light.addAssign(contribution.mul(phase).mul(exp(opticalDepth.mul(extinctionScale).negate())));
  });

  return light;
};

// NOTE Total transmittance of isotropic light (environment, sky) with diffusion multiple scattering.
// Two-sided slab diffusion: 2 * (back + z0) / (front + back + 2 z0) of the reduced depths, z0 = 2/3, times exp(-effective front).
// Light that is scattered and not absorbed is not lost: opposite directions sum to 2. In a white volume, a uniform
// environment then gives the same light inside and outside (white furnace test). Front is toward the light.
const frameDiffusionExtrapolation = 2.0 / 3.0;

export const frameIsotropicDiffusion = (frontReduced, backReduced, frontEffective) =>
  backReduced
    .add(frameDiffusionExtrapolation)
    .mul(2.0)
    .div(frontReduced.add(backReduced).add(2.0 * frameDiffusionExtrapolation))
    .mul(exp(frontEffective.negate()));

// NOTE Total transmittance of isotropic light (no phase) from the y shadow value. Call in a Fn body.
// Octaves: sum of b^n * exp(-a^n * optical depth), n 0 (direct) to N.
export const frameShadowTotal = (shadowY, octaves) => {
  const total = float(shadowY).toVar();

  If(octaves.x.greaterThan(0.0), () => {
    const opticalDepth = frameShadowOpticalDepth(shadowY).toVar();

    total.assign(exp(opticalDepth.negate()).add(frameOctaveLight(octaves, opticalDepth, null, null)));
  });

  return total;
};

// NOTE Light of a shadowed light, divided by the light color: phase * direct + scattered. Call in a Fn body.
// Diffusion or single scattering: the scattered light (total - direct) is isotropic.
// Octaves: sum of b^n * phase(g * c^n) * exp(-a^n * optical depth), n 1 to N.
export const frameShadowedLight = (framePhase, octaves, rayDirection, lightDirection, shadow) => {
  const light = framePhaseWeight(framePhase, rayDirection, lightDirection).mul(shadow.x).toVar();

  If(octaves.x.greaterThan(0.0), () => {
    const opticalDepth = frameShadowOpticalDepth(shadow.y).toVar();

    light.addAssign(
      frameOctaveLight(octaves, opticalDepth, framePhase, dot(rayDirection, lightDirection).toVar()),
    );
  }).Else(() => {
    light.addAssign(shadow.y.sub(shadow.x));
  });

  return light;
};

// NOTE Spectral mode (frameRenderer.settings.spectral). Values are vec3, one for each channel (red, green, blue).
// NOTE Shadow depths are objects { x: extinction, y: effective extinction, z: reduced scattering } of vec3 values.
// Shadow values are objects { x: direct, y: total } of vec3 values. frameShadowDepth and frameShadowMarchDepth accept them.

export const frameMeanComponent = (value) => dot(value, vec3(1.0 / 3.0));

// NOTE Shadow depths of one unit of extinction. spectrum: extinction scale of each channel.
// Absorption is the part that the albedo of each channel does not scatter. The same as frameShadowStep for each channel.
export const frameSpectralShadowUnit = (spectrum, albedo, multipleScattering) => {
  const absorbed = vec3(spectrum).mul(float(1.0).sub(clamp(albedo, 0.0, 1.0))).toVar();
  const reducedScattering = vec3(spectrum).sub(absorbed).mul(multipleScattering).toVar();

  return {
    x: vec3(spectrum),
    y: sqrt(absorbed.mul(3.0).mul(absorbed.add(reducedScattering))).toVar(),
    z: reducedScattering,
  };
};

// NOTE Shadow depths of opticalDepth units. One volume has one spectrum, then all depths grow linearly.
export const frameSpectralShadowDepths = (unit, opticalDepth) => ({
  x: unit.x.mul(opticalDepth),
  y: unit.y.mul(opticalDepth),
  z: unit.z.mul(opticalDepth),
});

// NOTE Shadow depths of one march step for each channel of the grid, the same as frameShadowStep.
// extinction and absorption are vec3. Volumes in a grid voxel can have other spectra, so the depths are summed for each channel.
export const frameSpectralShadowStep = (extinction, absorption, multipleScattering) => {
  const absorbed = min(absorption, extinction).toVar();
  const reducedScattering = vec3(extinction).sub(absorbed).mul(multipleScattering).toVar();

  return {
    x: vec3(extinction),
    y: sqrt(absorbed.mul(3.0).mul(absorbed.add(reducedScattering))),
    z: reducedScattering,
  };
};

// NOTE Single-scattering albedo of each channel of a grid voxel from (extinction, absorption). 1.0 with no extinction.
export const frameSpectralGridAlbedo = (extinction, absorption) =>
  select(
    maxComponent(extinction).greaterThan(0.0),
    clamp(vec3(1.0).sub(absorption.div(max(extinction, vec3(1e-8)))), 0.0, 1.0),
    vec3(1.0),
  );

// NOTE Shadow values of each channel, the same as frameShadowTransmittance
export const frameSpectralShadowTransmittance = (depths, multipleScattering, octaves) => ({
  x: exp(depths.x.negate()),
  y: select(
    octaves.x.greaterThan(0.0),
    vec3(1.0).div(depths.x.add(1.0)),
    exp(frameShadowDepth(depths, multipleScattering).negate()),
  ),
});

// NOTE Octave light of each channel, the same as frameOctaveLight. Octave n also gets albedo^n: each octave is one more scattering.
// Call in a Fn body. framePhase null is isotropic (phase 1).
const frameSpectralOctaveLight = (octaves, opticalDepth, albedo, framePhase, cosTheta) => {
  const light = vec3(0.0).toVar();
  const extinctionScale = float(1.0).toVar();
  const contribution = float(1.0).toVar();
  const gScale = float(1.0).toVar();
  const albedoScale = vec3(1.0).toVar();
  const octaveAlbedo = clamp(albedo, 0.0, 1.0).toVar();

  Loop(frameMaxScatteringOctaves, ({ i }) => {
    If(float(i.add(1)).greaterThan(octaves.x), () => {
      Break();
    });

    extinctionScale.mulAssign(octaves.y);
    contribution.mulAssign(octaves.z);
    gScale.mulAssign(octaves.w);
    albedoScale.mulAssign(octaveAlbedo);

    const phase = framePhase ? framePhaseWeightScaled(framePhase, cosTheta, gScale) : float(1.0);

    light.addAssign(
      albedoScale.mul(contribution.mul(phase)).mul(exp(opticalDepth.mul(extinctionScale).negate())),
    );
  });

  return light;
};

// NOTE Total transmittance of isotropic light of each channel, the same as frameShadowTotal. Call in a Fn body.
export const frameSpectralShadowTotal = (shadowY, octaves, albedo) => {
  const total = vec3(shadowY).toVar();

  If(octaves.x.greaterThan(0.0), () => {
    const opticalDepth = frameShadowOpticalDepth(total).toVar();

    total.assign(
      exp(opticalDepth.negate()).add(frameSpectralOctaveLight(octaves, opticalDepth, albedo, null, null)),
    );
  });

  return total;
};

// NOTE Light of a shadowed light of each channel, the same as frameShadowedLight. Call in a Fn body.
export const frameSpectralShadowedLight = (framePhase, octaves, rayDirection, lightDirection, shadow, albedo) => {
  const light = vec3(shadow.x).mul(framePhaseWeight(framePhase, rayDirection, lightDirection)).toVar();

  If(octaves.x.greaterThan(0.0), () => {
    const opticalDepth = frameShadowOpticalDepth(vec3(shadow.y)).toVar();

    light.addAssign(
      frameSpectralOctaveLight(
        octaves,
        opticalDepth,
        albedo,
        framePhase,
        dot(rayDirection, lightDirection).toVar(),
      ),
    );
  }).Else(() => {
    light.addAssign(vec3(shadow.y).sub(shadow.x));
  });

  return light;
};

// NOTE The two entries of a spectral transmittance group from its 3 targets (core/frameSpectrum.js)
export const frameUnpackSpectralGroup = (map0, map1, map2) => ({
  a: { x: map0.rgb, y: vec3(map0.a, map1.r, map1.g) },
  b: { x: vec3(map1.b, map1.a, map2.r), y: map2.gba },
});

export const frameMaxLights = 16;
export const frameMaxHemisphereLights = 4;

// NOTE Scene lights in world space. Lights are in shadow slot order: directional, point, spot.
// NOTE Position w: 1.0 directional (xyz is the direction to the light), 2.0 point, 3.0 spot.
// NOTE Color rgb is color * intensity, color w is the spot penumbra cosine.
// NOTE Spot xyz is the direction from the target to the light, spot w is the cone cosine.
// NOTE Falloff x is the light distance, falloff y is the decay. Point and spot lights only.
export const createLightUniforms = () => ({
  frameAmbientColor: uniform(new Three.Color(0x000000)),
  frameLightProbe: uniformArray(
    Array.from({ length: 9 }, () => new Three.Vector3()),
    'vec3',
  ),
  // NOTE Sums of all hemisphere lights, for combined lighting. Sky direction is from the first one.
  frameHemiSkyColor: uniform(new Three.Color(0x000000)),
  frameHemiGroundColor: uniform(new Three.Color(0x000000)),
  frameSkyDirection: uniform(new Three.Vector3(0.0, 1.0, 0.0)),
  // NOTE Each hemisphere light, for per-volume lighting. Directions point up (sky).
  frameHemiCount: uniform(0, 'int'),
  frameHemiSkyColors: uniformArray(
    Array.from({ length: frameMaxHemisphereLights }, () => new Three.Vector3()),
    'vec3',
  ),
  frameHemiGroundColors: uniformArray(
    Array.from({ length: frameMaxHemisphereLights }, () => new Three.Vector3()),
    'vec3',
  ),
  frameHemiDirections: uniformArray(
    Array.from({ length: frameMaxHemisphereLights }, () => new Three.Vector3()),
    'vec3',
  ),
  frameLightCount: uniform(0, 'int'),
  frameLightPositions: uniformArray(
    Array.from({ length: frameMaxLights }, () => new Three.Vector4()),
    'vec4',
  ),
  frameLightColors: uniformArray(
    Array.from({ length: frameMaxLights }, () => new Three.Vector4()),
    'vec4',
  ),
  frameLightSpots: uniformArray(
    Array.from({ length: frameMaxLights }, () => new Three.Vector4()),
    'vec4',
  ),
  frameLightFalloffs: uniformArray(
    Array.from({ length: frameMaxLights }, () => new Three.Vector2()),
    'vec2',
  ),
  // NOTE Environment lights (frameRenderer.settings.environmentLighting). World directions to the light.
  // Colors are isotropic irradiance, no phase. Count is 0 with the 'outward' environment.
  frameEnvironmentCount: uniform(0, 'int'),
  frameEnvironmentDirections: uniformArray(
    Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3(0.0, 1.0, 0.0)),
    'vec3',
  ),
  frameEnvironmentColors: uniformArray(
    Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3()),
    'vec3',
  ),
  // NOTE Environment grid lights with no shadow, clamped to 0 or more. Used outside the environment grid.
  frameEnvironmentUnshadowed: uniform(new Three.Vector3()),
});

// NOTE Bound to volumes without an emissive, base color or mask grid
const createPlaceholder3D = (format) => {
  const texture = new Three.Data3DTexture(
    new Uint8Array(format === Three.RGBAFormat ? 4 : 1),
    1,
    1,
    1,
  );
  texture.format = format;
  texture.needsUpdate = true;

  return texture;
};

const textureFormats = {
  frameDensityMap: Three.RedFormat,
  frameEmissiveMap: Three.RedFormat,
  frameBaseColorMap: Three.RGBAFormat,
  frameMaskMap: Three.RedFormat,
  frameDensityMipMap: Three.RedFormat,
  frameEmissiveMipMap: Three.RedFormat,
  frameBaseColorMipMap: Three.RGBAFormat,
  frameMaskMipMap: Three.RedFormat,
};

// NOTE three.js gives texture nodes with the same texture at build time one binding (TextureNode.getUniformHash).
// NOTE Then each texture node needs its own placeholder.
const createTextureUniforms = () => {
  const placeholders = {};
  const textures = {};

  Object.entries(textureFormats).forEach(([key, format]) => {
    placeholders[key] = createPlaceholder3D(format);
    textures[key] = texture3D(placeholders[key]);
  });

  return { ...textures, placeholders };
};

// NOTE Values of one FrameVolume grid. Pool meshes set them in onBeforeRender, before each draw.
// NOTE Mip maps are the optional CPU mipmaps (FrameVolume mipmaps). 0 levels samples only the grid texture.
export const createVolumeUniforms = () => ({
  frameViewToLocal: uniform(new Three.Matrix4()),
  frameLocalToView: uniform(new Three.Matrix4()),
  frameWorldToLocal: uniform(new Three.Matrix4()),
  frameWorldScale: uniform(1.0),
  ...createTextureUniforms(),
  frameDensityMipLevels: uniform(0.0),
  frameEmissiveMipLevels: uniform(0.0),
  frameBaseColorMipLevels: uniform(0.0),
  frameMaskMipLevels: uniform(0.0),
  frameGridTexels: uniform(new Three.Vector3(1.0, 1.0, 1.0)),
  frameMipAtlasSize: uniform(new Three.Vector3(1.0, 1.0, 1.0)),
  frameUseEmissiveMap: uniform(0, 'int'),
  frameUseBaseColorMap: uniform(0, 'int'),
  frameUseMaskMap: uniform(0, 'int'),
  frameBaseColor: uniform(new Three.Color(0xffffff)),
  frameScatterColor: uniform(new Three.Color(0x000000)),
  frameExtinction: uniform(100.0),
  // NOTE Extinction scale of each channel (core/frameSpectrum.js). Only spectral shaders read it.
  frameExtinctionSpectrum: uniform(new Three.Vector3(1.0, 1.0, 1.0)),
  frameDensityScale: uniform(1.0),
  frameDensityCutoff: uniform(0.0),
  frameAbsorbance: uniform(1.0),
  frameOpacity: uniform(1.0),
  frameEmissiveIntensity: uniform(1.0),
  frameTemperatureRange: uniform(new Three.Vector2(0.0, 6500.0)),
  // NOTE Emission spectrum: (table weight, soot exponent), see core/frameBlackbody.js. Table weight 0 is the approximate blackbody.
  frameEmissionSpectrum: uniform(new Three.Vector2()),
  frameOffset3D: uniform(new Three.Vector3()),
  frameWrap3D: uniform(Three.ClampToEdgeWrapping, 'int'),
  // NOTE Phase of this volume for 'volume' lighting: (forward g, back g, back weight, Lorenz-Mie weight)
  framePhase: uniform(new Three.Vector4()),
});

const mipMaps = [
  ['densityMap3D', 'frameDensityMipMap', 'frameDensityMipLevels'],
  ['emissiveMap3D', 'frameEmissiveMipMap', 'frameEmissiveMipLevels'],
  ['baseColorMap3D', 'frameBaseColorMipMap', 'frameBaseColorMipLevels'],
  ['maskMap3D', 'frameMaskMipMap', 'frameMaskMipLevels'],
];

// NOTE All grids use the mip layout of the density grid. A grid with another size gets no mipmaps.
const setMipUniforms = (uniforms, frameVolume, volume) => {
  const { width, height, depth } = volume.densityMap3D.image;
  const useMipmaps = frameVolume.mipmaps === true && volume.mipMaps;
  const densityMip = useMipmaps && volume.mipMaps.densityMap3D;

  uniforms.frameGridTexels.value.set(width, height, depth);

  if (densityMip) {
    const atlas = densityMip.texture.image;

    uniforms.frameMipAtlasSize.value.set(atlas.width, atlas.height, atlas.depth);
  }

  mipMaps.forEach(([key, mapKey, levelsKey]) => {
    const source = volume[key];
    const mip = densityMip && volume.mipMaps[key];
    const sameSize =
      source &&
      source.image.width === width &&
      source.image.height === height &&
      source.image.depth === depth;

    uniforms[mapKey].value = mip ? mip.texture : uniforms.placeholders[mapKey];
    uniforms[levelsKey].value = mip && sameSize ? mip.levels : 0;
  });
};

export const setVolumeUniforms = (uniforms, frameVolume, volume) => {
  uniforms.frameViewToLocal.value.copy(volume.viewToLocal);
  uniforms.frameLocalToView.value.copy(volume.localToView);
  uniforms.frameWorldToLocal.value.copy(volume.worldToLocal);
  uniforms.frameWorldScale.value = volume.matrixWorld.getMaxScaleOnAxis();
  uniforms.frameDensityMap.value = volume.densityMap3D;
  uniforms.frameEmissiveMap.value = volume.emissiveMap3D || uniforms.placeholders.frameEmissiveMap;
  uniforms.frameBaseColorMap.value =
    volume.baseColorMap3D || uniforms.placeholders.frameBaseColorMap;
  uniforms.frameMaskMap.value = volume.maskMap3D || uniforms.placeholders.frameMaskMap;
  uniforms.frameUseEmissiveMap.value = volume.emissiveMap3D ? 1 : 0;
  uniforms.frameUseBaseColorMap.value = volume.baseColorMap3D ? 1 : 0;
  uniforms.frameUseMaskMap.value = volume.maskMap3D ? 1 : 0;
  uniforms.frameBaseColor.value.copy(frameVolume.baseColor);
  uniforms.frameScatterColor.value.copy(frameVolume.scatterColor);
  uniforms.frameExtinction.value = frameVolume.extinction;
  getFrameExtinctionSpectrum(frameVolume, uniforms.frameExtinctionSpectrum.value);
  uniforms.frameDensityScale.value = frameVolume.densityScale;
  uniforms.frameDensityCutoff.value = frameVolume.densityCutoff;
  uniforms.frameAbsorbance.value = frameVolume.absorbance;
  uniforms.frameOpacity.value = frameVolume.opacity;
  uniforms.frameEmissiveIntensity.value = frameVolume.emissiveIntensity;
  uniforms.frameTemperatureRange.value.copy(frameVolume.temperatureRange);
  getFrameEmissionSpectrum(frameVolume, uniforms.frameEmissionSpectrum.value);
  uniforms.frameOffset3D.value.copy(frameVolume.offset3D);
  uniforms.frameWrap3D.value = frameVolume.wrap3D;
  getFramePhase(frameVolume, uniforms.framePhase.value);

  setMipUniforms(uniforms, frameVolume, volume);
};

// NOTE Sampling of one FrameVolume grid. Positions are in the local unit box (-0.5 to 0.5).
// NOTE lod is the mip level. Only shaders built with useMipmaps read it. Call the sample functions in a Fn body.
export const createVolumeNodes = (volume, useMipmaps = false) => {
  const { frameGridTexels, frameMipAtlasSize } = volume;

  // NOTE Level 1 and up of the mip atlas. The layout is the same as in frameMipmaps.js.
  const sampleMipAtlas = (mipMap, level, uvw) => {
    const size = max(vec3(1.0), ceil(frameGridTexels.div(exp2(level))));
    const offset = frameMipAtlasSize.x.sub(frameMipAtlasSize.x.div(exp2(level.sub(1.0))));
    const texel = clamp(uvw.mul(size), vec3(0.5), size.sub(0.5));

    return mipMap
      .sample(vec3(texel.x.add(offset), texel.y, texel.z).div(frameMipAtlasSize))
      .level(float(0.0));
  };

  // NOTE Linear filter between two mip levels, the same as LinearMipmapLinearFilter
  const sampleMipmapped = (map, mipMap, levels, position, lod) => {
    const uvw = vec3(position).toVar();
    const result = vec4(0.0).toVar();
    const level = min(lod, levels).toVar();

    If(level.lessThanEqual(0.0), () => {
      result.assign(map.sample(uvw).level(float(0.0)));
    }).Else(() => {
      const level0 = floor(level).toVar();
      const low = vec4(0.0).toVar();

      If(level0.lessThan(0.5), () => {
        low.assign(map.sample(uvw).level(float(0.0)));
      }).Else(() => {
        low.assign(sampleMipAtlas(mipMap, level0, uvw));
      });

      const high = sampleMipAtlas(mipMap, min(level0.add(1.0), levels), uvw);

      result.assign(mix(low, high, level.sub(level0)));
    });

    return result;
  };

  const sample3D = (map, mipMap, levels, uvw, lod) =>
    useMipmaps
      ? sampleMipmapped(map, mipMap, levels, uvw, lod)
      : map.sample(uvw).level(float(0.0));

  // NOTE Samples a grid only when the volume has it. Returns fallback when not.
  // NOTE A branch, not select: select also samples the placeholder texture.
  const sampleOptional = (useMap, map, mipMap, levels, uvw, lod, fallback) => {
    const value = vec4(fallback).toVar();

    If(useMap.equal(1), () => {
      value.assign(sample3D(map, mipMap, levels, uvw, lod));
    });

    return value;
  };

  // NOTE Mip level for a footprint of the given size in local units of the longest box side
  const getLod = (localSize) => max(0.0, log2(localSize.mul(maxComponent(frameGridTexels))));

  const mirrorAxis = (value) => {
    const period = mod(value, 2.0);

    return select(period.greaterThan(1.0), float(2.0).sub(period), period);
  };

  const wrapUv = (uvw) =>
    select(
      volume.frameWrap3D.equal(Three.RepeatWrapping),
      fract(uvw),
      select(
        volume.frameWrap3D.equal(Three.MirroredRepeatWrapping),
        vec3(mirrorAxis(uvw.x), mirrorAxis(uvw.y), mirrorAxis(uvw.z)),
        uvw,
      ),
    );

  const gridUv = (localPosition) => wrapUv(localPosition.add(0.5).add(volume.frameOffset3D));

  // NOTE Returns extinction for each world unit
  const sampleExtinction = (localPosition, lod) => {
    const mask = sampleOptional(
      volume.frameUseMaskMap,
      volume.frameMaskMap,
      volume.frameMaskMipMap,
      volume.frameMaskMipLevels,
      localPosition.add(0.5),
      lod,
      1.0,
    ).r;
    const value = sample3D(
      volume.frameDensityMap,
      volume.frameDensityMipMap,
      volume.frameDensityMipLevels,
      gridUv(localPosition),
      lod,
    ).r.mul(mask);

    return select(value.greaterThan(volume.frameDensityCutoff), value, float(0.0))
      .mul(volume.frameDensityScale)
      .mul(volume.frameExtinction)
      .div(volume.frameWorldScale);
  };

  const insideBox = (localPosition) => maxComponent(abs(localPosition)).lessThanEqual(0.5);

  const boxExit = (origin, direction) => {
    const inverseDirection = vec3(1.0).div(direction);
    const tMin = vec3(-0.5).sub(origin).mul(inverseDirection);
    const tMax = vec3(0.5).sub(origin).mul(inverseDirection);

    return max(0.0, minComponent(max(tMin, tMax)));
  };

  // NOTE Returns the part of the segment from start to end (0.0 to 1.0) that is in the box
  const boxSegment = (start, end) => {
    const inverseDirection = vec3(1.0).div(end.sub(start));
    const tMin = vec3(-0.5).sub(start).mul(inverseDirection);
    const tMax = vec3(0.5).sub(start).mul(inverseDirection);

    return vec2(
      max(0.0, maxComponent(min(tMin, tMax))),
      min(1.0, minComponent(max(tMin, tMax))),
    );
  };

  const sampleAlbedo = (localPosition, lod) =>
    volume.frameBaseColor.mul(
      sampleOptional(
        volume.frameUseBaseColorMap,
        volume.frameBaseColorMap,
        volume.frameBaseColorMipMap,
        volume.frameBaseColorMipLevels,
        gridUv(localPosition),
        lod,
        1.0,
      ).rgb,
    );

  // NOTE Blackbody color, temperature in Kelvin. Source - https://www.shadertoy.com/view/4tdGWM
  const blackBody = (temperature) => {
    const kelvin = max(temperature, 1e-3);
    const radiation = vec3(
      float(1.0).div(exp(float(19e3).div(kelvin)).sub(1.0)),
      float(3.375).div(exp(float(19e3 * 1.5).div(kelvin)).sub(1.0)),
      float(8.0).div(exp(float(19e3 * 2.0).div(kelvin)).sub(1.0)),
    );
    const peak = maxComponent(radiation);

    return select(
      temperature.greaterThan(0.0).and(peak.greaterThan(0.0)),
      radiation.div(peak),
      vec3(0.0),
    );
  };

  const sampleEmission = (localPosition, lod) => {
    const range = volume.frameTemperatureRange;
    const value = sampleOptional(
      volume.frameUseEmissiveMap,
      volume.frameEmissiveMap,
      volume.frameEmissiveMipMap,
      volume.frameEmissiveMipLevels,
      gridUv(localPosition),
      lod,
      0.0,
    ).r;
    const temperature = mix(range.x, range.y, value);

    // NOTE Emitted power increases with temperature^4 (Stefan-Boltzmann). Range top gives 1.0.
    const power = pow(temperature.div(max(range.y, 1.0)), 4.0);
    const spectrum = volume.frameEmissionSpectrum;
    const color = select(
      spectrum.x.greaterThan(0.0),
      select(temperature.greaterThan(0.0), frameBlackbodyColor(temperature, spectrum.y), vec3(0.0)),
      blackBody(temperature),
    );

    return select(
      volume.frameUseEmissiveMap.equal(1),
      color.mul(power).mul(volume.frameEmissiveIntensity),
      vec3(0.0),
    );
  };

  return {
    getLod,
    sampleExtinction,
    insideBox,
    boxExit,
    boxSegment,
    sampleAlbedo,
    sampleEmission,
  };
};

export const frameMaxShadowCascades = 4;

// NOTE World-space shadow grid cascades. Cascade 0 is the finest, near the camera.
// All cascades are z slices (tiles) in one 2D atlas.
export const createGridUniforms = (frameJitter) => ({
  frameGridMin: uniformArray(
    Array.from({ length: frameMaxShadowCascades }, () => new Three.Vector3()),
    'vec3',
  ),
  frameGridSize: uniformArray(
    Array.from({ length: frameMaxShadowCascades }, () => new Three.Vector3()),
    'vec3',
  ),
  frameGridVoxel: uniformArray(
    Array.from({ length: frameMaxShadowCascades }, () => new Three.Vector3()),
    'vec3',
  ),
  frameGridCount: uniform(0, 'int'),
  frameGridResolution: uniform(1.0),
  frameGridColumns: uniform(1.0),
  frameGridAtlasSize: uniform(new Three.Vector2(1.0, 1.0)),
  frameJitter,
});

// NOTE Environment grid: environment light of each voxel of the last shadow grid cascade, in its own atlas
export const createEnvironmentGridUniforms = () => ({
  frameEnvironmentGridCascade: uniform(0, 'int'),
  frameEnvironmentGridColumns: uniform(1.0),
  frameEnvironmentGridAtlasSize: uniform(new Three.Vector2(1.0, 1.0)),
});

export const createGridNodes = (grid) => {
  const { frameGridMin, frameGridSize, frameGridCount, frameGridResolution, frameGridColumns } =
    grid;

  const gridUvw = (cascade, worldPosition) =>
    worldPosition.sub(frameGridMin.element(cascade)).div(frameGridSize.element(cascade));

  // NOTE Half a voxel inside the cascade. Then the linear filter does not read the clamped edge.
  const insideGrid = (uvw) => {
    const inset = float(0.5).div(frameGridResolution);

    return minComponent(uvw)
      .greaterThanEqual(inset)
      .and(maxComponent(uvw).lessThanEqual(float(1.0).sub(inset)));
  };

  // NOTE Finest cascade from the first cascade that contains the position, or -1
  const findCascade = (worldPosition, firstCascade) => {
    let cascade = int(-1);

    for (let i = frameMaxShadowCascades - 1; i >= 0; i--) {
      cascade = select(
        int(i)
          .lessThan(frameGridCount)
          .and(int(i).greaterThanEqual(firstCascade))
          .and(insideGrid(gridUvw(int(i), worldPosition))),
        int(i),
        cascade,
      );
    }

    return cascade;
  };

  // NOTE Hardware bilinear filter in the slice, manual linear filter between slices.
  // NOTE The grid is the z slices (tiles) from tileOffset in an atlas with columns tile columns.
  const sampleTiles = (atlas, tileOffset, columns, atlasSize, uvw) => {
    const resolution = frameGridResolution;
    const z = uvw.z.mul(resolution).sub(0.5);
    const z0 = clamp(floor(z), 0.0, resolution.sub(1.0));
    const z1 = min(z0.add(1.0), resolution.sub(1.0));
    const blend = clamp(z.sub(z0), 0.0, 1.0);
    const xy = clamp(uvw.xy.mul(resolution), vec2(0.5), vec2(resolution.sub(0.5)));

    const tileUv = (index) => {
      const tile = vec2(mod(index, columns), floor(index.div(columns)));

      return tile.mul(resolution).add(xy).div(atlasSize);
    };

    return mix(
      frameSample(atlas, tileUv(tileOffset.add(z0))),
      frameSample(atlas, tileUv(tileOffset.add(z1))),
      blend,
    );
  };

  const sampleGrid = (atlas, cascade, uvw) =>
    sampleTiles(
      atlas,
      float(cascade).mul(frameGridResolution),
      frameGridColumns,
      grid.frameGridAtlasSize,
      uvw,
    );

  // NOTE Environment grid: the last cascade only, in its own atlas. outside is the value outside it.
  // NOTE Call in a Fn body. Returns a vec4 variable.
  const sampleEnvironmentGrid = (map, environmentGrid, worldPosition, outside) => {
    const value = vec4(outside).toVar();
    const uvw = gridUvw(environmentGrid.frameEnvironmentGridCascade, worldPosition).toVar();

    If(insideGrid(uvw), () => {
      value.assign(
        sampleTiles(
          map,
          float(0.0),
          environmentGrid.frameEnvironmentGridColumns,
          environmentGrid.frameEnvironmentGridAtlasSize,
          uvw,
        ),
      );
    });

    return value;
  };

  // NOTE Transmittance of the shadow slots at a world position. 1.0 outside the grid.
  // Call in a Fn body. Returns two vec4 variables.
  // NOTE One vec4 for each map
  const sampleShadows = (maps, worldPosition) => {
    const shadows = maps.map(() => vec4(1.0).toVar());
    const cascade = findCascade(worldPosition, int(0)).toVar();

    If(cascade.greaterThanEqual(0), () => {
      const uvw = gridUvw(cascade, worldPosition).toVar();

      maps.forEach((map, index) => shadows[index].assign(sampleGrid(map, cascade, uvw)));

      // NOTE Blend to the next cascade near the sides of this cascade. Then cascade borders are not visible.
      const sideDistance = min(uvw, vec3(1.0).sub(uvw));
      const blend = float(1.0).sub(smoothstep(0.0, 0.1, minComponent(sideDistance))).toVar();

      If(blend.greaterThan(0.0), () => {
        const nextCascade = findCascade(worldPosition, cascade.add(1)).toVar();

        If(nextCascade.greaterThanEqual(0), () => {
          const nextUvw = gridUvw(nextCascade, worldPosition).toVar();

          maps.forEach((map, index) =>
            shadows[index].assign(mix(shadows[index], sampleGrid(map, nextCascade, nextUvw), blend)),
          );
        });
      });
    });

    return shadows;
  };

  // NOTE Cascade and grid position of an atlas pixel
  const getGridCell = (fragCoord) => {
    const resolution = frameGridResolution;
    const tile = floor(fragCoord.div(resolution));
    const tileIndex = tile.y.mul(frameGridColumns).add(tile.x);
    const cascade = floor(tileIndex.div(resolution));
    const z = tileIndex.sub(cascade.mul(resolution));

    return {
      cascade: int(cascade),
      gridUvw: vec3(fragCoord.sub(tile.mul(resolution)), z.add(0.5)).div(resolution),
    };
  };

  return {
    gridUvw,
    insideGrid,
    findCascade,
    sampleTiles,
    sampleGrid,
    sampleEnvironmentGrid,
    sampleShadows,
    getGridCell,
  };
};

// NOTE Instanced quad for density passes. One instance for each tile (slice), the quad covers the volume rectangle.
export const createTileUniforms = () => ({
  frameTileSize: uniform(new Three.Vector2(1.0, 1.0)),
  frameTileColumns: uniform(1.0),
  frameTargetSize: uniform(new Three.Vector2(1.0, 1.0)),
});

// NOTE Froxel area of all volumes (core/frameView.js getFroxelArea). Passes over the whole froxel grid draw only it.
export const createAreaUniforms = () => ({
  frameAreaRect: uniform(new Three.Vector4()),
  frameAreaSliceStart: uniform(0.0),
});

export const frameTileVertex = (tileUniforms, rect, sliceStart) => {
  const { frameTileSize, frameTileColumns, frameTargetSize } = tileUniforms;
  const slice = sliceStart.add(float(instanceIndex));
  const tile = vec2(mod(slice, frameTileColumns), floor(slice.div(frameTileColumns)));
  const cell = mix(rect.xy, rect.zw, positionGeometry.xy.mul(0.5).add(0.5));

  return vec4(tile.mul(frameTileSize).add(cell).div(frameTargetSize).mul(2.0).sub(1.0), 0.0, 1.0);
};

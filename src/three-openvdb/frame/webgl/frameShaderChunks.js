import * as Three from 'three';
import { getFramePhase, frameMieAsymmetry, frameMaxScatteringOctaves } from '../core/framePhase.js';
import { frameMieTable, frameMieTableSize } from '../core/frameMieTable.js';
import { frameMaxEnvironmentLights } from '../core/frameEnvironment.js';
import { getFrameExtinctionSpectrum } from '../core/frameSpectrum.js';

// NOTE Froxel grid layout and view reconstruction. Shared by all froxel passes.
export const froxelPars = `
  uniform vec3 froxelGrid;
  uniform float froxelColumns;
  uniform vec2 froxelRange;
  uniform mat4 froxelProjectionInverse;
  uniform int froxelSubSteps;

  float frameSliceDepth(float t) {
    return froxelRange.x * pow(froxelRange.y / froxelRange.x, t);
  }

  vec3 frameGetViewPosition(vec2 uv, float viewDepth) {
    vec4 nearPoint = froxelProjectionInverse * vec4(uv * 2.0 - 1.0, -1.0, 1.0);
    vec4 farPoint = froxelProjectionInverse * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
    nearPoint /= nearPoint.w;
    farPoint /= farPoint.w;

    float t = (viewDepth + nearPoint.z) / (nearPoint.z - farPoint.z);

    return mix(nearPoint.xyz, farPoint.xyz, t);
  }
`;

// NOTE Per-pixel noise that changes each frame. Jitter turns banding into noise, temporal accumulation removes the noise.
// Interleaved gradient noise - https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
export const noisePars = `
  uniform float frameJitter;

  // NOTE Returns 0.5 when jitter is off (frameJitter is negative)
  float frameNoise(vec2 pixel) {
    if (frameJitter < 0.0) {
      return 0.5;
    }

    float noise = fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));

    return fract(noise + frameJitter);
  }
`;

// NOTE Lorenz-Mie phase table, see core/frameMieTable.js. Float values, read with texelFetch and a linear blend.
export const frameMieTexture = new Three.DataTexture(
  frameMieTable,
  frameMieTableSize,
  1,
  Three.RedFormat,
  Three.FloatType,
);

frameMieTexture.minFilter = Three.NearestFilter;
frameMieTexture.magFilter = Three.NearestFilter;
frameMieTexture.needsUpdate = true;

// NOTE Phase function of direct lights. framePhase is (forward g, back g, back weight, Lorenz-Mie weight).
// See core/framePhase.js.
// NOTE Multiple scattering in shadow marches. frameMultipleScattering is 1 - g (core/framePhase.js), 0.0 is single scattering.
// NOTE frameScatteringOctaves is (count N, extinction a, contribution b, phase c) of the indirect light octaves. N 0 is off.
export const shadowPars = `
  #define FRAME_MAX_SCATTERING_OCTAVES ${frameMaxScatteringOctaves}

  uniform float frameMultipleScattering;
  uniform vec4 frameScatteringOctaves;

  // NOTE Absorption of the shadow extinction: the part of the light that the albedo (linear luminance) does not scatter
  float frameShadowAbsorption(float extinction, vec3 albedo) {
    return extinction * (1.0 - clamp(dot(albedo, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0));
  }

  // NOTE March values for each unit of length: (extinction, effective extinction, reduced scattering).
  // Diffusion approximation: effective = sqrt(3 * absorption * (absorption + reduced)).
  vec3 frameShadowStep(float extinction, float absorption) {
    float absorbed = min(absorption, extinction);
    float reducedScattering = (extinction - absorbed) * frameMultipleScattering;

    return vec3(extinction, sqrt(3.0 * absorbed * (absorbed + reducedScattering)), reducedScattering);
  }

  // NOTE -log of the total transmittance (direct and scattered light) of the summed march values.
  // exp(-effective) / (1 + 0.75 * reduced), never less than the direct light exp(-extinction).
  float frameShadowDepth(vec3 depths) {
    if (frameMultipleScattering <= 0.0) {
      return depths.x;
    }

    return min(depths.x, depths.y + log(1.0 + 0.75 * depths.z));
  }

  // NOTE Optical depth of the least shadowed light term. Marches stop when it is large.
  // Octaves: the last octave has extinction * a^N, so the march goes deeper.
  float frameShadowMarchDepth(vec3 depths) {
    if (frameScatteringOctaves.x > 0.0) {
      return depths.x * pow(frameScatteringOctaves.y, frameScatteringOctaves.x);
    }

    return frameShadowDepth(depths);
  }

  // NOTE Shadow values (direct, total) transmittance. Direct light gets the phase function, scattered light (total - direct) is isotropic.
  // NOTE Octaves: y is 1 / (1 + optical depth). Half float targets keep it for deep volumes, and 1.0 is no shadow.
  vec2 frameShadowTransmittance(vec3 depths) {
    if (frameScatteringOctaves.x > 0.0) {
      return vec2(exp(-depths.x), 1.0 / (1.0 + depths.x));
    }

    return vec2(exp(-depths.x), exp(-frameShadowDepth(depths)));
  }

  // NOTE Optical depth from the y shadow value of octaves
  float frameShadowOpticalDepth(float shadowY) {
    return max(1.0 / max(shadowY, 1e-6) - 1.0, 0.0);
  }

  // NOTE Total transmittance of isotropic light (no phase) from the y shadow value.
  // Octaves: sum of b^n * exp(-a^n * optical depth), n 0 (direct) to N.
  float frameShadowTotal(float shadowY) {
    if (frameScatteringOctaves.x <= 0.0) {
      return shadowY;
    }

    float opticalDepth = frameShadowOpticalDepth(shadowY);
    float total = exp(-opticalDepth);
    float extinctionScale = 1.0;
    float contribution = 1.0;

    for (int n = 1; n <= FRAME_MAX_SCATTERING_OCTAVES; n++) {
      if (float(n) > frameScatteringOctaves.x) {
        break;
      }

      extinctionScale *= frameScatteringOctaves.y;
      contribution *= frameScatteringOctaves.z;
      total += contribution * exp(-opticalDepth * extinctionScale);
    }

    return total;
  }
`;

export const phasePars = `
  uniform vec4 framePhase;
  uniform sampler2D frameMieMap;

  // NOTE Henyey-Greenstein phase divided by the isotropic phase 1 / (4 PI). g = 0 gives 1.
  float frameHenyeyGreenstein(float cosTheta, float g) {
    float g2 = g * g;

    return (1.0 - g2) / pow(max(1.0 + g2 - 2.0 * g * cosTheta, 1e-4), 1.5);
  }

  // NOTE Table texel u is at the scattering angle PI * u^2
  float frameMiePhase(float cosTheta) {
    float u = sqrt(acos(clamp(cosTheta, -1.0, 1.0)) * 0.3183098862);
    float texel = u * float(${frameMieTableSize - 1});
    int index = min(int(texel), ${frameMieTableSize - 2});
    float a = texelFetch(frameMieMap, ivec2(index, 0), 0).r;
    float b = texelFetch(frameMieMap, ivec2(index + 1, 0), 0).r;

    return mix(a, b, texel - float(index));
  }

  // NOTE rayDirection: from the camera to the sample. lightDirection: from the sample to the light.
  float framePhaseWeight(vec3 rayDirection, vec3 lightDirection) {
    float cosTheta = dot(rayDirection, lightDirection);
    float weight = mix(
      frameHenyeyGreenstein(cosTheta, framePhase.x),
      frameHenyeyGreenstein(cosTheta, framePhase.y),
      framePhase.z
    );

    if (framePhase.w > 0.0) {
      weight = mix(weight, frameMiePhase(cosTheta), framePhase.w);
    }

    return weight;
  }

  // NOTE Phase with all g multiplied by gScale. Lorenz-Mie uses Henyey-Greenstein with the table asymmetry g.
  float framePhaseWeightScaled(float cosTheta, float gScale) {
    float weight = mix(
      frameHenyeyGreenstein(cosTheta, framePhase.x * gScale),
      frameHenyeyGreenstein(cosTheta, framePhase.y * gScale),
      framePhase.z
    );

    if (framePhase.w > 0.0) {
      weight = mix(weight, frameHenyeyGreenstein(cosTheta, ${frameMieAsymmetry} * gScale), framePhase.w);
    }

    return weight;
  }
`;

// NOTE Light of a shadowed directional, point or spot light. Needs phasePars and shadowPars before it.
export const scatteringPars = `
  // NOTE Light divided by the light color: phase * direct + scattered.
  // Diffusion or single scattering: the scattered light (total - direct) is isotropic.
  // Octaves: sum of b^n * phase(g * c^n) * exp(-a^n * optical depth), n 1 to N.
  float frameShadowedLight(vec3 rayDirection, vec3 lightDirection, vec2 shadow) {
    float light = framePhaseWeight(rayDirection, lightDirection) * shadow.x;

    if (frameScatteringOctaves.x <= 0.0) {
      return light + shadow.y - shadow.x;
    }

    float cosTheta = dot(rayDirection, lightDirection);
    float opticalDepth = frameShadowOpticalDepth(shadow.y);
    float extinctionScale = 1.0;
    float contribution = 1.0;
    float gScale = 1.0;

    for (int n = 1; n <= FRAME_MAX_SCATTERING_OCTAVES; n++) {
      if (float(n) > frameScatteringOctaves.x) {
        break;
      }

      extinctionScale *= frameScatteringOctaves.y;
      contribution *= frameScatteringOctaves.z;
      gScale *= frameScatteringOctaves.w;
      light += contribution * framePhaseWeightScaled(cosTheta, gScale) * exp(-opticalDepth * extinctionScale);
    }

    return light;
  }
`;

// NOTE Spectral mode (frameRenderer.settings.spectral, define FRAME_SPECTRAL). Values are vec3, one for each channel.
// Needs shadowPars before it. The same functions as the spectral TSL functions.
export const spectralPars = `
  #ifdef FRAME_SPECTRAL
    struct FrameSpectralDepths {
      vec3 extinction;
      vec3 effective;
      vec3 reduced;
    };

    struct FrameSpectralShadow {
      vec3 direct;
      vec3 total;
    };

    float frameMeanComponent(vec3 value) {
      return dot(value, vec3(1.0 / 3.0));
    }

    float frameMinComponent(vec3 value) {
      return min(value.x, min(value.y, value.z));
    }

    float frameMaxComponent(vec3 value) {
      return max(value.x, max(value.y, value.z));
    }

    // NOTE Shadow depths of one unit of extinction. spectrum: extinction scale of each channel.
    // Absorption is the part that the albedo of each channel does not scatter. The same as frameShadowStep for each channel.
    FrameSpectralDepths frameSpectralShadowUnit(vec3 spectrum, vec3 albedo) {
      vec3 absorbed = spectrum * (1.0 - clamp(albedo, 0.0, 1.0));
      vec3 reducedScattering = (spectrum - absorbed) * frameMultipleScattering;

      return FrameSpectralDepths(spectrum, sqrt(3.0 * absorbed * (absorbed + reducedScattering)), reducedScattering);
    }

    // NOTE Shadow depths of opticalDepth units. One volume has one spectrum, then all depths grow linearly.
    FrameSpectralDepths frameSpectralShadowDepths(FrameSpectralDepths unit, float opticalDepth) {
      return FrameSpectralDepths(unit.extinction * opticalDepth, unit.effective * opticalDepth, unit.reduced * opticalDepth);
    }

    // NOTE The same as frameShadowDepth for each channel
    vec3 frameSpectralShadowDepth(FrameSpectralDepths depths) {
      if (frameMultipleScattering <= 0.0) {
        return depths.extinction;
      }

      return min(depths.extinction, depths.effective + log(1.0 + 0.75 * depths.reduced));
    }

    // NOTE The same as frameShadowMarchDepth for each channel
    vec3 frameSpectralShadowMarchDepth(FrameSpectralDepths depths) {
      if (frameScatteringOctaves.x > 0.0) {
        return depths.extinction * pow(frameScatteringOctaves.y, frameScatteringOctaves.x);
      }

      return frameSpectralShadowDepth(depths);
    }

    // NOTE The same as frameShadowTransmittance for each channel
    FrameSpectralShadow frameSpectralShadowTransmittance(FrameSpectralDepths depths) {
      vec3 direct = exp(-depths.extinction);

      if (frameScatteringOctaves.x > 0.0) {
        return FrameSpectralShadow(direct, 1.0 / (1.0 + depths.extinction));
      }

      return FrameSpectralShadow(direct, exp(-frameSpectralShadowDepth(depths)));
    }

    // NOTE Octave light of each channel, isotropic. Octave n also gets albedo^n: each octave is one more scattering.
    vec3 frameSpectralOctaveLight(vec3 opticalDepth, vec3 albedo) {
      vec3 light = vec3(0.0);
      vec3 albedoScale = vec3(1.0);
      vec3 octaveAlbedo = clamp(albedo, 0.0, 1.0);
      float extinctionScale = 1.0;
      float contribution = 1.0;

      for (int n = 1; n <= FRAME_MAX_SCATTERING_OCTAVES; n++) {
        if (float(n) > frameScatteringOctaves.x) {
          break;
        }

        extinctionScale *= frameScatteringOctaves.y;
        contribution *= frameScatteringOctaves.z;
        albedoScale *= octaveAlbedo;
        light += albedoScale * contribution * exp(-opticalDepth * extinctionScale);
      }

      return light;
    }

    vec3 frameSpectralShadowOpticalDepth(vec3 shadowY) {
      return max(1.0 / max(shadowY, vec3(1e-6)) - 1.0, vec3(0.0));
    }

    // NOTE Total transmittance of isotropic light of each channel, the same as frameShadowTotal
    vec3 frameSpectralShadowTotal(vec3 shadowY, vec3 albedo) {
      if (frameScatteringOctaves.x <= 0.0) {
        return shadowY;
      }

      vec3 opticalDepth = frameSpectralShadowOpticalDepth(shadowY);

      return exp(-opticalDepth) + frameSpectralOctaveLight(opticalDepth, albedo);
    }

    // NOTE Single-scattering albedo of each channel of a grid voxel from (extinction, absorption). 1.0 with no extinction.
    vec3 frameSpectralGridAlbedo(vec3 extinction, vec3 absorption) {
      if (frameMaxComponent(extinction) <= 0.0) {
        return vec3(1.0);
      }

      return clamp(1.0 - absorption / max(extinction, vec3(1e-8)), 0.0, 1.0);
    }

    // NOTE Shadow depths of one march step for each channel of the grid, the same as frameShadowStep
    FrameSpectralDepths frameSpectralShadowStep(vec3 extinction, vec3 absorption) {
      vec3 absorbed = min(absorption, extinction);
      vec3 reducedScattering = (extinction - absorbed) * frameMultipleScattering;

      return FrameSpectralDepths(extinction, sqrt(3.0 * absorbed * (absorbed + reducedScattering)), reducedScattering);
    }
  #endif
`;

// NOTE Spectral light of directional, point and spot lights. Needs phasePars and spectralPars before it.
export const spectralScatteringPars = `
  #ifdef FRAME_SPECTRAL
    // NOTE Octave light of each channel with the phase g * c^n, the same as frameShadowedLight
    vec3 frameSpectralPhaseOctaveLight(vec3 opticalDepth, vec3 albedo, float cosTheta) {
      vec3 light = vec3(0.0);
      vec3 albedoScale = vec3(1.0);
      vec3 octaveAlbedo = clamp(albedo, 0.0, 1.0);
      float extinctionScale = 1.0;
      float contribution = 1.0;
      float gScale = 1.0;

      for (int n = 1; n <= FRAME_MAX_SCATTERING_OCTAVES; n++) {
        if (float(n) > frameScatteringOctaves.x) {
          break;
        }

        extinctionScale *= frameScatteringOctaves.y;
        contribution *= frameScatteringOctaves.z;
        gScale *= frameScatteringOctaves.w;
        albedoScale *= octaveAlbedo;
        light += albedoScale * contribution * framePhaseWeightScaled(cosTheta, gScale) * exp(-opticalDepth * extinctionScale);
      }

      return light;
    }

    // NOTE Light of a shadowed light of each channel, the same as frameShadowedLight
    vec3 frameSpectralShadowedLight(vec3 rayDirection, vec3 lightDirection, FrameSpectralShadow shadow, vec3 albedo) {
      vec3 light = framePhaseWeight(rayDirection, lightDirection) * shadow.direct;

      if (frameScatteringOctaves.x <= 0.0) {
        return light + shadow.total - shadow.direct;
      }

      return light + frameSpectralPhaseOctaveLight(
        frameSpectralShadowOpticalDepth(shadow.total),
        albedo,
        dot(rayDirection, lightDirection)
      );
    }
  #endif
`;

// NOTE Sampling of one FrameVolume grid. Positions are in the local unit box (-0.5 to 0.5).
export const volumePars = `
  #define FRAME_WRAP_REPEAT ${Three.RepeatWrapping}
  #define FRAME_WRAP_MIRROR ${Three.MirroredRepeatWrapping}

  uniform mat4 frameViewToLocal;
  uniform mat4 frameLocalToView;
  uniform mat4 frameWorldToLocal;
  uniform float frameWorldScale;

  uniform highp sampler3D frameDensityMap;
  uniform highp sampler3D frameEmissiveMap;
  uniform highp sampler3D frameBaseColorMap;
  uniform highp sampler3D frameMaskMap;
  uniform bool frameUseEmissiveMap;
  uniform bool frameUseBaseColorMap;
  uniform bool frameUseMaskMap;

  uniform vec3 frameBaseColor;
  uniform vec3 frameScatterColor;
  uniform float frameExtinction;
  // NOTE Extinction scale of each channel (core/frameSpectrum.js). Only spectral shaders read it.
  uniform vec3 frameExtinctionSpectrum;
  uniform float frameDensityScale;
  uniform float frameDensityCutoff;
  uniform float frameAbsorbance;
  uniform float frameOpacity;
  uniform float frameEmissiveIntensity;
  uniform vec2 frameTemperatureRange;
  uniform vec3 frameOffset3D;
  uniform int frameWrap3D;

  float frameMirrorAxis(float value) {
    float period = mod(value, 2.0);

    return period > 1.0 ? 2.0 - period : period;
  }

  vec3 frameWrapUv(vec3 uv) {
    if (frameWrap3D == FRAME_WRAP_REPEAT) {
      return fract(uv);
    }

    if (frameWrap3D == FRAME_WRAP_MIRROR) {
      return vec3(frameMirrorAxis(uv.x), frameMirrorAxis(uv.y), frameMirrorAxis(uv.z));
    }

    return uv;
  }

  // NOTE Mip level for a footprint of the given size in local units of the longest box side
  float frameLod(float localSize) {
    vec3 texels = vec3(textureSize(frameDensityMap, 0));

    return max(0.0, log2(localSize * max(texels.x, max(texels.y, texels.z))));
  }

  // NOTE Returns extinction for each world unit
  float frameSampleExtinction(vec3 localPosition, float lod) {
    vec3 uv = frameWrapUv(localPosition + 0.5 + frameOffset3D);
    float value = textureLod(frameDensityMap, uv, lod).r;

    if (frameUseMaskMap) {
      value *= textureLod(frameMaskMap, localPosition + 0.5, lod).r;
    }

    value = value > frameDensityCutoff ? value : 0.0;

    return value * frameDensityScale * frameExtinction / frameWorldScale;
  }

  bool frameInsideBox(vec3 localPosition) {
    vec3 localAbs = abs(localPosition);

    return max(localAbs.x, max(localAbs.y, localAbs.z)) <= 0.5;
  }

  float frameBoxExit(vec3 origin, vec3 direction) {
    vec3 inverseDirection = 1.0 / direction;
    vec3 tMin = (vec3(-0.5) - origin) * inverseDirection;
    vec3 tMax = (vec3(0.5) - origin) * inverseDirection;
    vec3 tFar = max(tMin, tMax);

    return max(0.0, min(tFar.x, min(tFar.y, tFar.z)));
  }

  // NOTE Returns the part of the segment from start to end (0.0 to 1.0) that is in the box
  vec2 frameBoxSegment(vec3 start, vec3 end) {
    vec3 inverseDirection = 1.0 / (end - start);
    vec3 tMin = (vec3(-0.5) - start) * inverseDirection;
    vec3 tMax = (vec3(0.5) - start) * inverseDirection;
    vec3 tNear = min(tMin, tMax);
    vec3 tFar = max(tMin, tMax);

    return vec2(
      max(0.0, max(tNear.x, max(tNear.y, tNear.z))),
      min(1.0, min(tFar.x, min(tFar.y, tFar.z)))
    );
  }

  vec3 frameSampleAlbedo(vec3 localPosition, float lod) {
    vec3 albedo = frameBaseColor;

    if (frameUseBaseColorMap) {
      albedo *= textureLod(frameBaseColorMap, frameWrapUv(localPosition + 0.5 + frameOffset3D), lod).rgb;
    }

    return albedo;
  }

  // NOTE Blackbody color, temperature in Kelvin. Source - https://www.shadertoy.com/view/4tdGWM
  vec3 frameBlackBody(float temperature) {
    if (temperature <= 0.0) {
      return vec3(0.0);
    }

    vec3 radiation = vec3(
      1.0 / (exp(19E3 * 1.0 / temperature) - 1.0),
      3.375 / (exp(19E3 * 1.5 / temperature) - 1.0),
      8.0 / (exp(19E3 * 2.0 / temperature) - 1.0)
    );

    float peak = max(radiation.r, max(radiation.g, radiation.b));

    return peak > 0.0 ? radiation / peak : vec3(0.0);
  }

  vec3 frameSampleEmission(vec3 localPosition, float lod) {
    if (!frameUseEmissiveMap) {
      return vec3(0.0);
    }

    float value = textureLod(frameEmissiveMap, frameWrapUv(localPosition + 0.5 + frameOffset3D), lod).r;
    float temperature = mix(frameTemperatureRange.x, frameTemperatureRange.y, value);

    // NOTE Emitted power increases with temperature^4 (Stefan-Boltzmann). Range top gives 1.0.
    float power = pow(temperature / max(frameTemperatureRange.y, 1.0), 4.0);

    return frameBlackBody(temperature) * power * frameEmissiveIntensity;
  }
`;

export const frameMaxShadowCascades = 4;

// NOTE World-space shadow grid cascades. Cascade 0 is the finest, near the camera.
// All cascades are z slices (tiles) in one 2D atlas.
export const gridPars = `
  #define FRAME_MAX_CASCADES ${frameMaxShadowCascades}

  uniform vec3 frameGridMin[FRAME_MAX_CASCADES];
  uniform vec3 frameGridSize[FRAME_MAX_CASCADES];
  uniform vec3 frameGridVoxel[FRAME_MAX_CASCADES];
  uniform int frameGridCount;
  uniform float frameGridResolution;
  uniform float frameGridColumns;
  uniform vec2 frameGridAtlasSize;

  vec3 frameGridUvw(int cascade, vec3 worldPosition) {
    return (worldPosition - frameGridMin[cascade]) / frameGridSize[cascade];
  }

  // NOTE Half a voxel inside the cascade. Then the linear filter does not read the clamped edge.
  bool frameInsideGrid(vec3 gridUvw) {
    float inset = 0.5 / frameGridResolution;

    return all(greaterThanEqual(gridUvw, vec3(inset))) && all(lessThanEqual(gridUvw, vec3(1.0 - inset)));
  }

  // NOTE Finest cascade from the first cascade that contains the position, or -1
  int frameFindCascade(vec3 worldPosition, int firstCascade) {
    for (int i = 0; i < FRAME_MAX_CASCADES; i++) {
      if (i >= frameGridCount) {
        break;
      }

      if (i >= firstCascade && frameInsideGrid(frameGridUvw(i, worldPosition))) {
        return i;
      }
    }

    return -1;
  }

  // NOTE Hardware bilinear filter in the slice, manual linear filter between slices.
  // NOTE The grid is the z slices (tiles) from tileOffset in an atlas with columns tile columns.
  vec4 frameSampleTiles(sampler2D atlas, float tileOffset, float columns, vec2 atlasSize, vec3 gridUvw) {
    float resolution = frameGridResolution;
    float z = gridUvw.z * resolution - 0.5;
    float z0 = clamp(floor(z), 0.0, resolution - 1.0);
    float z1 = min(z0 + 1.0, resolution - 1.0);
    float blend = clamp(z - z0, 0.0, 1.0);
    vec2 xy = clamp(gridUvw.xy * resolution, vec2(0.5), vec2(resolution - 0.5));

    float tile0Index = tileOffset + z0;
    float tile1Index = tileOffset + z1;
    vec2 tile0 = vec2(mod(tile0Index, columns), floor(tile0Index / columns));
    vec2 tile1 = vec2(mod(tile1Index, columns), floor(tile1Index / columns));

    vec4 sample0 = texture(atlas, (tile0 * resolution + xy) / atlasSize);
    vec4 sample1 = texture(atlas, (tile1 * resolution + xy) / atlasSize);

    return mix(sample0, sample1, blend);
  }

  vec4 frameSampleGrid(sampler2D atlas, int cascade, vec3 gridUvw) {
    return frameSampleTiles(atlas, float(cascade) * frameGridResolution, frameGridColumns, frameGridAtlasSize, gridUvw);
  }

  // NOTE Transmittance of the shadow slots at a world position. 1.0 outside the grid.
  void frameSampleShadows(
    sampler2D map0,
    sampler2D map1,
    sampler2D map2,
    sampler2D map3,
    vec3 worldPosition,
    out vec4 shadow0,
    out vec4 shadow1,
    out vec4 shadow2,
    out vec4 shadow3
  ) {
    shadow0 = vec4(1.0);
    shadow1 = vec4(1.0);
    shadow2 = vec4(1.0);
    shadow3 = vec4(1.0);

    int cascade = frameFindCascade(worldPosition, 0);

    if (cascade < 0) {
      return;
    }

    vec3 gridUvw = frameGridUvw(cascade, worldPosition);

    shadow0 = frameSampleGrid(map0, cascade, gridUvw);
    shadow1 = frameSampleGrid(map1, cascade, gridUvw);
    shadow2 = frameSampleGrid(map2, cascade, gridUvw);
    shadow3 = frameSampleGrid(map3, cascade, gridUvw);

    // NOTE Blend to the next cascade near the sides of this cascade. Then cascade borders are not visible.
    vec3 sideDistance = min(gridUvw, 1.0 - gridUvw);
    float blend = 1.0 - smoothstep(0.0, 0.1, min(sideDistance.x, min(sideDistance.y, sideDistance.z)));
    int nextCascade = blend > 0.0 ? frameFindCascade(worldPosition, cascade + 1) : -1;

    if (nextCascade >= 0) {
      vec3 nextUvw = frameGridUvw(nextCascade, worldPosition);

      shadow0 = mix(shadow0, frameSampleGrid(map0, nextCascade, nextUvw), blend);
      shadow1 = mix(shadow1, frameSampleGrid(map1, nextCascade, nextUvw), blend);
      shadow2 = mix(shadow2, frameSampleGrid(map2, nextCascade, nextUvw), blend);
      shadow3 = mix(shadow3, frameSampleGrid(map3, nextCascade, nextUvw), blend);
    }
  }

  // NOTE Cascade and grid position of an atlas pixel
  int frameGetGridCell(vec2 fragCoord, out vec3 gridUvw) {
    float resolution = frameGridResolution;
    vec2 tile = floor(fragCoord / resolution);
    float tileIndex = tile.y * frameGridColumns + tile.x;
    float cascade = floor(tileIndex / resolution);
    float z = tileIndex - cascade * resolution;

    gridUvw = vec3(fragCoord - tile * resolution, z + 0.5) / resolution;

    return int(cascade);
  }
`;

// NOTE Environment lights (frameRenderer.settings.environmentLighting). World directions to the light.
// NOTE Colors are isotropic irradiance, no phase. Count is 0 with the 'outward' environment.
// NOTE Unshadowed is the sum of the environment grid light colors, clamped to 0 or more. Used outside the environment grid.
export const environmentPars = `
  #define FRAME_MAX_ENVIRONMENT_LIGHTS ${frameMaxEnvironmentLights}

  uniform int frameEnvironmentCount;
  uniform vec3 frameEnvironmentDirections[FRAME_MAX_ENVIRONMENT_LIGHTS];
  uniform vec3 frameEnvironmentColors[FRAME_MAX_ENVIRONMENT_LIGHTS];
  uniform vec3 frameEnvironmentUnshadowed;
`;

export const createEnvironmentUniforms = () => ({
  frameEnvironmentCount: { value: 0 },
  frameEnvironmentDirections: {
    value: Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3(0.0, 1.0, 0.0)),
  },
  frameEnvironmentColors: {
    value: Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3()),
  },
  frameEnvironmentUnshadowed: { value: new Three.Vector3() },
});

// NOTE Environment grid: environment light of each voxel of the last shadow grid cascade, in its own atlas.
// NOTE Needs gridPars before it.
export const environmentGridPars = `
  uniform int frameEnvironmentGridCascade;
  uniform float frameEnvironmentGridColumns;
  uniform vec2 frameEnvironmentGridAtlasSize;

  // NOTE outside is the value outside the environment grid
  vec4 frameSampleEnvironmentGrid(sampler2D map, vec3 worldPosition, vec4 outside) {
    vec3 gridUvw = frameGridUvw(frameEnvironmentGridCascade, worldPosition);

    if (!frameInsideGrid(gridUvw)) {
      return outside;
    }

    return frameSampleTiles(map, 0.0, frameEnvironmentGridColumns, frameEnvironmentGridAtlasSize, gridUvw);
  }
`;

export const createEnvironmentGridUniforms = () => ({
  frameEnvironmentGridCascade: { value: 0 },
  frameEnvironmentGridColumns: { value: 1.0 },
  frameEnvironmentGridAtlasSize: { value: new Three.Vector2(1.0, 1.0) },
});

// NOTE Instanced quad for density passes. One instance for each tile (slice), the quad covers the volume rectangle.
export const tileQuadVertexShader = `
  uniform vec4 frameRect;
  uniform float frameSliceStart;
  uniform vec2 frameTileSize;
  uniform float frameTileColumns;
  uniform vec2 frameTargetSize;

  void main() {
    float slice = frameSliceStart + float(gl_InstanceID);
    vec2 tile = vec2(mod(slice, frameTileColumns), floor(slice / frameTileColumns));
    vec2 cell = mix(frameRect.xy, frameRect.zw, position.xy * 0.5 + 0.5);

    gl_Position = vec4((tile * frameTileSize + cell) / frameTargetSize * 2.0 - 1.0, 0.0, 1.0);
  }
`;

export const createVolumeUniforms = () => ({
  frameViewToLocal: { value: new Three.Matrix4() },
  frameLocalToView: { value: new Three.Matrix4() },
  frameWorldToLocal: { value: new Three.Matrix4() },
  frameWorldScale: { value: 1.0 },
  frameDensityMap: { value: null },
  frameEmissiveMap: { value: null },
  frameBaseColorMap: { value: null },
  frameMaskMap: { value: null },
  frameUseEmissiveMap: { value: false },
  frameUseBaseColorMap: { value: false },
  frameUseMaskMap: { value: false },
  frameBaseColor: { value: new Three.Color(0xffffff) },
  frameScatterColor: { value: new Three.Color(0x000000) },
  frameExtinction: { value: 100.0 },
  frameExtinctionSpectrum: { value: new Three.Vector3(1.0, 1.0, 1.0) },
  frameDensityScale: { value: 1.0 },
  frameDensityCutoff: { value: 0.0 },
  frameAbsorbance: { value: 1.0 },
  frameOpacity: { value: 1.0 },
  frameEmissiveIntensity: { value: 1.0 },
  frameTemperatureRange: { value: new Three.Vector2(0.0, 6500.0) },
  frameOffset3D: { value: new Three.Vector3() },
  frameWrap3D: { value: Three.ClampToEdgeWrapping },
  framePhase: { value: new Three.Vector4() },
  frameMieMap: { value: frameMieTexture },
});

export const setVolumeUniforms = (uniforms, frameVolume, volume) => {
  uniforms.frameViewToLocal.value.copy(volume.viewToLocal);
  uniforms.frameLocalToView.value.copy(volume.localToView);
  uniforms.frameWorldToLocal.value.copy(volume.worldToLocal);
  uniforms.frameWorldScale.value = volume.matrixWorld.getMaxScaleOnAxis();
  uniforms.frameDensityMap.value = volume.densityMap3D;
  uniforms.frameEmissiveMap.value = volume.emissiveMap3D;
  uniforms.frameBaseColorMap.value = volume.baseColorMap3D;
  uniforms.frameMaskMap.value = volume.maskMap3D;
  uniforms.frameUseEmissiveMap.value = !!volume.emissiveMap3D;
  uniforms.frameUseBaseColorMap.value = !!volume.baseColorMap3D;
  uniforms.frameUseMaskMap.value = !!volume.maskMap3D;
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
  uniforms.frameOffset3D.value.copy(frameVolume.offset3D);
  uniforms.frameWrap3D.value = frameVolume.wrap3D;
  getFramePhase(frameVolume, uniforms.framePhase.value);
};

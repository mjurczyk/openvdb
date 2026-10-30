import * as Three from 'three';
import {
  If,
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
} from 'three/tsl';

// NOTE Shaders use the bottom-left pixel origin of GLSL (gl_FragCoord).
// NOTE three.js nodes use the top-left origin of WebGPU. These helpers convert between them.

const minComponent = (value) => min(value.x, min(value.y, value.z));
const maxComponent = (value) => max(value.x, max(value.y, value.z));

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

// NOTE Per-pixel noise that changes each frame. Jitter turns banding into noise, temporal accumulation removes the noise.
// Interleaved gradient noise - https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
// NOTE Returns 0.5 when jitter is off (frameJitter is negative).
export const frameNoise = (jitter, pixel) => {
  const noise = fract(float(52.9829189).mul(fract(dot(pixel, vec2(0.06711056, 0.00583715)))));

  return select(jitter.lessThan(0.0), float(0.5), fract(noise.add(jitter)));
};

export const frameMaxLights = 16;
export const frameMaxHemisphereLights = 4;

// NOTE Scene lights in world space. Lights are in shadow slot order: directional, point, spot.
// NOTE Position w: 1.0 directional (xyz is the direction to the light), 2.0 point, 3.0 spot.
// NOTE Color rgb is color * intensity, color w is the spot penumbra cosine.
// NOTE Spot xyz is the direction from the target to the light, spot w is the cone cosine.
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
  frameDensityScale: uniform(1.0),
  frameDensityCutoff: uniform(0.0),
  frameAbsorbance: uniform(1.0),
  frameOpacity: uniform(1.0),
  frameEmissiveIntensity: uniform(1.0),
  frameTemperatureRange: uniform(new Three.Vector2(0.0, 6500.0)),
  frameOffset3D: uniform(new Three.Vector3()),
  frameWrap3D: uniform(Three.ClampToEdgeWrapping, 'int'),
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
  uniforms.frameDensityScale.value = frameVolume.densityScale;
  uniforms.frameDensityCutoff.value = frameVolume.densityCutoff;
  uniforms.frameAbsorbance.value = frameVolume.absorbance;
  uniforms.frameOpacity.value = frameVolume.opacity;
  uniforms.frameEmissiveIntensity.value = frameVolume.emissiveIntensity;
  uniforms.frameTemperatureRange.value.copy(frameVolume.temperatureRange);
  uniforms.frameOffset3D.value.copy(frameVolume.offset3D);
  uniforms.frameWrap3D.value = frameVolume.wrap3D;

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
  const sampleOptional = (useMap, map, mipMap, levels, uvw, lod, fallback) =>
    select(useMap.equal(1), sample3D(map, mipMap, levels, uvw, lod), vec4(fallback));

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

    return select(
      volume.frameUseEmissiveMap.equal(1),
      blackBody(temperature).mul(power).mul(volume.frameEmissiveIntensity),
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

  // NOTE Hardware bilinear filter in the slice, manual linear filter between slices
  const sampleGrid = (atlas, cascade, uvw) => {
    const resolution = frameGridResolution;
    const z = uvw.z.mul(resolution).sub(0.5);
    const z0 = clamp(floor(z), 0.0, resolution.sub(1.0));
    const z1 = min(z0.add(1.0), resolution.sub(1.0));
    const blend = clamp(z.sub(z0), 0.0, 1.0);
    const xy = clamp(uvw.xy.mul(resolution), vec2(0.5), vec2(resolution.sub(0.5)));

    const tileOffset = float(cascade).mul(resolution);
    const tileUv = (index) => {
      const tile = vec2(mod(index, frameGridColumns), floor(index.div(frameGridColumns)));

      return tile.mul(resolution).add(xy).div(grid.frameGridAtlasSize);
    };

    return mix(
      frameSample(atlas, tileUv(tileOffset.add(z0))),
      frameSample(atlas, tileUv(tileOffset.add(z1))),
      blend,
    );
  };

  // NOTE Transmittance of the shadow slots at a world position. 1.0 outside the grid.
  // Call in a Fn body. Returns two vec4 variables.
  const sampleShadows = (map0, map1, worldPosition) => {
    const shadow0 = vec4(1.0).toVar();
    const shadow1 = vec4(1.0).toVar();
    const cascade = findCascade(worldPosition, int(0)).toVar();

    If(cascade.greaterThanEqual(0), () => {
      const uvw = gridUvw(cascade, worldPosition).toVar();

      shadow0.assign(sampleGrid(map0, cascade, uvw));
      shadow1.assign(sampleGrid(map1, cascade, uvw));

      // NOTE Blend to the next cascade near the sides of this cascade. Then cascade borders are not visible.
      const sideDistance = min(uvw, vec3(1.0).sub(uvw));
      const blend = float(1.0).sub(smoothstep(0.0, 0.1, minComponent(sideDistance))).toVar();

      If(blend.greaterThan(0.0), () => {
        const nextCascade = findCascade(worldPosition, cascade.add(1)).toVar();

        If(nextCascade.greaterThanEqual(0), () => {
          const nextUvw = gridUvw(nextCascade, worldPosition).toVar();

          shadow0.assign(mix(shadow0, sampleGrid(map0, nextCascade, nextUvw), blend));
          shadow1.assign(mix(shadow1, sampleGrid(map1, nextCascade, nextUvw), blend));
        });
      });
    });

    return { shadow0, shadow1 };
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

  return { gridUvw, insideGrid, findCascade, sampleGrid, sampleShadows, getGridCell };
};

// NOTE Instanced quad for density passes. One instance for each tile (slice), the quad covers the volume rectangle.
export const createTileUniforms = () => ({
  frameTileSize: uniform(new Three.Vector2(1.0, 1.0)),
  frameTileColumns: uniform(1.0),
  frameTargetSize: uniform(new Three.Vector2(1.0, 1.0)),
});

export const frameTileVertex = (tileUniforms, rect, sliceStart) => {
  const { frameTileSize, frameTileColumns, frameTargetSize } = tileUniforms;
  const slice = sliceStart.add(float(instanceIndex));
  const tile = vec2(mod(slice, frameTileColumns), floor(slice.div(frameTileColumns)));
  const cell = mix(rect.xy, rect.zw, positionGeometry.xy.mul(0.5).add(0.5));

  return vec4(tile.mul(frameTileSize).add(cell).div(frameTargetSize).mul(2.0).sub(1.0), 0.0, 1.0);
};

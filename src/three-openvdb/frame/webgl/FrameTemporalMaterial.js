import * as Three from 'three';
import { froxelPars, tileQuadVertexShader } from './frameShaderChunks.js';

const fragmentShader = `
  precision highp float;

  layout(location = 0) out highp vec4 frameResolved;

  // NOTE Spectral: second atlas target (red alpha, blue alpha, 0, green alpha)
  #ifdef FRAME_SPECTRAL
    layout(location = 1) out highp vec4 frameResolvedAlpha;

    uniform sampler2D frameCurrentAlphaMap;
    uniform sampler2D frameHistoryAlphaMap;
  #endif

  ${froxelPars}

  uniform sampler2D frameCurrentMap;
  uniform sampler2D frameHistoryMap;
  uniform vec2 frameAtlasSize;
  uniform bool frameUseHistory;
  uniform float frameTemporalBlend;
  uniform mat4 frameCameraMatrixWorld;
  uniform mat4 framePreviousViewMatrix;
  uniform mat4 framePreviousProjectionMatrix;
  uniform vec2 framePreviousRange;

  vec2 frameGetTileOrigin(float slice) {
    return vec2(mod(slice, froxelColumns), floor(slice / froxelColumns)) * froxelGrid.xy;
  }

  // NOTE Bilinear filter in the slice. Half a cell inside the tile, then the filter does not read other tiles.
  vec4 frameSampleHistory(sampler2D historyMap, float slice, vec2 uv) {
    vec2 cell = clamp(uv * froxelGrid.xy, vec2(0.5), froxelGrid.xy - 0.5);

    return texture(historyMap, (frameGetTileOrigin(slice) + cell) / frameAtlasSize);
  }

  // NOTE History of one atlas target, clamped to the current neighbors. This limits ghosting of moving volumes.
  vec4 frameResolve(
    sampler2D currentMap,
    sampler2D historyMap,
    vec2 tile,
    vec2 cell,
    float slice,
    float slice0,
    float slice1,
    float sliceBlend,
    vec2 previousUv
  ) {
    vec4 current = texelFetch(currentMap, ivec2(gl_FragCoord.xy), 0);
    vec4 history = mix(
      frameSampleHistory(historyMap, slice0, previousUv),
      frameSampleHistory(historyMap, slice1, previousUv),
      sliceBlend
    );

    vec4 neighborMin = current;
    vec4 neighborMax = current;
    vec2 tileOrigin = tile * froxelGrid.xy;
    vec2 cellMax = froxelGrid.xy - 1.0;

    vec2 neighborCells[4];
    neighborCells[0] = vec2(max(cell.x - 1.0, 0.5), cell.y);
    neighborCells[1] = vec2(min(cell.x + 1.0, cellMax.x + 0.5), cell.y);
    neighborCells[2] = vec2(cell.x, max(cell.y - 1.0, 0.5));
    neighborCells[3] = vec2(cell.x, min(cell.y + 1.0, cellMax.y + 0.5));

    for (int i = 0; i < 4; i++) {
      vec4 neighbor = texelFetch(currentMap, ivec2(tileOrigin + neighborCells[i]), 0);

      neighborMin = min(neighborMin, neighbor);
      neighborMax = max(neighborMax, neighbor);
    }

    for (int i = -1; i <= 1; i += 2) {
      float neighborSlice = slice + float(i);

      if (neighborSlice >= 0.0 && neighborSlice < froxelGrid.z) {
        vec4 neighbor = texelFetch(currentMap, ivec2(frameGetTileOrigin(neighborSlice) + cell), 0);

        neighborMin = min(neighborMin, neighbor);
        neighborMax = max(neighborMax, neighbor);
      }
    }

    return mix(clamp(history, neighborMin, neighborMax), current, frameTemporalBlend);
  }

  // NOTE The current froxels of all targets, with no history
  void frameWriteCurrent() {
    frameResolved = texelFetch(frameCurrentMap, ivec2(gl_FragCoord.xy), 0);

    #ifdef FRAME_SPECTRAL
      frameResolvedAlpha = texelFetch(frameCurrentAlphaMap, ivec2(gl_FragCoord.xy), 0);
    #endif
  }

  void main() {
    vec2 tile = floor(gl_FragCoord.xy / froxelGrid.xy);
    float slice = tile.y * froxelColumns + tile.x;

    if (!frameUseHistory || slice >= froxelGrid.z) {
      frameWriteCurrent();

      return;
    }

    // NOTE Reproject the froxel center into the froxel grid of the previous frame
    vec2 cell = gl_FragCoord.xy - tile * froxelGrid.xy;
    vec2 uv = cell / froxelGrid.xy;
    float viewDepth = frameSliceDepth((slice + 0.5) / froxelGrid.z);
    vec4 worldPosition = frameCameraMatrixWorld * vec4(frameGetViewPosition(uv, viewDepth), 1.0);
    vec4 previousView = framePreviousViewMatrix * worldPosition;
    vec4 previousClip = framePreviousProjectionMatrix * previousView;

    if (previousClip.w <= 0.0) {
      frameWriteCurrent();

      return;
    }

    vec2 previousUv = previousClip.xy / previousClip.w * 0.5 + 0.5;
    float previousDepth = -previousView.z;
    float previousT = log(max(previousDepth, 1e-6) / framePreviousRange.x) / log(framePreviousRange.y / framePreviousRange.x);
    float previousSlice = previousT * froxelGrid.z - 0.5;

    bool outside = any(lessThan(previousUv, vec2(0.0))) || any(greaterThan(previousUv, vec2(1.0)));

    if (outside || previousSlice < -0.5 || previousSlice > froxelGrid.z - 0.5) {
      frameWriteCurrent();

      return;
    }

    float slice0 = clamp(floor(previousSlice), 0.0, froxelGrid.z - 1.0);
    float slice1 = min(slice0 + 1.0, froxelGrid.z - 1.0);
    float sliceBlend = clamp(previousSlice - slice0, 0.0, 1.0);

    frameResolved = frameResolve(frameCurrentMap, frameHistoryMap, tile, cell, slice, slice0, slice1, sliceBlend, previousUv);

    #ifdef FRAME_SPECTRAL
      frameResolvedAlpha = frameResolve(
        frameCurrentAlphaMap,
        frameHistoryAlphaMap,
        tile,
        cell,
        slice,
        slice0,
        slice1,
        sliceBlend,
        previousUv
      );
    #endif
  }
`;

// NOTE Blends the froxels of this frame with the reprojected froxels of the previous frames
export class FrameTemporalMaterial extends Three.ShaderMaterial {
  name = 'FrameTemporalMaterial';

  constructor(froxelUniforms) {
    super({
      glslVersion: Three.GLSL3,
      uniforms: {
        ...froxelUniforms,
        frameCurrentMap: { value: null },
        frameHistoryMap: { value: null },
        frameCurrentAlphaMap: { value: null },
        frameHistoryAlphaMap: { value: null },
        frameAtlasSize: { value: new Three.Vector2(1.0, 1.0) },
        frameUseHistory: { value: false },
        frameTemporalBlend: { value: 0.1 },
        frameCameraMatrixWorld: { value: new Three.Matrix4() },
        framePreviousViewMatrix: { value: new Three.Matrix4() },
        framePreviousProjectionMatrix: { value: new Three.Matrix4() },
        framePreviousRange: { value: new Three.Vector2(0.1, 1.0) },
      },
      // NOTE Only the froxel area of the volumes (frameRect, frameSliceStart). The renderer clears the target first.
      vertexShader: tileQuadVertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      blending: Three.NoBlending,
    });

    // NOTE frameRenderer.settings.spectral: two atlas targets
    this.spectral = false;
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.defines = spectral ? { FRAME_SPECTRAL: '' } : {};
      this.needsUpdate = true;
    }
  }
}

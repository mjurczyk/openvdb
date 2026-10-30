import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  ivec2,
  vec2,
  vec4,
  uniform,
  texture,
  mix,
  log,
  clamp,
  floor,
  min,
  max,
  mod,
} from 'three/tsl';
import {
  frameFragCoord,
  frameLoad,
  frameSample,
  frameSliceDepth,
  frameGetViewPosition,
  frameFullscreenVertex,
} from './frameShaderChunks';

// NOTE Blends the froxels of this frame with the reprojected froxels of the previous frames
export class FrameTemporalMaterial extends Three.NodeMaterial {
  constructor({ froxelUniforms }) {
    super();

    this.name = 'FrameTemporalMaterial';
    this.frameCurrentMap = texture(new Three.Texture());
    this.frameHistoryMap = texture(new Three.Texture());
    this.frameUseHistory = uniform(0, 'int');
    this.frameTemporalBlend = uniform(0.1);
    this.frameCameraMatrixWorld = uniform(new Three.Matrix4());
    this.framePreviousViewMatrix = uniform(new Three.Matrix4());
    this.framePreviousProjectionMatrix = uniform(new Three.Matrix4());
    this.framePreviousRange = uniform(new Three.Vector2(0.1, 1.0));

    const { froxelGrid, froxelColumns, froxelAtlasSize } = froxelUniforms;

    const getTileOrigin = (slice) =>
      vec2(mod(slice, froxelColumns), floor(slice.div(froxelColumns))).mul(froxelGrid.xy);

    // NOTE Bilinear filter in the slice. Half a cell inside the tile, then the filter does not read other tiles.
    const sampleHistory = (slice, uv) => {
      const cell = clamp(uv.mul(froxelGrid.xy), vec2(0.5), froxelGrid.xy.sub(0.5));

      return frameSample(this.frameHistoryMap, getTileOrigin(slice).add(cell).div(froxelAtlasSize));
    };

    const loadCurrent = (texel) => frameLoad(this.frameCurrentMap, ivec2(texel), froxelAtlasSize);

    this.vertexNode = frameFullscreenVertex;

    this.fragmentNode = Fn(() => {
      const fragCoord = frameFragCoord(froxelAtlasSize).toVar();
      const current = loadCurrent(fragCoord).toVar();
      const resolved = vec4(current).toVar();

      const tile = floor(fragCoord.div(froxelGrid.xy)).toVar();
      const slice = tile.y.mul(froxelColumns).add(tile.x).toVar();

      If(this.frameUseHistory.equal(1).and(slice.lessThan(froxelGrid.z)), () => {
        // NOTE Reproject the froxel center into the froxel grid of the previous frame
        const cell = fragCoord.sub(tile.mul(froxelGrid.xy)).toVar();
        const uv = cell.div(froxelGrid.xy);
        const viewDepth = frameSliceDepth(froxelUniforms, slice.add(0.5).div(froxelGrid.z));
        const worldPosition = this.frameCameraMatrixWorld.mul(
          vec4(frameGetViewPosition(froxelUniforms, uv, viewDepth), 1.0),
        );
        const previousView = this.framePreviousViewMatrix.mul(worldPosition).toVar();
        const previousClip = this.framePreviousProjectionMatrix.mul(previousView).toVar();

        If(previousClip.w.greaterThan(0.0), () => {
          const previousUv = previousClip.xy.div(previousClip.w).mul(0.5).add(0.5).toVar();
          const previousRange = this.framePreviousRange;
          const previousT = log(max(previousView.z.negate(), 1e-6).div(previousRange.x)).div(
            log(previousRange.y.div(previousRange.x)),
          );
          const previousSlice = previousT.mul(froxelGrid.z).sub(0.5).toVar();

          const inside = min(previousUv.x, previousUv.y)
            .greaterThanEqual(0.0)
            .and(max(previousUv.x, previousUv.y).lessThanEqual(1.0))
            .and(previousSlice.greaterThanEqual(-0.5))
            .and(previousSlice.lessThanEqual(froxelGrid.z.sub(0.5)));

          If(inside, () => {
            const slice0 = clamp(floor(previousSlice), 0.0, froxelGrid.z.sub(1.0)).toVar();
            const slice1 = min(slice0.add(1.0), froxelGrid.z.sub(1.0));
            const history = mix(
              sampleHistory(slice0, previousUv),
              sampleHistory(slice1, previousUv),
              clamp(previousSlice.sub(slice0), 0.0, 1.0),
            );

            // NOTE Clamp the history to the current neighbors. This limits ghosting of moving volumes.
            const tileOrigin = tile.mul(froxelGrid.xy);
            const cellMax = froxelGrid.xy.sub(1.0);
            const neighborMin = vec4(current).toVar();
            const neighborMax = vec4(current).toVar();

            const addNeighbor = (texel) => {
              const neighbor = loadCurrent(texel).toVar();

              neighborMin.assign(min(neighborMin, neighbor));
              neighborMax.assign(max(neighborMax, neighbor));
            };

            [
              vec2(max(cell.x.sub(1.0), 0.5), cell.y),
              vec2(min(cell.x.add(1.0), cellMax.x.add(0.5)), cell.y),
              vec2(cell.x, max(cell.y.sub(1.0), 0.5)),
              vec2(cell.x, min(cell.y.add(1.0), cellMax.y.add(0.5))),
            ].forEach((neighborCell) => addNeighbor(tileOrigin.add(neighborCell)));

            [-1.0, 1.0].forEach((offset) => {
              const neighborSlice = slice.add(offset);

              If(neighborSlice.greaterThanEqual(0.0).and(neighborSlice.lessThan(froxelGrid.z)), () => {
                addNeighbor(getTileOrigin(neighborSlice).add(cell));
              });
            });

            resolved.assign(
              mix(clamp(history, neighborMin, neighborMax), current, this.frameTemporalBlend),
            );
          });
        });
      });

      return resolved;
    })();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }
}

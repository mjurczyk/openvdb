import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  float,
  int,
  vec3,
  vec4,
  uniform,
  texture,
  property,
  outputStruct,
  select,
  abs,
  exp,
  min,
  max,
  length,
  normalize,
} from 'three/tsl';
import { frameFragCoord, frameNoise, frameFullscreenVertex, createGridNodes } from './frameShaderChunks.js';

// NOTE Light slots: sky up, sky down, then 6 lights. Two render targets with 4 channels each.
export const frameShadowLightSlots = 6;

const maxShadowSteps = 1024;

// NOTE Transmittance from each grid voxel to each light, through the combined extinction of all volumes
export class FrameTransmittanceMaterial extends Three.NodeMaterial {
  constructor({ gridUniforms, lightUniforms }) {
    super();

    this.name = 'FrameTransmittanceMaterial';
    this.frameShadowDensityMap = texture(new Three.Texture());
    this.frameShadowLightCount = uniform(0, 'int');

    const grid = createGridNodes(gridUniforms);
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount, frameGridAtlasSize } =
      gridUniforms;
    const { frameSkyDirection, frameLightPositions } = lightUniforms;

    const transmittance0 = property('vec4');
    const transmittance1 = property('vec4');

    const gridExtinction = (worldPosition) => {
      const found = grid.findCascade(worldPosition, int(0));
      const cascade = max(found, int(0));

      return select(
        found.greaterThanEqual(0),
        grid.sampleGrid(this.frameShadowDensityMap, cascade, grid.gridUvw(cascade, worldPosition)).r,
        float(0.0),
      );
    };

    // NOTE Each step moves one voxel of the finest cascade at the probe, on the fastest axis of the direction.
    // The march goes to coarser cascades when it leaves a fine cascade.
    const march = (origin, direction, maxDistance, jitter) => {
      const opticalDepth = float(0.0).toVar();
      const traveled = float(0.0).toVar();
      const probe = vec3(origin).toVar();

      Loop(maxShadowSteps, () => {
        const cascade = grid.findCascade(probe, int(0)).toVar();

        If(
          cascade.lessThan(0).or(traveled.greaterThanEqual(maxDistance)).or(opticalDepth.greaterThan(6.0)),
          () => {
            Break();
          },
        );

        const voxelsPerUnit = abs(direction).div(frameGridVoxel.element(cascade));
        const stepLength = min(
          float(1.0).div(max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z))),
          maxDistance.sub(traveled),
        ).toVar();

        opticalDepth.addAssign(
          gridExtinction(probe.add(direction.mul(stepLength).mul(jitter))).mul(stepLength),
        );
        probe.addAssign(direction.mul(stepLength));
        traveled.addAssign(stepLength);
      });

      return exp(opticalDepth.negate());
    };

    // NOTE Light w is 1.0 for a light direction, 2.0 or more for a light position
    const lightTransmittance = (slot, worldPosition, jitter) => {
      const result = float(1.0).toVar();

      If(int(slot).lessThan(this.frameShadowLightCount), () => {
        const light = frameLightPositions.element(slot).toVar();
        const isDirection = light.w.lessThan(1.5);
        const toLight = light.xyz.sub(worldPosition).toVar();

        result.assign(
          march(
            worldPosition,
            select(isDirection, normalize(light.xyz), normalize(toLight)),
            select(isDirection, float(1e20), length(toLight)),
            jitter,
          ),
        );
      });

      return result;
    };

    this.vertexNode = frameFullscreenVertex;

    this.colorNode = Fn(() => {
      const fragCoord = frameFragCoord(frameGridAtlasSize).toVar();
      const cell = grid.getGridCell(fragCoord);
      const cascade = cell.cascade.toVar();

      transmittance0.assign(vec4(1.0));
      transmittance1.assign(vec4(1.0));

      If(cascade.lessThan(frameGridCount), () => {
        const voxel = frameGridVoxel.element(cascade).toVar();
        const worldPosition = frameGridMin
          .element(cascade)
          .add(cell.gridUvw.mul(frameGridSize.element(cascade)))
          .toVar();

        // NOTE Skip voxels with no extinction near them. The lighting pass does not read them.
        let nearExtinction = float(0.0);

        for (let i = 0; i < 8; i++) {
          const corner = vec3(i & 1, (i >> 1) & 1, (i >> 2) & 1).sub(0.5);

          nearExtinction = nearExtinction.add(gridExtinction(worldPosition.add(corner.mul(voxel))));
        }

        If(nearExtinction.greaterThan(0.0), () => {
          const jitter = frameNoise(gridUniforms.frameJitter, fragCoord).toVar();
          const skyDirection = normalize(frameSkyDirection).toVar();

          transmittance0.assign(
            vec4(
              march(worldPosition, skyDirection, float(1e20), jitter),
              march(worldPosition, skyDirection.negate(), float(1e20), jitter),
              lightTransmittance(0, worldPosition, jitter),
              lightTransmittance(1, worldPosition, jitter),
            ),
          );

          transmittance1.assign(
            vec4(
              lightTransmittance(2, worldPosition, jitter),
              lightTransmittance(3, worldPosition, jitter),
              lightTransmittance(4, worldPosition, jitter),
              lightTransmittance(5, worldPosition, jitter),
            ),
          );
        });
      });

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(transmittance0, transmittance1);

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }
}

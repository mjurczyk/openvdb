import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  float,
  vec3,
  vec4,
  uniform,
  uniformArray,
  texture,
  floor,
  abs,
  exp,
  max,
} from 'three/tsl';
import { frameFragCoord, frameFullscreenVertex, createGridNodes } from './frameShaderChunks.js';
import { frameMaxEnvironmentLights } from '../core/frameEnvironment.js';

const maxSteps = 1024;

// NOTE Environment light of each voxel of the last shadow grid cascade, from the environment lights with no shadow slot.
// NOTE Sum of color * transmittance. The march stays in the last cascade, with one voxel steps.
// NOTE The last cascade fits all casters and does not follow the camera.
// NOTE The renderer draws this pass only when the casters or the environment lights change.
export class FrameEnvironmentGridMaterial extends Three.NodeMaterial {
  constructor({ gridUniforms, environmentGridUniforms, lightUniforms }) {
    super();

    this.name = 'FrameEnvironmentGridMaterial';
    this.frameShadowDensityMap = texture(new Three.Texture());
    this.frameLightCount = uniform(0, 'int');
    this.frameLightDirections = uniformArray(
      Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3(0.0, 1.0, 0.0)),
      'vec3',
    );
    this.frameLightColors = uniformArray(
      Array.from({ length: frameMaxEnvironmentLights }, () => new Three.Vector3()),
      'vec3',
    );

    const grid = createGridNodes(gridUniforms);
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridResolution } = gridUniforms;
    const { frameEnvironmentGridCascade, frameEnvironmentGridColumns, frameEnvironmentGridAtlasSize } =
      environmentGridUniforms;
    const { frameEnvironmentUnshadowed } = lightUniforms;

    this.vertexNode = frameFullscreenVertex;

    this.colorNode = Fn(() => {
      const cascade = frameEnvironmentGridCascade;
      const resolution = frameGridResolution;
      const fragCoord = frameFragCoord(frameEnvironmentGridAtlasSize).toVar();
      const tile = floor(fragCoord.div(resolution)).toVar();
      const z = tile.y.mul(frameEnvironmentGridColumns).add(tile.x);
      const gridUvw = vec3(fragCoord.sub(tile.mul(resolution)), z.add(0.5)).div(resolution);
      const voxel = frameGridVoxel.element(cascade).toVar();
      const gridMin = frameGridMin.element(cascade).toVar();
      const gridSize = frameGridSize.element(cascade).toVar();
      const worldPosition = gridMin.add(gridUvw.mul(gridSize)).toVar();
      const result = vec4(frameEnvironmentUnshadowed, 1.0).toVar();

      const extinctionAt = (position) =>
        grid.sampleGrid(this.frameShadowDensityMap, cascade, position.sub(gridMin).div(gridSize)).r;

      // NOTE Skip voxels with no extinction near them. The density pass does not read them.
      let nearExtinction = float(0.0);

      for (let i = 0; i < 8; i++) {
        const corner = vec3(i & 1, (i >> 1) & 1, (i >> 2) & 1).sub(0.5);

        nearExtinction = nearExtinction.add(extinctionAt(worldPosition.add(corner.mul(voxel))));
      }

      If(z.lessThan(resolution).and(nearExtinction.greaterThan(0.0)), () => {
        const irradiance = vec3(0.0).toVar();

        Loop(this.frameLightCount, ({ i }) => {
          const direction = this.frameLightDirections.element(i).toVar();
          const voxelsPerUnit = abs(direction).div(voxel);
          const stepLength = float(1.0)
            .div(max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z)))
            .toVar();
          const step = direction.mul(stepLength).toVar();
          const probe = worldPosition.add(step.mul(0.5)).toVar();
          const opticalDepth = float(0.0).toVar();

          Loop(maxSteps, () => {
            const uvw = probe.sub(gridMin).div(gridSize);

            If(
              uvw.x
                .lessThan(0.0)
                .or(uvw.y.lessThan(0.0))
                .or(uvw.z.lessThan(0.0))
                .or(uvw.x.greaterThan(1.0))
                .or(uvw.y.greaterThan(1.0))
                .or(uvw.z.greaterThan(1.0))
                .or(opticalDepth.greaterThan(6.0)),
              () => {
                Break();
              },
            );

            opticalDepth.addAssign(
              grid.sampleGrid(this.frameShadowDensityMap, cascade, uvw).r.mul(stepLength),
            );
            probe.addAssign(step);
          });

          irradiance.addAssign(this.frameLightColors.element(i).mul(exp(opticalDepth.negate())));
        });

        result.assign(vec4(max(irradiance, vec3(0.0)), 1.0));
      });

      return result;
    })();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }
}

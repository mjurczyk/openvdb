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
  max,
  select,
} from 'three/tsl';
import {
  frameFragCoord,
  frameFullscreenVertex,
  createGridNodes,
  frameShadowStep,
  frameShadowMarchDepth,
  frameShadowTransmittance,
  frameShadowTotal,
  frameIsotropicDiffusion,
} from './frameShaderChunks.js';
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
    // NOTE Multiple scattering of frameRenderer.settings (core/framePhase.js). 0.0 is single scattering.
    this.frameMultipleScattering = uniform(0.0);
    // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
    this.frameScatteringOctaves = uniform(new Three.Vector4());

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
      // NOTE Octaves: unshadowed light also gets the octaves
      const result = vec4(frameEnvironmentUnshadowed.mul(frameShadowTotal(float(1.0), this.frameScatteringOctaves)), 1.0).toVar();

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

        // NOTE (extinction, effective, reduced) depths of the march from worldPosition along direction
        const marchDepths = (direction) => {
          const voxelsPerUnit = abs(direction).div(voxel);
          const stepLength = float(1.0)
            .div(max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z)))
            .toVar();
          const step = direction.mul(stepLength).toVar();
          const probe = worldPosition.add(step.mul(0.5)).toVar();
          const depths = vec3(0.0).toVar();

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
                .or(frameShadowMarchDepth(depths, this.frameMultipleScattering, this.frameScatteringOctaves).greaterThan(6.0)),
              () => {
                Break();
              },
            );

            const sample = grid.sampleGrid(this.frameShadowDensityMap, cascade, uvw).toVar();

            depths.addAssign(
              frameShadowStep(sample.r, sample.g, this.frameMultipleScattering).mul(stepLength),
            );
            probe.addAssign(step);
          });

          return depths;
        };

        Loop(this.frameLightCount, ({ i }) => {
          const direction = this.frameLightDirections.element(i).toVar();
          const depths = marchDepths(direction);

          // NOTE Environment lights are isotropic: total transmittance, no phase
          const shadow = frameShadowTransmittance(depths, this.frameMultipleScattering, this.frameScatteringOctaves);

          // NOTE Diffusion: two-sided total (frameIsotropicDiffusion). It needs the march in the opposite direction too.
          const diffusion = this.frameMultipleScattering.greaterThan(0.0);
          const backDepths = vec3(0.0).toVar();

          If(diffusion, () => {
            backDepths.assign(marchDepths(direction.negate()));
          });

          const total = select(
            diffusion,
            frameIsotropicDiffusion(depths.z, backDepths.z, depths.y),
            frameShadowTotal(shadow.y, this.frameScatteringOctaves),
          );

          irradiance.addAssign(this.frameLightColors.element(i).mul(total));
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

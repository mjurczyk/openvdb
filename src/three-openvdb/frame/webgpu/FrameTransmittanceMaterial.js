import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  float,
  int,
  vec2,
  vec3,
  vec4,
  uniform,
  uniformArray,
  texture,
  property,
  outputStruct,
  select,
  abs,
  min,
  max,
  length,
  normalize,
} from 'three/tsl';
import {
  frameFragCoord,
  frameNoise,
  frameFullscreenVertex,
  createGridNodes,
  frameShadowStep,
  frameShadowMarchDepth,
  frameShadowTransmittance,
} from './frameShaderChunks.js';

// NOTE Light slots: sky up, sky down, then 6 lights. Targets 0 and 1: total transmittance of all slots.
// NOTE Targets 2 and 3: direct transmittance of the 6 lights. Then the lighting gives the phase only to the direct light.
// NOTE Scene lights take the first slots. The dominant directional environment light takes the next free slot.
export const frameShadowLightSlots = 6;

const maxShadowSteps = 1024;

// NOTE Transmittance from each grid voxel to each light, through the combined extinction of all volumes
export class FrameTransmittanceMaterial extends Three.NodeMaterial {
  constructor({ gridUniforms, lightUniforms }) {
    super();

    this.name = 'FrameTransmittanceMaterial';
    this.frameShadowDensityMap = texture(new Three.Texture());
    this.frameShadowLightCount = uniform(0, 'int');
    this.frameShadowLights = uniformArray(
      Array.from({ length: frameShadowLightSlots }, () => new Three.Vector4()),
      'vec4',
    );
    // NOTE Multiple scattering of frameRenderer.settings (core/framePhase.js). 0.0 is single scattering.
    this.frameMultipleScattering = uniform(0.0);
    // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
    this.frameScatteringOctaves = uniform(new Three.Vector4());

    const grid = createGridNodes(gridUniforms);
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount, frameGridAtlasSize } =
      gridUniforms;
    const { frameSkyDirection } = lightUniforms;

    const transmittance0 = property('vec4');
    const transmittance1 = property('vec4');
    const transmittance2 = property('vec4');
    const transmittance3 = property('vec4');

    // NOTE (extinction, absorption)
    const gridExtinction = (worldPosition) => {
      const found = grid.findCascade(worldPosition, int(0));
      const cascade = max(found, int(0));

      return select(
        found.greaterThanEqual(0),
        grid.sampleGrid(this.frameShadowDensityMap, cascade, grid.gridUvw(cascade, worldPosition)).rg,
        vec2(0.0),
      );
    };

    // NOTE Each step moves one voxel of the finest cascade at the probe, on the fastest axis of the direction.
    // The march goes to coarser cascades when it leaves a fine cascade.
    const march = (origin, direction, maxDistance, jitter) => {
      const depths = vec3(0.0).toVar();
      const traveled = float(0.0).toVar();
      const probe = vec3(origin).toVar();

      Loop(maxShadowSteps, () => {
        const cascade = grid.findCascade(probe, int(0)).toVar();

        If(
          cascade.lessThan(0).or(traveled.greaterThanEqual(maxDistance)).or(frameShadowMarchDepth(depths, this.frameMultipleScattering, this.frameScatteringOctaves).greaterThan(6.0)),
          () => {
            Break();
          },
        );

        const voxelsPerUnit = abs(direction).div(frameGridVoxel.element(cascade));
        const stepLength = min(
          float(1.0).div(max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z))),
          maxDistance.sub(traveled),
        ).toVar();

        const sample = gridExtinction(probe.add(direction.mul(stepLength).mul(jitter))).toVar();

        depths.addAssign(
          frameShadowStep(sample.x, sample.y, this.frameMultipleScattering).mul(stepLength),
        );
        probe.addAssign(direction.mul(stepLength));
        traveled.addAssign(stepLength);
      });

      return frameShadowTransmittance(depths, this.frameMultipleScattering, this.frameScatteringOctaves);
    };

    // NOTE Light w is 1.0 for a light direction, 2.0 or more for a light position
    const lightTransmittance = (slot, worldPosition, jitter) => {
      const result = vec2(1.0).toVar();

      If(int(slot).lessThan(this.frameShadowLightCount), () => {
        const light = this.frameShadowLights.element(slot).toVar();
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
      transmittance2.assign(vec4(1.0));
      transmittance3.assign(vec4(1.0));

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

          nearExtinction = nearExtinction.add(gridExtinction(worldPosition.add(corner.mul(voxel))).x);
        }

        If(nearExtinction.greaterThan(0.0), () => {
          const jitter = frameNoise(gridUniforms.frameJitter, fragCoord).toVar();
          const skyDirection = normalize(frameSkyDirection).toVar();

          const lights = Array.from({ length: frameShadowLightSlots }, (_, slot) =>
            lightTransmittance(slot, worldPosition, jitter).toVar(),
          );

          transmittance0.assign(
            vec4(
              march(worldPosition, skyDirection, float(1e20), jitter).y,
              march(worldPosition, skyDirection.negate(), float(1e20), jitter).y,
              lights[0].y,
              lights[1].y,
            ),
          );
          transmittance1.assign(vec4(lights[2].y, lights[3].y, lights[4].y, lights[5].y));
          transmittance2.assign(vec4(lights[0].x, lights[1].x, lights[2].x, lights[3].x));
          transmittance3.assign(vec4(lights[4].x, lights[5].x, 1.0, 1.0));
        });
      });

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(transmittance0, transmittance1, transmittance2, transmittance3);

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }
}

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
  dot,
  bool,
} from 'three/tsl';
import {
  frameFragCoord,
  frameNoise,
  frameFullscreenVertex,
  createGridNodes,
  frameShadowStep,
  frameShadowMarchDepth,
  frameShadowTransmittance,
  minComponent,
  frameSpectralShadowStep,
  frameSpectralShadowTransmittance,
  frameIsotropicDiffusion,
  frameTwoSidedDiffusion,
} from './frameShaderChunks.js';
import { createNeuralNodes } from './frameNeuralChunks.js';
import { frameNeuralLevels } from '../core/frameNeuralIndirect.js';

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
    // NOTE multipleScattering 'two-sided' (core/framePhase.js): light slots also march away from the light
    this.frameTwoSided = uniform(0.0);
    // NOTE frameRenderer.settings.spectral: the absorption target of the grid, and the slot group of this pass
    // (core/frameSpectrum.js). The renderer draws this pass one time for each group in use, into its own targets.
    this.frameShadowAbsorptionMap = texture(new Three.Texture());
    this.frameSpectralGroup = uniform(0, 'int');
    // NOTE multipleScattering 'neural': mips of the last cascade (FrameGridMipMaterial), levels 1 and up
    this.frameNeuralMipMaps = Array.from({ length: frameNeuralLevels - 1 }, () => texture(new Three.Texture()));
    this.frameUniforms = { gridUniforms, lightUniforms };
    this.spectral = false;
    this.neural = false;

    this.buildNodes();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.buildNodes();
      this.needsUpdate = true;
    }
  }

  // NOTE multipleScattering 'neural' (not spectral): scattered light of the light slots from the network
  setNeural(neural) {
    if (neural !== this.neural) {
      this.neural = neural;
      this.buildNodes();
      this.needsUpdate = true;
    }
  }

  buildNodes() {
    if (this.spectral) {
      this.buildSpectralNodes();

      return;
    }

    const { gridUniforms, lightUniforms } = this.frameUniforms;
    const grid = createGridNodes(gridUniforms);
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount, frameGridAtlasSize } =
      gridUniforms;
    const { frameSkyDirection } = lightUniforms;
    const neural = this.neural
      ? createNeuralNodes(gridUniforms, grid, this.frameShadowDensityMap, this.frameNeuralMipMaps)
      : null;

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
    // NOTE opticalDepth (optional float variable) gets the direct optical depth
    const march = (origin, direction, maxDistance, jitter, opticalDepth = null) => {
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

      const transmittance = frameShadowTransmittance(depths, this.frameMultipleScattering, this.frameScatteringOctaves);

      if (opticalDepth) {
        opticalDepth.assign(depths.x);
      }

      // NOTE (direct, total, reduced depth, effective depth). Sky up and down use z and w for the diffusion total.
      return vec4(transmittance.x, transmittance.y, depths.z, depths.y);
    };

    // NOTE Sky up and down are isotropic, and opposite. Diffusion: two-sided total (frameIsotropicDiffusion).
    const skyTotal = (front, back) =>
      select(
        this.frameMultipleScattering.greaterThan(0.0),
        frameIsotropicDiffusion(front.z, back.z, front.w),
        front.y,
      );

    // NOTE Light w is 1.0 for a light direction, 2.0 or more for a light position
    // NOTE Neural: total is direct + the network light. local: the light-independent network inputs of the voxel.
    const lightTransmittance = (slot, worldPosition, jitter, local) => {
      const result = vec4(1.0, 1.0, 0.0, 0.0).toVar();

      If(int(slot).lessThan(this.frameShadowLightCount), () => {
        const light = this.frameShadowLights.element(slot).toVar();
        const isDirection = light.w.lessThan(1.5);
        const toLight = light.xyz.sub(worldPosition).toVar();
        const direction = select(isDirection, normalize(light.xyz), normalize(toLight)).toVar();
        const opticalDepth = neural ? float(0.0).toVar() : null;

        result.assign(
          march(worldPosition, direction, select(isDirection, float(1e20), length(toLight)), jitter, opticalDepth),
        );

        // NOTE Two-sided: diffusion of the slab between the light side and the far side (frameTwoSidedDiffusion)
        If(this.frameTwoSided.greaterThan(0.5), () => {
          const back = march(worldPosition, direction.negate(), float(1e20), jitter).toVar();

          result.y.assign(frameTwoSidedDiffusion(result.x, result.z, result.w, back.z));
        });

        if (neural) {
          result.y.assign(
            result.x.add(neural.neuralLight(worldPosition, direction, opticalDepth, local[0], local[1])),
          );
        }
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
          const local = neural ? neural.getLocalInputs(worldPosition) : null;

          const lights = Array.from({ length: frameShadowLightSlots }, (_, slot) =>
            lightTransmittance(slot, worldPosition, jitter, local).toVar(),
          );

          const skyUp = march(worldPosition, skyDirection, float(1e20), jitter).toVar();
          const skyDown = march(worldPosition, skyDirection.negate(), float(1e20), jitter).toVar();

          transmittance0.assign(vec4(skyTotal(skyUp, skyDown), skyTotal(skyDown, skyUp), lights[0].y, lights[1].y));
          transmittance1.assign(vec4(lights[2].y, lights[3].y, lights[4].y, lights[5].y));
          transmittance2.assign(vec4(lights[0].x, lights[1].x, lights[2].x, lights[3].x));
          transmittance3.assign(vec4(lights[4].x, lights[5].x, 1.0, 1.0));
        });
      });

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(transmittance0, transmittance1, transmittance2, transmittance3);
  }

  // NOTE Spectral: transmittance of each channel for the slots of one group (core/frameSpectrum.js).
  // One march for each direction: the grid gives the extinction and absorption of all channels at each step.
  buildSpectralNodes() {
    const { gridUniforms, lightUniforms } = this.frameUniforms;
    const grid = createGridNodes(gridUniforms);
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount, frameGridAtlasSize } =
      gridUniforms;
    const { frameSkyDirection } = lightUniforms;
    const group = this.frameSpectralGroup;

    const outputs = [property('vec4'), property('vec4'), property('vec4')];

    // NOTE (extinction, absorption) of each channel
    const gridSample = (worldPosition) => {
      const found = grid.findCascade(worldPosition, int(0));
      const cascade = max(found, int(0)).toVar();
      const uvw = grid.gridUvw(cascade, worldPosition).toVar();
      const inside = found.greaterThanEqual(0);

      return {
        extinction: select(inside, grid.sampleGrid(this.frameShadowDensityMap, cascade, uvw).rgb, vec3(0.0)),
        absorption: select(inside, grid.sampleGrid(this.frameShadowAbsorptionMap, cascade, uvw).rgb, vec3(0.0)),
      };
    };

    // NOTE The same march as the grey pass, with the depths of each channel. Stops when all channels are dark.
    // Returns { x: direct, y: total, z: reduced depth, w: effective depth }. enabled false: no march, 1.0 and depths 0.0.
    const march = (enabled, origin, direction, maxDistance, jitter) => {
      const direct = vec3(1.0).toVar();
      const total = vec3(1.0).toVar();
      const reduced = vec3(0.0).toVar();
      const effective = vec3(0.0).toVar();

      If(enabled, () => {
        const depths = { x: vec3(0.0).toVar(), y: vec3(0.0).toVar(), z: vec3(0.0).toVar() };
        const traveled = float(0.0).toVar();
        const probe = vec3(origin).toVar();

        Loop(maxShadowSteps, () => {
          const cascade = grid.findCascade(probe, int(0)).toVar();

          If(
            cascade
              .lessThan(0)
              .or(traveled.greaterThanEqual(maxDistance))
              .or(
                minComponent(
                  frameShadowMarchDepth(depths, this.frameMultipleScattering, this.frameScatteringOctaves),
                ).greaterThan(6.0),
              ),
            () => {
              Break();
            },
          );

          const voxelsPerUnit = abs(direction).div(frameGridVoxel.element(cascade));
          const stepLength = min(
            float(1.0).div(max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z))),
            maxDistance.sub(traveled),
          ).toVar();

          const sample = gridSample(probe.add(direction.mul(stepLength).mul(jitter)));
          const step = frameSpectralShadowStep(sample.extinction, sample.absorption, this.frameMultipleScattering);

          depths.x.addAssign(step.x.mul(stepLength));
          depths.y.addAssign(step.y.mul(stepLength));
          depths.z.addAssign(step.z.mul(stepLength));
          probe.addAssign(direction.mul(stepLength));
          traveled.addAssign(stepLength);
        });

        const shadow = frameSpectralShadowTransmittance(
          depths,
          this.frameMultipleScattering,
          this.frameScatteringOctaves,
        );

        direct.assign(shadow.x);
        total.assign(shadow.y);
        reduced.assign(depths.z);
        effective.assign(depths.y);
      });

      return { x: direct, y: total, z: reduced, w: effective };
    };

    // NOTE Sky up and down are isotropic, and opposite. Diffusion: two-sided total of each channel (frameIsotropicDiffusion).
    const skyTotal = (front, back) =>
      select(
        this.frameMultipleScattering.greaterThan(0.0),
        frameIsotropicDiffusion(front.z, back.z, front.w),
        front.y,
      );

    // NOTE March of a light slot. Light w is 1.0 for a light direction, 2.0 or more for a light position.
    const marchSlot = (enabled, slot, worldPosition, jitter) => {
      // NOTE Group 3 has no second slot (slot 6). The clamp keeps the read in the array, the march is off.
      const light = this.frameShadowLights.element(min(slot, int(frameShadowLightSlots - 1))).toVar();
      const isDirection = light.w.lessThan(1.5);
      const toLight = light.xyz.sub(worldPosition).toVar();
      const direction = select(isDirection, normalize(light.xyz), normalize(toLight)).toVar();
      const active = enabled.and(slot.lessThan(this.frameShadowLightCount)).toVar();
      const front = march(active, worldPosition, direction, select(isDirection, float(1e20), length(toLight)), jitter);

      // NOTE Two-sided: diffusion of the slab between the light side and the far side, for each channel
      If(this.frameTwoSided.greaterThan(0.5), () => {
        const back = march(active, worldPosition, direction.negate(), float(1e20), jitter);

        front.y.assign(frameTwoSidedDiffusion(front.x, front.z, front.w, back.z));
      });

      return front;
    };

    this.vertexNode = frameFullscreenVertex;

    this.colorNode = Fn(() => {
      const fragCoord = frameFragCoord(frameGridAtlasSize).toVar();
      const cell = grid.getGridCell(fragCoord);
      const cascade = cell.cascade.toVar();

      outputs.forEach((output) => output.assign(vec4(1.0)));

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

          nearExtinction = nearExtinction.add(
            dot(gridSample(worldPosition.add(corner.mul(voxel))).extinction, vec3(1.0)),
          );
        }

        If(nearExtinction.greaterThan(0.0), () => {
          const jitter = frameNoise(gridUniforms.frameJitter, fragCoord).toVar();
          const skyDirection = normalize(frameSkyDirection).toVar();
          const isSkyGroup = group.equal(0).toVar();
          const slotA = group.mul(2).sub(1).toVar();

          // NOTE Group 0: sky up, sky down, slot 0. Other groups: slots 2g - 1 and 2g, and no third march.
          const first = march(
            isSkyGroup,
            worldPosition,
            skyDirection,
            float(1e20),
            jitter,
          );
          const second = march(
            isSkyGroup,
            worldPosition,
            skyDirection.negate(),
            float(1e20),
            jitter,
          );
          const slotFirst = marchSlot(isSkyGroup.not(), max(slotA, int(0)), worldPosition, jitter);
          const slotSecond = marchSlot(bool(true), select(isSkyGroup, int(0), slotA.add(1)), worldPosition, jitter);

          const a = {
            x: select(isSkyGroup, skyTotal(first, second), slotFirst.y).toVar(),
            y: select(isSkyGroup, skyTotal(second, first), slotFirst.x).toVar(),
          };
          const b = { x: slotSecond.y, y: slotSecond.x };

          outputs[0].assign(vec4(a.x, a.y.x));
          outputs[1].assign(vec4(a.y.y, a.y.z, b.x.x, b.x.y));
          outputs[2].assign(vec4(b.x.z, b.y));
        });
      });

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(...outputs);
  }
}

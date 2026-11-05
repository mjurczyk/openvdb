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
} from 'three/tsl';
import {
  frameFragCoord,
  frameFullscreenVertex,
  createGridNodes,
  frameShadowStep,
  frameShadowMarchDepth,
  frameShadowTransmittance,
  frameShadowTotal,
  minComponent,
  frameSpectralShadowStep,
  frameSpectralShadowTransmittance,
  frameSpectralShadowTotal,
  frameSpectralGridAlbedo,
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
    // NOTE frameRenderer.settings.spectral: the absorption target of the grid. The march is done for each channel.
    this.frameShadowAbsorptionMap = texture(new Three.Texture());
    this.frameUniforms = { gridUniforms, environmentGridUniforms, lightUniforms };
    this.spectral = false;

    this.vertexNode = frameFullscreenVertex;
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

  buildNodes() {
    const { gridUniforms, environmentGridUniforms, lightUniforms } = this.frameUniforms;
    const { spectral } = this;
    const grid = createGridNodes(gridUniforms);
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridResolution } = gridUniforms;
    const { frameEnvironmentGridCascade, frameEnvironmentGridColumns, frameEnvironmentGridAtlasSize } =
      environmentGridUniforms;
    const { frameEnvironmentUnshadowed } = lightUniforms;

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
      const unshadowedTotal = spectral
        ? frameSpectralShadowTotal(vec3(1.0), this.frameScatteringOctaves, vec3(1.0))
        : frameShadowTotal(float(1.0), this.frameScatteringOctaves);
      const result = vec4(frameEnvironmentUnshadowed.mul(unshadowedTotal), 1.0).toVar();

      // NOTE Spectral: extinction of all channels
      const extinctionAt = (position) => {
        const sample = grid.sampleGrid(this.frameShadowDensityMap, cascade, position.sub(gridMin).div(gridSize));

        return spectral ? sample.r.add(sample.g).add(sample.b) : sample.r;
      };

      // NOTE Skip voxels with no extinction near them. The density pass does not read them.
      let nearExtinction = float(0.0);

      for (let i = 0; i < 8; i++) {
        const corner = vec3(i & 1, (i >> 1) & 1, (i >> 2) & 1).sub(0.5);

        nearExtinction = nearExtinction.add(extinctionAt(worldPosition.add(corner.mul(voxel))));
      }

      if (spectral) {
        If(z.lessThan(resolution).and(nearExtinction.greaterThan(0.0)), () => {
          // NOTE Octaves use the albedo of the medium at this voxel
          const albedo = frameSpectralGridAlbedo(
            grid.sampleGrid(this.frameShadowDensityMap, cascade, gridUvw).rgb,
            grid.sampleGrid(this.frameShadowAbsorptionMap, cascade, gridUvw).rgb,
          ).toVar();
          const irradiance = vec3(0.0).toVar();

          Loop(this.frameLightCount, ({ i }) => {
            const direction = this.frameLightDirections.element(i).toVar();
            const voxelsPerUnit = abs(direction).div(voxel);
            const stepLength = float(1.0)
              .div(max(voxelsPerUnit.x, max(voxelsPerUnit.y, voxelsPerUnit.z)))
              .toVar();
            const step = direction.mul(stepLength).toVar();
            const probe = worldPosition.add(step.mul(0.5)).toVar();
            const depths = { x: vec3(0.0).toVar(), y: vec3(0.0).toVar(), z: vec3(0.0).toVar() };

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
                  .or(
                    minComponent(
                      frameShadowMarchDepth(depths, this.frameMultipleScattering, this.frameScatteringOctaves),
                    ).greaterThan(6.0),
                  ),
                () => {
                  Break();
                },
              );

              const step = frameSpectralShadowStep(
                grid.sampleGrid(this.frameShadowDensityMap, cascade, uvw).rgb,
                grid.sampleGrid(this.frameShadowAbsorptionMap, cascade, uvw).rgb,
                this.frameMultipleScattering,
              );

              depths.x.addAssign(step.x.mul(stepLength));
              depths.y.addAssign(step.y.mul(stepLength));
              depths.z.addAssign(step.z.mul(stepLength));
              probe.addAssign(direction.mul(stepLength));
            });

            // NOTE Environment lights are isotropic: total transmittance, no phase
            const shadow = frameSpectralShadowTransmittance(
              depths,
              this.frameMultipleScattering,
              this.frameScatteringOctaves,
            );

            irradiance.addAssign(
              this.frameLightColors
                .element(i)
                .mul(frameSpectralShadowTotal(shadow.y, this.frameScatteringOctaves, albedo)),
            );
          });

          result.assign(vec4(max(irradiance, vec3(0.0)), 1.0));
        });
      } else {
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

            // NOTE Environment lights are isotropic: total transmittance, no phase
            const shadow = frameShadowTransmittance(depths, this.frameMultipleScattering, this.frameScatteringOctaves);

            irradiance.addAssign(
              this.frameLightColors.element(i).mul(frameShadowTotal(shadow.y, this.frameScatteringOctaves)),
            );
          });

          result.assign(vec4(max(irradiance, vec3(0.0)), 1.0));
        });

      }

      return result;
    })();
  }
}

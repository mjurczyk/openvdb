import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Discard,
  float,
  int,
  vec2,
  vec3,
  vec4,
  uniform,
  texture,
  property,
  outputStruct,
  select,
  mix,
  exp,
  dot,
  length,
  normalize,
  mat3,
  min,
  max,
} from 'three/tsl';
import {
  frameFragCoord,
  frameGetFroxel,
  frameDistanceFade,
  getFroxelLod,
  getSampledLod,
  getBoxSteps,
  frameNoise,
  frameTileVertex,
  createVolumeUniforms,
  createVolumeNodes,
  createGridNodes,
  frameShadowedLight,
  frameShadowTotal,
  frameMeanComponent,
  frameSpectralShadowTotal,
} from './frameShaderChunks.js';
import { FrameEnvironmentMaterial } from './FrameEnvironmentMaterial.js';

// NOTE Shadow grid data for the density pass. Each volume samples its own visible position.
export const createDensityShadowUniforms = () => ({
  frameTransmittanceMap0: texture(new Three.Texture()),
  frameTransmittanceMap1: texture(new Three.Texture()),
  // NOTE Direct transmittance of the 6 light slots
  frameTransmittanceMap2: texture(new Three.Texture()),
  frameTransmittanceMap3: texture(new Three.Texture()),
  // NOTE Scene lights with a shadow slot. Their slots get the phase here, at the visible position of each volume.
  frameShadowSceneLightCount: uniform(0, 'int'),
  // NOTE One phase for all volumes, from frameRenderer.settings
  framePhase: uniform(new Three.Vector4()),
  framePhaseSpectrum: uniform(new Three.Vector3()),
  // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
  frameScatteringOctaves: uniform(new Three.Vector4()),
  // NOTE 1 with diffusion multiple scattering. Then sky up and down have two-sided totals (frameIsotropicDiffusion).
  frameDiffusion: uniform(0, 'int'),
  frameUseShadows: uniform(0, 'int'),
  frameCameraMatrixWorld: uniform(new Three.Matrix4()),
  // NOTE Environment light of the last cascade voxels (FrameEnvironmentGridMaterial)
  frameEnvironmentGridMap: texture(new Three.Texture()),
  // NOTE frameDensityEnvironment values
  frameEnvironmentMode: uniform(0, 'int'),
  // NOTE frameRenderer.settings.spectral: targets 0 and 1 of slot group 0 (sky up and sky down, core/frameSpectrum.js)
  frameSkyTransmittanceMaps: [texture(new Three.Texture()), texture(new Three.Texture())],
});

// NOTE Environment in the density pass: outward direction, none (only the slot light, in the lighting pass),
// or the environment grid
export const frameDensityEnvironment = { outward: 0, none: 1, grid: 2 };

// NOTE Writes the extinction and material of one volume into the froxel grid. Lights are added in the lighting pass.
// NOTE The environment is added here, along the outward direction of each volume.
// NOTE All volumes use this material. Pool meshes set the volume uniforms before each draw.
export class FrameDensityMaterial extends FrameEnvironmentMaterial {
  constructor({
    froxelUniforms,
    froxelTileUniforms,
    gridUniforms,
    environmentGridUniforms,
    densityShadowUniforms,
    lightUniforms,
  }) {
    super();

    this.name = 'FrameDensityMaterial';
    this.volumeUniforms = createVolumeUniforms();
    this.frameRect = uniform(new Three.Vector4());
    this.frameSliceStart = uniform(0.0);

    this.frameUniforms = {
      froxelUniforms,
      froxelTileUniforms,
      gridUniforms,
      environmentGridUniforms,
      densityShadowUniforms,
      lightUniforms,
    };
    this.mipmaps = false;
    // NOTE frameRenderer.settings.spectral: three targets, no light slots (the lighting pass samples the shadow grid)
    this.spectral = false;
    this.buildNodes();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;
    this.blending = Three.CustomBlending;
    this.blendEquation = Three.AddEquation;
    this.blendSrc = Three.OneFactor;
    this.blendDst = Three.OneFactor;
    this.blendSrcAlpha = Three.OneFactor;
    this.blendDstAlpha = Three.OneFactor;
  }

  // NOTE Mip sampling is in the shader only when a volume uses mipmaps
  setMipmaps(mipmaps) {
    if (mipmaps !== this.mipmaps) {
      this.mipmaps = mipmaps;
      this.environmentNodes = [];
      this.buildNodes();
      this.needsUpdate = true;
    }
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.environmentNodes = [];
      this.buildNodes();
      this.needsUpdate = true;
    }
  }

  rebuildNodes() {
    this.buildNodes();
  }

  buildNodes() {
    if (this.spectral) {
      this.buildSpectralNodes();

      return;
    }

    const {
      froxelUniforms,
      froxelTileUniforms,
      gridUniforms,
      environmentGridUniforms,
      densityShadowUniforms,
      lightUniforms,
    } = this.frameUniforms;
    const volume = createVolumeNodes(this.volumeUniforms, this.mipmaps);
    const grid = createGridNodes(gridUniforms);
    const { frameViewToLocal, frameLocalToView, frameOpacity, frameScatterColor, frameWorldScale } =
      this.volumeUniforms;
    const { frameCameraMatrixWorld } = densityShadowUniforms;
    const { froxelSubSteps, frameJitter } = froxelUniforms;

    const densityAlbedo = property('vec4');
    const densityEmission = property('vec4');
    const densityShadow0 = property('vec4');
    const densityShadow1 = property('vec4');

    this.vertexNode = frameTileVertex(froxelTileUniforms, this.frameRect, this.frameSliceStart);

    this.colorNode = Fn(() => {
      const fragCoord = frameFragCoord(froxelTileUniforms.frameTargetSize).toVar();
      const froxel = frameGetFroxel(froxelUniforms, fragCoord);
      const viewNear = froxel.viewNear.toVar();
      const viewFar = froxel.viewFar.toVar();
      const localNear = frameViewToLocal.mul(vec4(viewNear, 1.0)).xyz.toVar();
      const localFar = frameViewToLocal.mul(vec4(viewFar, 1.0)).xyz.toVar();
      const boxSegment = volume.boxSegment(localNear, localFar).toVar();

      If(boxSegment.x.greaterThanEqual(boxSegment.y), () => {
        Discard();
      });

      const segment = boxSegment.y.sub(boxSegment.x).toVar();
      const widthLod = getFroxelLod(froxelUniforms, froxel, volume, float(0.0), frameWorldScale);
      const sampledLod = getSampledLod(this.volumeUniforms, widthLod, this.mipmaps);
      const steps = getBoxSteps(volume, localNear, localFar, segment, sampledLod, froxelSubSteps);
      const subStepCount = float(steps);
      const subStepLength = length(viewFar.sub(viewNear)).mul(segment).div(subStepCount).toVar();
      const lod = max(widthLod, volume.getLod(subStepLength.div(frameWorldScale))).toVar();

      // NOTE Mean extinction of the slice. The visibility-weighted mean position is the light position in the lighting pass.
      const extinctionSum = float(0.0).toVar();
      const transmittance = float(1.0).toVar();
      const visibleWeight = float(0.0).toVar();
      const visibleTSum = float(0.0).toVar();
      const jitter = frameNoise(frameJitter, fragCoord).toVar();

      Loop({ start: int(0), end: steps, type: 'int', condition: '<' }, ({ i }) => {
        const t = boxSegment.x.add(segment.mul(float(i).add(jitter).div(subStepCount))).toVar();
        const extinction = volume
          .sampleExtinction(mix(localNear, localFar, t), lod)
          .mul(frameOpacity)
          .mul(frameDistanceFade(froxelUniforms, mix(viewNear, viewFar, t)))
          .toVar();
        const stepTransmittance = exp(extinction.mul(subStepLength).negate()).toVar();
        const weight = transmittance.mul(float(1.0).sub(stepTransmittance)).toVar();

        visibleWeight.addAssign(weight);
        visibleTSum.addAssign(weight.mul(t));
        extinctionSum.addAssign(extinction);
        transmittance.mulAssign(stepTransmittance);
      });

      // NOTE The mean over the whole slice: the box part's mean, weighted by its share of the slice
      const extinction = extinctionSum.div(subStepCount).mul(segment).toVar();

      If(extinction.lessThanEqual(0.0), () => {
        Discard();
      });

      const visibleT = select(
        visibleWeight.greaterThan(0.0),
        visibleTSum.div(visibleWeight),
        float(0.5),
      ).toVar();
      const visiblePosition = mix(localNear, localFar, visibleT).toVar();
      const albedo = volume.sampleAlbedo(visiblePosition, lod).toVar();
      const emission = volume.sampleEmission(visiblePosition, lod).add(frameScatterColor).toVar();

      // NOTE Shadows at the visible position of this volume, not of other volumes in the froxel
      // NOTE shadow0, shadow1: total transmittance. direct0, direct1: direct transmittance of the 6 light slots.
      const shadow0 = vec4(1.0).toVar();
      const shadow1 = vec4(1.0).toVar();
      const direct0 = vec4(1.0).toVar();
      const direct1 = vec4(1.0).toVar();
      const visibleWorldPosition = frameCameraMatrixWorld
        .mul(vec4(mix(viewNear, viewFar, visibleT), 1.0))
        .xyz.toVar();

      If(densityShadowUniforms.frameUseShadows.equal(1), () => {
        const shadows = grid.sampleShadows(
          [
            densityShadowUniforms.frameTransmittanceMap0,
            densityShadowUniforms.frameTransmittanceMap1,
            densityShadowUniforms.frameTransmittanceMap2,
            densityShadowUniforms.frameTransmittanceMap3,
          ],
          visibleWorldPosition,
        );

        shadow0.assign(shadows[0]);
        shadow1.assign(shadows[1]);
        direct0.assign(shadows[2]);
        direct1.assign(shadows[3]);
      });

      // NOTE Scene light slots store phase * direct + scattered (frameShadowedLight), green channel.
      // Phases of each channel: the lighting pass adds the red and blue phase.
      // NOTE Other slots (sky up and down, the environment light) store the isotropic total transmittance.
      const rayDirection = normalize(mat3(frameCameraMatrixWorld).mul(viewFar.sub(viewNear))).toVar();
      const lightSlots = [
        [shadow0, 'z', direct0.x],
        [shadow0, 'w', direct0.y],
        [shadow1, 'x', direct0.z],
        [shadow1, 'y', direct0.w],
        [shadow1, 'z', direct1.x],
        [shadow1, 'w', direct1.y],
      ];

      const { frameScatteringOctaves } = densityShadowUniforms;

      lightSlots.forEach(([shadow, channel, direct], index) => {
        If(int(index).lessThan(densityShadowUniforms.frameShadowSceneLightCount), () => {
          const light = lightUniforms.frameLightPositions.element(index).toVar();

          shadow[channel].assign(
            frameShadowedLight(
              densityShadowUniforms.framePhase,
              densityShadowUniforms.framePhaseSpectrum,
              frameScatteringOctaves,
              rayDirection,
              select(light.w.lessThan(1.5), light.xyz, normalize(light.xyz.sub(visibleWorldPosition))),
              vec2(direct, shadow[channel]),
            ).g,
          );
        }).Else(() => {
          shadow[channel].assign(frameShadowTotal(shadow[channel], frameScatteringOctaves));
        });
      });

      shadow0.x.assign(frameShadowTotal(shadow0.x, frameScatteringOctaves));
      shadow0.y.assign(frameShadowTotal(shadow0.y, frameScatteringOctaves));

      const { frameEnvironmentMode } = densityShadowUniforms;

      // NOTE Environment along the outward direction from the volume center, the same as per-volume lighting.
      // NOTE Its shadow is between the sky down and sky up transmittance of the shadow grid.
      if (this.environment) {
        If(frameEnvironmentMode.equal(frameDensityEnvironment.outward), () => {
          const skyDirection = normalize(lightUniforms.frameSkyDirection).toVar();
          const outwardDirection = select(
            length(visiblePosition).greaterThan(1e-4),
            normalize(mat3(frameCameraMatrixWorld).mul(mat3(frameLocalToView).mul(visiblePosition))),
            skyDirection,
          ).toVar();
          const skyBlend = dot(outwardDirection, skyDirection).mul(0.5).add(0.5).toVar();
          const environmentShadow = mix(shadow0.y, shadow0.x, skyBlend);

          // NOTE Diffusion: the outward and the inward irradiance, each with its two-sided total. Uniform light then gives E.
          If(densityShadowUniforms.frameDiffusion.equal(1), () => {
            const inwardShadow = mix(shadow0.x, shadow0.y, skyBlend);

            emission.addAssign(
              albedo
                .mul(
                  this.environmentIrradiance(outwardDirection)
                    .mul(environmentShadow)
                    .add(this.environmentIrradiance(outwardDirection.negate()).mul(inwardShadow))
                    .mul(0.5),
                )
                .mul(1.0 / Math.PI),
            );
          }).Else(() => {
            emission.addAssign(
              albedo
                .mul(this.environmentIrradiance(outwardDirection))
                .mul(environmentShadow)
                .mul(1.0 / Math.PI),
            );
          });
        });
      }

      // NOTE Environment light of the environment grid at the visible position
      If(frameEnvironmentMode.equal(frameDensityEnvironment.grid), () => {
        const viewPosition = mix(viewNear, viewFar, visibleT);
        const worldPosition = frameCameraMatrixWorld.mul(vec4(viewPosition, 1.0)).xyz.toVar();
        const environment = grid.sampleEnvironmentGrid(
          densityShadowUniforms.frameEnvironmentGridMap,
          environmentGridUniforms,
          worldPosition,
          vec4(lightUniforms.frameEnvironmentUnshadowed.mul(frameShadowTotal(float(1.0), frameScatteringOctaves)), 1.0),
        );

        emission.addAssign(albedo.mul(environment.rgb).mul(1.0 / Math.PI));
      });

      // NOTE Values are weighted by extinction. Additive blending then gives extinction-weighted means.
      densityAlbedo.assign(vec4(albedo.mul(extinction), extinction));
      densityEmission.assign(vec4(emission.mul(extinction), visibleT.mul(extinction)));
      // NOTE Light slots can be more than 1 (phase). The limit keeps them below the half float maximum.
      densityShadow0.assign(min(shadow0.mul(extinction), 6.0e4));
      densityShadow1.assign(min(shadow1.mul(extinction), 6.0e4));

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(densityAlbedo, densityEmission, densityShadow0, densityShadow1);
  }

  // NOTE Spectral density pass. Targets: (albedo * extinction of each channel, weight), (emission * weight,
  // visibleT * weight), (extinction of each channel, 0). Weight is the mean extinction of the channels.
  // NOTE Light slots are not here: they need 3 values each. The lighting pass samples the shadow grid at the froxel.
  buildSpectralNodes() {
    const {
      froxelUniforms,
      froxelTileUniforms,
      gridUniforms,
      environmentGridUniforms,
      densityShadowUniforms,
      lightUniforms,
    } = this.frameUniforms;
    const volume = createVolumeNodes(this.volumeUniforms, this.mipmaps);
    const grid = createGridNodes(gridUniforms);
    const {
      frameViewToLocal,
      frameLocalToView,
      frameOpacity,
      frameScatterColor,
      frameWorldScale,
      frameExtinctionSpectrum,
    } = this.volumeUniforms;
    const { frameCameraMatrixWorld, frameScatteringOctaves, frameEnvironmentMode } = densityShadowUniforms;
    const { froxelSubSteps, frameJitter } = froxelUniforms;

    const densityAlbedo = property('vec4');
    const densityEmission = property('vec4');
    const densityExtinction = property('vec4');

    this.vertexNode = frameTileVertex(froxelTileUniforms, this.frameRect, this.frameSliceStart);

    this.colorNode = Fn(() => {
      const fragCoord = frameFragCoord(froxelTileUniforms.frameTargetSize).toVar();
      const froxel = frameGetFroxel(froxelUniforms, fragCoord);
      const viewNear = froxel.viewNear.toVar();
      const viewFar = froxel.viewFar.toVar();
      const localNear = frameViewToLocal.mul(vec4(viewNear, 1.0)).xyz.toVar();
      const localFar = frameViewToLocal.mul(vec4(viewFar, 1.0)).xyz.toVar();
      const boxSegment = volume.boxSegment(localNear, localFar).toVar();

      If(boxSegment.x.greaterThanEqual(boxSegment.y), () => {
        Discard();
      });

      const segment = boxSegment.y.sub(boxSegment.x).toVar();
      const widthLod = getFroxelLod(froxelUniforms, froxel, volume, float(0.0), frameWorldScale);
      const sampledLod = getSampledLod(this.volumeUniforms, widthLod, this.mipmaps);
      const steps = getBoxSteps(volume, localNear, localFar, segment, sampledLod, froxelSubSteps);
      const subStepCount = float(steps);
      const subStepLength = length(viewFar.sub(viewNear)).mul(segment).div(subStepCount).toVar();
      const lod = max(widthLod, volume.getLod(subStepLength.div(frameWorldScale))).toVar();

      // NOTE The visible position uses the mean transmittance of the channels
      const extinctionSum = float(0.0).toVar();
      const transmittance = vec3(1.0).toVar();
      const visibleWeight = float(0.0).toVar();
      const visibleTSum = float(0.0).toVar();
      const jitter = frameNoise(frameJitter, fragCoord).toVar();

      Loop({ start: int(0), end: steps, type: 'int', condition: '<' }, ({ i }) => {
        const t = boxSegment.x.add(segment.mul(float(i).add(jitter).div(subStepCount))).toVar();
        const extinction = volume
          .sampleExtinction(mix(localNear, localFar, t), lod)
          .mul(frameOpacity)
          .mul(frameDistanceFade(froxelUniforms, mix(viewNear, viewFar, t)))
          .toVar();
        const stepTransmittance = exp(
          frameExtinctionSpectrum.mul(extinction).mul(subStepLength).negate(),
        ).toVar();
        const weight = frameMeanComponent(
          transmittance.mul(float(1.0).sub(stepTransmittance)),
        ).toVar();

        visibleWeight.addAssign(weight);
        visibleTSum.addAssign(weight.mul(t));
        extinctionSum.addAssign(extinction);
        transmittance.mulAssign(stepTransmittance);
      });

      // NOTE The mean over the whole slice: the box part's mean, weighted by its share of the slice
      const extinction = frameExtinctionSpectrum.mul(extinctionSum.div(subStepCount).mul(segment)).toVar();
      const weight = frameMeanComponent(extinction).toVar();

      If(weight.lessThanEqual(0.0), () => {
        Discard();
      });

      const visibleT = select(
        visibleWeight.greaterThan(0.0),
        visibleTSum.div(visibleWeight),
        float(0.5),
      ).toVar();
      const visiblePosition = mix(localNear, localFar, visibleT).toVar();
      const albedo = volume.sampleAlbedo(visiblePosition, lod).toVar();
      const emission = volume.sampleEmission(visiblePosition, lod).add(frameScatterColor).toVar();
      const visibleWorldPosition = frameCameraMatrixWorld
        .mul(vec4(mix(viewNear, viewFar, visibleT), 1.0))
        .xyz.toVar();

      // NOTE Environment along the outward direction from the volume center, the same as per-volume lighting.
      // NOTE Its shadow is between the sky down and sky up transmittance of each channel.
      if (this.environment) {
        If(frameEnvironmentMode.equal(frameDensityEnvironment.outward), () => {
          const skyUp = vec3(1.0).toVar();
          const skyDown = vec3(1.0).toVar();

          If(densityShadowUniforms.frameUseShadows.equal(1), () => {
            const sky = grid.sampleShadows(densityShadowUniforms.frameSkyTransmittanceMaps, visibleWorldPosition);

            skyUp.assign(sky[0].rgb);
            skyDown.assign(vec3(sky[0].a, sky[1].r, sky[1].g));
          });

          const skyDirection = normalize(lightUniforms.frameSkyDirection).toVar();
          const outwardDirection = select(
            length(visiblePosition).greaterThan(1e-4),
            normalize(mat3(frameCameraMatrixWorld).mul(mat3(frameLocalToView).mul(visiblePosition))),
            skyDirection,
          ).toVar();
          const skyBlend = dot(outwardDirection, skyDirection).mul(0.5).add(0.5).toVar();
          const upTotal = frameSpectralShadowTotal(skyUp, frameScatteringOctaves, albedo).toVar();
          const downTotal = frameSpectralShadowTotal(skyDown, frameScatteringOctaves, albedo).toVar();
          const environmentShadow = mix(downTotal, upTotal, skyBlend);

          // NOTE Diffusion: the outward and the inward irradiance, each with its two-sided total. Uniform light then gives E.
          If(densityShadowUniforms.frameDiffusion.equal(1), () => {
            const inwardShadow = mix(upTotal, downTotal, skyBlend);

            emission.addAssign(
              albedo
                .mul(
                  this.environmentIrradiance(outwardDirection)
                    .mul(environmentShadow)
                    .add(this.environmentIrradiance(outwardDirection.negate()).mul(inwardShadow))
                    .mul(0.5),
                )
                .mul(1.0 / Math.PI),
            );
          }).Else(() => {
            emission.addAssign(
              albedo
                .mul(this.environmentIrradiance(outwardDirection))
                .mul(environmentShadow)
                .mul(1.0 / Math.PI),
            );
          });
        });
      }

      // NOTE Environment light of the environment grid at the visible position
      If(frameEnvironmentMode.equal(frameDensityEnvironment.grid), () => {
        const environment = grid.sampleEnvironmentGrid(
          densityShadowUniforms.frameEnvironmentGridMap,
          environmentGridUniforms,
          visibleWorldPosition,
          vec4(
            lightUniforms.frameEnvironmentUnshadowed.mul(
              frameSpectralShadowTotal(vec3(1.0), frameScatteringOctaves, albedo),
            ),
            1.0,
          ),
        );

        emission.addAssign(albedo.mul(environment.rgb).mul(1.0 / Math.PI));
      });

      // NOTE Values are weighted. Additive blending then gives weighted means, and the sum of the extinction.
      densityAlbedo.assign(vec4(albedo.mul(extinction), weight));
      densityEmission.assign(vec4(emission.mul(weight), visibleT.mul(weight)));
      densityExtinction.assign(vec4(extinction, 0.0));

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(densityAlbedo, densityEmission, densityExtinction);
  }
}

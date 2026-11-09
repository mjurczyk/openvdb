import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  Discard,
  float,
  int,
  vec2,
  vec3,
  vec4,
  mat3,
  uniform,
  property,
  outputStruct,
  select,
  mix,
  exp,
  min,
  max,
  dot,
  length,
  normalize,
  smoothstep,
  getShIrradianceAt,
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
  frameShadowAbsorption,
  frameShadowStep,
  frameShadowMarchDepth,
  frameShadowTransmittance,
  frameShadowTotal,
  frameIsotropicDiffusion,
  frameTwoSidedDiffusion,
  frameShadowedLight,
  frameMeanComponent,
  minComponent,
  maxComponent,
  frameSpectralShadowUnit,
  frameSpectralShadowDepths,
  frameSpectralShadowTransmittance,
  frameSpectralShadowTotal,
  frameSpectralShadowedLight,
  createVolumeUniforms,
  createVolumeNodes,
} from './frameShaderChunks.js';
import { FrameEnvironmentMaterial } from './FrameEnvironmentMaterial.js';
import { frameLights } from '../core/frameLights.js';

// NOTE Lights one volume in each froxel, with a shadow march in this volume. Other volumes do not cast shadows.
// NOTE The renderer draws it one time for each volume, with the uniforms of that volume.
export class FrameInjectMaterial extends FrameEnvironmentMaterial {
  constructor({ froxelUniforms, froxelTileUniforms, lightUniforms }) {
    super();

    this.name = 'FrameInjectMaterial';
    this.froxelUniforms = froxelUniforms;
    this.lightUniforms = lightUniforms;
    this.volumeUniforms = createVolumeUniforms();
    this.frameLights = uniform(0, 'int');
    this.frameShadowSteps = uniform(32, 'int');
    // NOTE Multiple scattering of this volume (core/framePhase.js). 0.0 is single scattering.
    this.frameMultipleScattering = uniform(0.0);
    // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
    this.frameScatteringOctaves = uniform(new Three.Vector4());
    // NOTE multipleScattering 'two-sided' (core/framePhase.js): scene light shadows also march away from the light
    this.frameTwoSided = uniform(0.0);
    this.frameCameraMatrixWorld = uniform(new Three.Matrix4());
    this.mipmaps = false;
    // NOTE frameRenderer.settings.spectral: extinction and multiple scattering of each channel, two atlas targets
    this.spectral = false;

    // NOTE The froxel rectangle and the slices of the volume of this draw. One instance for each slice.
    this.frameRect = uniform(new Three.Vector4());
    this.frameSliceStart = uniform(0.0);
    this.vertexNode = frameTileVertex(froxelTileUniforms, this.frameRect, this.frameSliceStart);
    this.rebuildNodes();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.transparent = true;
    this.depthTest = false;
    this.depthWrite = false;

    // NOTE Premultiplied "over" blend. Overlapping volumes in one froxel multiply their transmittance.
    this.blending = Three.CustomBlending;
    this.blendEquation = Three.AddEquation;
    this.blendSrc = Three.OneFactor;
    this.blendDst = Three.OneMinusSrcAlphaFactor;
    this.blendSrcAlpha = Three.OneFactor;
    this.blendDstAlpha = Three.OneMinusSrcAlphaFactor;
  }

  // NOTE Mip sampling is in the shader only when a volume uses mipmaps
  setMipmaps(mipmaps) {
    if (mipmaps !== this.mipmaps) {
      this.mipmaps = mipmaps;
      this.environmentNodes = [];
      this.rebuildNodes();
      this.needsUpdate = true;
    }
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.environmentNodes = [];
      this.rebuildNodes();
      this.needsUpdate = true;
    }
  }

  // NOTE Spectral: atlas target 0 is (color, green alpha), target 1 is (red alpha, blue alpha, 0, green alpha).
  // NOTE Both targets blend with the green alpha (w of each output).
  rebuildNodes() {
    if (!this.spectral) {
      this.colorNode = null;
      this.outputNode = null;
      this.fragmentNode = this.createFragmentNode();

      return;
    }

    const injectColor = property('vec4');
    const injectAlpha = property('vec4');

    this.fragmentNode = null;
    this.colorNode = this.createFragmentNode({ color: injectColor, alpha: injectAlpha });
    this.outputNode = outputStruct(injectColor, injectAlpha);
  }

  // NOTE spectralOutputs: { color, alpha } property nodes of the spectral targets. null: one target.
  createFragmentNode(spectralOutputs = null) {
    const spectral = spectralOutputs !== null;
    const { froxelUniforms, lightUniforms, volumeUniforms } = this;
    const { froxelGrid, froxelSubSteps, froxelAtlasSize, frameJitter } = froxelUniforms;
    const {
      frameAmbientColor,
      frameLightProbe,
      frameHemiCount,
      frameHemiSkyColors,
      frameHemiGroundColors,
      frameHemiDirections,
      frameLightCount,
      frameLightPositions,
      frameLightColors,
      frameLightSpots,
      frameEnvironmentCount,
      frameEnvironmentDirections,
      frameEnvironmentColors,
    } = lightUniforms;
    const {
      frameViewToLocal,
      frameLocalToView,
      frameWorldToLocal,
      frameOpacity,
      frameAbsorbance,
      frameScatterColor,
      frameWorldScale,
      frameExtinctionSpectrum,
    } = volumeUniforms;
    const volume = createVolumeNodes(volumeUniforms, this.mipmaps);

    const useLights = (flag) => this.frameLights.bitAnd(int(flag)).notEqual(0);

    return Fn(() => {
      const fragCoord = frameFragCoord(froxelAtlasSize).toVar();
      const froxel = frameGetFroxel(froxelUniforms, fragCoord);

      If(froxel.slice.greaterThanEqual(froxelGrid.z), () => {
        Discard();
      });

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
      const sampledLod = getSampledLod(volumeUniforms, widthLod, this.mipmaps);
      const steps = getBoxSteps(volume, localNear, localFar, segment, sampledLod, froxelSubSteps);
      const subStepCount = float(steps);
      const subStepLength = length(viewFar.sub(viewNear)).mul(segment).div(subStepCount).toVar();
      const lod = max(widthLod, volume.getLod(subStepLength.div(frameWorldScale))).toVar();

      // NOTE Pre-integrate the slice along the view ray. Light the visibility-weighted mean position, not the froxel center.
      // NOTE Spectral: transmittance of each channel. The visible position uses the mean of the channels.
      const transmittance = (spectral ? vec3(1.0) : float(1.0)).toVar();
      const visibleWeight = float(0.0).toVar();
      const visibleTSum = float(0.0).toVar();
      const jitter = frameNoise(frameJitter, fragCoord).toVar();

      Loop({ start: int(0), end: steps, type: 'int', condition: '<' }, ({ i }) => {
        const t = boxSegment.x.add(segment.mul(float(i).add(jitter).div(subStepCount))).toVar();
        const opticalDepth = volume
          .sampleExtinction(mix(localNear, localFar, t), lod)
          .mul(frameOpacity)
          .mul(frameDistanceFade(froxelUniforms, mix(viewNear, viewFar, t)))
          .mul(subStepLength);
        const stepTransmittance = exp(
          (spectral ? frameExtinctionSpectrum.mul(opticalDepth) : opticalDepth).negate(),
        ).toVar();
        const stepWeight = transmittance.mul(float(1.0).sub(stepTransmittance));
        const weight = (spectral ? frameMeanComponent(stepWeight) : stepWeight).toVar();

        visibleWeight.addAssign(weight);
        visibleTSum.addAssign(weight.mul(t));
        transmittance.mulAssign(stepTransmittance);
      });

      const alpha = (spectral ? vec3(1.0) : float(1.0)).sub(transmittance).toVar();

      If(visibleWeight.lessThanEqual(0.0).or((spectral ? maxComponent(alpha) : alpha).lessThanEqual(1e-5)), () => {
        Discard();
      });

      const localPosition = mix(localNear, localFar, visibleTSum.div(visibleWeight)).toVar();
      const viewPosition = frameLocalToView.mul(vec4(localPosition, 1.0)).xyz;
      const worldPosition = this.frameCameraMatrixWorld.mul(vec4(viewPosition, 1.0)).xyz.toVar();
      const worldToLocalDirection = mat3(frameWorldToLocal);
      const rayDirection = normalize(
        mat3(this.frameCameraMatrixWorld).mul(viewFar.sub(viewNear)),
      ).toVar();
      const shadowNoise = frameNoise(frameJitter, fragCoord.add(vec2(17.0, 31.0))).toVar();
      const albedo = volume.sampleAlbedo(localPosition, lod).toVar();

      // NOTE Shadow march inside this volume only. Call in the Fn body.
      // NOTE Returns (direct, total, reduced depth, effective depth). The absorption uses the albedo at the lit position.
      const volumeTransmittance = (localDirection, maxLocalDistance) => {
        const result = vec4(1.0, 1.0, 0.0, 0.0).toVar();

        If(frameAbsorbance.greaterThan(0.0).and(this.frameShadowSteps.greaterThan(0)), () => {
          const direction = normalize(localDirection).toVar();
          const marchDistance = min(volume.boxExit(localPosition, direction), maxLocalDistance).toVar();

          If(marchDistance.greaterThan(0.0), () => {
            const localStep = marchDistance.div(float(this.frameShadowSteps)).toVar();
            const stepLod = max(lod, volume.getLod(localStep)).toVar();
            const worldStep = localStep.mul(length(mat3(frameLocalToView).mul(direction)));
            const stepScale = worldStep.mul(frameAbsorbance).toVar();
            const depths = vec3(0.0).toVar();
            const probe = localPosition.add(direction.mul(localStep).mul(shadowNoise)).toVar();

            Loop(this.frameShadowSteps, () => {
              const extinction = volume.sampleExtinction(probe, stepLod).mul(stepScale).toVar();

              depths.addAssign(
                frameShadowStep(
                  extinction,
                  frameShadowAbsorption(extinction, albedo),
                  this.frameMultipleScattering,
                ),
              );

              If(frameShadowMarchDepth(depths, this.frameMultipleScattering, this.frameScatteringOctaves).greaterThan(8.0), () => {
                Break();
              });

              probe.addAssign(direction.mul(localStep));
            });

            const transmittance = frameShadowTransmittance(depths, this.frameMultipleScattering, this.frameScatteringOctaves);

            result.assign(vec4(transmittance.x, transmittance.y, depths.z, depths.y));
          });
        });

        return result;
      };

      // NOTE Spectral shadow march. One volume has one spectrum, so the march sums one optical depth.
      // Then the depths of each channel are linear in it (frameSpectralShadowDepths).
      // Returns { x: direct, y: total, z: reduced depth, w: effective depth }, vec3 values.
      const shadowUnit = spectral
        ? frameSpectralShadowUnit(frameExtinctionSpectrum, albedo, this.frameMultipleScattering)
        : null;

      const spectralVolumeTransmittance = (localDirection, maxLocalDistance) => {
        const direct = vec3(1.0).toVar();
        const total = vec3(1.0).toVar();
        const reduced = vec3(0.0).toVar();
        const effective = vec3(0.0).toVar();

        If(frameAbsorbance.greaterThan(0.0).and(this.frameShadowSteps.greaterThan(0)), () => {
          const direction = normalize(localDirection).toVar();
          const marchDistance = min(volume.boxExit(localPosition, direction), maxLocalDistance).toVar();

          If(marchDistance.greaterThan(0.0), () => {
            const localStep = marchDistance.div(float(this.frameShadowSteps)).toVar();
            const stepLod = max(lod, volume.getLod(localStep)).toVar();
            const worldStep = localStep.mul(length(mat3(frameLocalToView).mul(direction)));
            const stepScale = worldStep.mul(frameAbsorbance).toVar();
            const opticalDepth = float(0.0).toVar();
            const probe = localPosition.add(direction.mul(localStep).mul(shadowNoise)).toVar();

            Loop(this.frameShadowSteps, () => {
              opticalDepth.addAssign(volume.sampleExtinction(probe, stepLod).mul(stepScale));

              // NOTE Stop when all channels are dark
              If(
                minComponent(
                  frameShadowMarchDepth(
                    frameSpectralShadowDepths(shadowUnit, opticalDepth),
                    this.frameMultipleScattering,
                    this.frameScatteringOctaves,
                  ),
                ).greaterThan(8.0),
                () => {
                  Break();
                },
              );

              probe.addAssign(direction.mul(localStep));
            });

            const depths = frameSpectralShadowDepths(shadowUnit, opticalDepth);
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
        });

        return { x: direct, y: total, z: reduced, w: effective };
      };

      // NOTE Isotropic light (no phase): total transmittance
      const totalTransmittance = (localDirection, maxLocalDistance) =>
        spectral
          ? frameSpectralShadowTotal(
              spectralVolumeTransmittance(localDirection, maxLocalDistance).y,
              this.frameScatteringOctaves,
              albedo,
            )
          : frameShadowTotal(volumeTransmittance(localDirection, maxLocalDistance).y, this.frameScatteringOctaves);

      // NOTE Diffusion: two-sided totals of isotropic light (frameIsotropicDiffusion) for { x: direction, y: opposite direction }.
      // It marches both directions. Spectral: vec3 values, one for each channel. Call in the Fn body.
      const diffusion = this.frameMultipleScattering.greaterThan(0.0);
      const isotropicValue = () => (spectral ? vec3(1.0) : float(1.0)).toVar();

      const diffusionPair = (localDirection) => {
        const march = spectral ? spectralVolumeTransmittance : volumeTransmittance;
        const front = march(localDirection, float(1e6));
        const back = march(localDirection.negate(), float(1e6));

        return {
          x: frameIsotropicDiffusion(front.z, back.z, front.w).toVar(),
          y: frameIsotropicDiffusion(back.z, front.z, back.w).toVar(),
        };
      };

      // NOTE Total transmittance of isotropic light from one direction. Diffusion: two-sided. Call in the Fn body.
      const isotropicTransmittance = (localDirection) => {
        const result = isotropicValue();

        If(diffusion, () => {
          result.assign(diffusionPair(localDirection).x);
        }).Else(() => {
          result.assign(totalTransmittance(localDirection, float(1e6)));
        });

        return result;
      };

      const outwardNormal = select(
        length(localPosition).greaterThan(1e-4),
        normalize(mat3(this.frameCameraMatrixWorld).mul(mat3(frameLocalToView).mul(localPosition))),
        vec3(0.0, 1.0, 0.0),
      ).toVar();

      const irradiance = vec3(0.0).toVar();

      If(useLights(frameLights.useAmbientLights), () => {
        irradiance.addAssign(frameAmbientColor);
        irradiance.addAssign(getShIrradianceAt(outwardNormal, frameLightProbe));
      });

      // NOTE Environment lights replace the outward direction: one shadow march for each light, no phase
      If(useLights(frameLights.useEnvironment), () => {
        If(frameEnvironmentCount.greaterThan(0), () => {
          const environment = vec3(0.0).toVar();

          Loop(frameEnvironmentCount, ({ i }) => {
            const direction = worldToLocalDirection.mul(frameEnvironmentDirections.element(i)).toVar();

            environment.addAssign(frameEnvironmentColors.element(i).mul(isotropicTransmittance(direction)));
          });

          irradiance.addAssign(max(environment, vec3(0.0)));
        }).Else(() => {
          if (this.environment) {
            const outwardDirection = worldToLocalDirection.mul(outwardNormal).toVar();

            // NOTE Diffusion: the outward and the inward irradiance, each with its two-sided total. Uniform light then gives E.
            If(diffusion, () => {
              const pair = diffusionPair(outwardDirection);

              irradiance.addAssign(this.environmentIrradiance(outwardNormal).mul(pair.x.mul(0.5)));
              irradiance.addAssign(this.environmentIrradiance(outwardNormal.negate()).mul(pair.y.mul(0.5)));
            }).Else(() => {
              irradiance.addAssign(
                this.environmentIrradiance(outwardNormal).mul(totalTransmittance(outwardDirection, float(1e6))),
              );
            });
          }
        });
      });

      If(useLights(frameLights.useHemisphereLights), () => {
        Loop(frameHemiCount, ({ i }) => {
          const upDirection = worldToLocalDirection.mul(frameHemiDirections.element(i)).toVar();
          const skyTotal = isotropicValue();
          const groundTotal = isotropicValue();

          // NOTE Diffusion: sky and ground are an opposite pair, two-sided totals
          If(diffusion, () => {
            const pair = diffusionPair(upDirection);

            skyTotal.assign(pair.x);
            groundTotal.assign(pair.y);
          }).Else(() => {
            skyTotal.assign(totalTransmittance(upDirection, float(1e6)));
            groundTotal.assign(totalTransmittance(upDirection.negate(), float(1e6)));
          });

          irradiance.addAssign(frameHemiSkyColors.element(i).mul(0.5).mul(skyTotal));
          irradiance.addAssign(frameHemiGroundColors.element(i).mul(0.5).mul(groundTotal));
        });
      });

      // NOTE Point and spot lights have no distance falloff
      Loop(frameLightCount, ({ i }) => {
        const position = frameLightPositions.element(i).toVar();
        const color = frameLightColors.element(i).toVar();
        const spot = frameLightSpots.element(i).toVar();
        const isDirectional = position.w.lessThan(1.5);
        const isSpot = position.w.greaterThan(2.5);
        const enabled = select(
          isDirectional,
          useLights(frameLights.useDirectionalLights),
          select(
            isSpot,
            useLights(frameLights.useSpotLights),
            useLights(frameLights.usePointLights),
          ),
        );
        const spotAttenuation = select(
          isSpot,
          smoothstep(spot.w, color.w, dot(normalize(position.xyz.sub(worldPosition)), spot.xyz)),
          float(1.0),
        ).toVar();

        If(enabled.and(spotAttenuation.greaterThan(0.0)), () => {
          const toLight = frameWorldToLocal
            .mul(vec4(position.xyz, 1.0))
            .xyz.sub(localPosition)
            .toVar();
          const localDirection = select(
            isDirectional,
            worldToLocalDirection.mul(position.xyz),
            toLight,
          );
          const maxDistance = select(isDirectional, float(1e6), length(toLight));
          const lightDirection = select(isDirectional, position.xyz, normalize(position.xyz.sub(worldPosition)));
          const march = spectral ? spectralVolumeTransmittance : volumeTransmittance;
          const shadow = march(localDirection, maxDistance);

          // NOTE Two-sided: diffusion of the slab between the light side and the far side (frameTwoSidedDiffusion)
          If(this.frameTwoSided.greaterThan(0.5), () => {
            const back = march(localDirection.negate(), float(1e6));

            shadow.y.assign(frameTwoSidedDiffusion(shadow.x, shadow.z, shadow.w, back.z));
          });

          const light = spectral
            ? frameSpectralShadowedLight(
                volumeUniforms.framePhase,
                volumeUniforms.framePhaseSpectrum,
                this.frameScatteringOctaves,
                rayDirection,
                lightDirection,
                shadow,
                albedo,
              )
            : frameShadowedLight(
                volumeUniforms.framePhase,
                volumeUniforms.framePhaseSpectrum,
                this.frameScatteringOctaves,
                rayDirection,
                lightDirection,
                shadow.xy.toVar(),
              );

          irradiance.addAssign(color.rgb.mul(light).mul(spotAttenuation));
        });
      });

      const radiance = max(frameScatterColor, albedo.mul(irradiance).mul(1.0 / Math.PI)).add(
        volume.sampleEmission(localPosition, lod),
      );

      // NOTE Premultiplied slice color and alpha. Linear filtering of these values gives transparent edges.
      if (spectral) {
        spectralOutputs.color.assign(vec4(radiance.mul(alpha), alpha.y));
        spectralOutputs.alpha.assign(vec4(alpha.x, alpha.z, 0.0, alpha.y));

        return vec4(0.0);
      }

      return vec4(radiance.mul(alpha), alpha);
    })();
  }
}

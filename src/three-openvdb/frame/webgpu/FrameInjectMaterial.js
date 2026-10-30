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
  getFroxelLod,
  frameNoise,
  frameFullscreenVertex,
  createVolumeUniforms,
  createVolumeNodes,
} from './frameShaderChunks';
import { FrameEnvironmentMaterial } from './FrameEnvironmentMaterial';
import { frameLights } from '../core/frameLights';

// NOTE Lights one volume in each froxel, with a shadow march in this volume. Other volumes do not cast shadows.
// NOTE The renderer draws it one time for each volume, with the uniforms of that volume.
export class FrameInjectMaterial extends FrameEnvironmentMaterial {
  constructor({ froxelUniforms, lightUniforms }) {
    super();

    this.name = 'FrameInjectMaterial';
    this.froxelUniforms = froxelUniforms;
    this.lightUniforms = lightUniforms;
    this.volumeUniforms = createVolumeUniforms();
    this.frameLights = uniform(0, 'int');
    this.frameShadowSteps = uniform(32, 'int');
    this.frameCameraMatrixWorld = uniform(new Three.Matrix4());
    this.mipmaps = false;

    this.vertexNode = frameFullscreenVertex;
    this.fragmentNode = this.createFragmentNode();

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
      this.fragmentNode = this.createFragmentNode();
      this.needsUpdate = true;
    }
  }

  createFragmentNode() {
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
    } = lightUniforms;
    const {
      frameViewToLocal,
      frameLocalToView,
      frameWorldToLocal,
      frameOpacity,
      frameAbsorbance,
      frameScatterColor,
      frameWorldScale,
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

      const subStepCount = float(froxelSubSteps);
      const subStepLength = length(viewFar.sub(viewNear)).div(subStepCount).toVar();
      const lod = getFroxelLod(froxelUniforms, froxel, volume, subStepLength, frameWorldScale);

      // NOTE Pre-integrate the slice along the view ray. Light the visibility-weighted mean position, not the froxel center.
      const transmittance = float(1.0).toVar();
      const visibleWeight = float(0.0).toVar();
      const visibleTSum = float(0.0).toVar();
      const jitter = frameNoise(frameJitter, fragCoord).toVar();

      Loop(froxelSubSteps, ({ i }) => {
        const t = float(i).add(jitter).div(subStepCount).toVar();

        If(t.greaterThanEqual(boxSegment.x).and(t.lessThanEqual(boxSegment.y)), () => {
          const opticalDepth = volume
            .sampleExtinction(mix(localNear, localFar, t), lod)
            .mul(frameOpacity)
            .mul(subStepLength);
          const stepTransmittance = exp(opticalDepth.negate()).toVar();
          const weight = transmittance.mul(float(1.0).sub(stepTransmittance)).toVar();

          visibleWeight.addAssign(weight);
          visibleTSum.addAssign(weight.mul(t));
          transmittance.mulAssign(stepTransmittance);
        });
      });

      const alpha = float(1.0).sub(transmittance).toVar();

      If(visibleWeight.lessThanEqual(0.0).or(alpha.lessThanEqual(1e-5)), () => {
        Discard();
      });

      const localPosition = mix(localNear, localFar, visibleTSum.div(visibleWeight)).toVar();
      const viewPosition = frameLocalToView.mul(vec4(localPosition, 1.0)).xyz;
      const worldPosition = this.frameCameraMatrixWorld.mul(vec4(viewPosition, 1.0)).xyz.toVar();
      const worldToLocalDirection = mat3(frameWorldToLocal);
      const shadowNoise = frameNoise(frameJitter, fragCoord.add(vec2(17.0, 31.0))).toVar();

      // NOTE Shadow march inside this volume only. Call in the Fn body.
      const volumeTransmittance = (localDirection, maxLocalDistance) => {
        const result = float(1.0).toVar();

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

              If(opticalDepth.greaterThan(8.0), () => {
                Break();
              });

              probe.addAssign(direction.mul(localStep));
            });

            result.assign(exp(opticalDepth.negate()));
          });
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

      if (this.environment) {
        If(useLights(frameLights.useEnvironment), () => {
          irradiance.addAssign(
            this.environmentIrradiance(outwardNormal).mul(
              volumeTransmittance(worldToLocalDirection.mul(outwardNormal), float(1e6)),
            ),
          );
        });
      }

      If(useLights(frameLights.useHemisphereLights), () => {
        Loop(frameHemiCount, ({ i }) => {
          const upDirection = worldToLocalDirection.mul(frameHemiDirections.element(i)).toVar();

          irradiance.addAssign(
            frameHemiSkyColors
              .element(i)
              .mul(0.5)
              .mul(volumeTransmittance(upDirection, float(1e6))),
          );
          irradiance.addAssign(
            frameHemiGroundColors
              .element(i)
              .mul(0.5)
              .mul(volumeTransmittance(upDirection.negate(), float(1e6))),
          );
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

          irradiance.addAssign(
            color.rgb.mul(spotAttenuation).mul(volumeTransmittance(localDirection, maxDistance)),
          );
        });
      });

      const albedo = volume.sampleAlbedo(localPosition, lod);
      const radiance = max(frameScatterColor, albedo.mul(irradiance).mul(1.0 / Math.PI)).add(
        volume.sampleEmission(localPosition, lod),
      );

      // NOTE Premultiplied slice color and alpha. Linear filtering of these values gives transparent edges.
      return vec4(radiance.mul(alpha), alpha);
    })();
  }
}

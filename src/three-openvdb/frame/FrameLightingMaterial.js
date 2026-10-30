import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Discard,
  float,
  ivec2,
  vec3,
  vec4,
  uniform,
  texture,
  select,
  mix,
  exp,
  clamp,
  dot,
  length,
  normalize,
  smoothstep,
  getShIrradianceAt,
} from 'three/tsl';
import { frameFragCoord, frameLoad, frameGetFroxel, frameFullscreenVertex } from './frameShaderChunks';
import { FrameEnvironmentMaterial } from './FrameEnvironmentMaterial';

// NOTE Lights each froxel one time from the combined data of all volumes
export class FrameLightingMaterial extends FrameEnvironmentMaterial {
  constructor({ froxelUniforms, lightUniforms }) {
    super();

    this.name = 'FrameLightingMaterial';
    this.froxelUniforms = froxelUniforms;
    this.lightUniforms = lightUniforms;
    this.frameDensityAlbedoMap = texture(new Three.Texture());
    this.frameDensityEmissionMap = texture(new Three.Texture());
    this.frameDensityShadowMap0 = texture(new Three.Texture());
    this.frameDensityShadowMap1 = texture(new Three.Texture());
    this.frameShadowLightCount = uniform(0, 'int');
    this.frameCameraMatrixWorld = uniform(new Three.Matrix4());

    this.vertexNode = frameFullscreenVertex;
    this.fragmentNode = this.createFragmentNode();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }

  createFragmentNode() {
    const { froxelUniforms, lightUniforms } = this;
    const {
      frameAmbientColor,
      frameLightProbe,
      frameHemiSkyColor,
      frameHemiGroundColor,
      frameSkyDirection,
      frameLightCount,
      frameLightPositions,
      frameLightColors,
      frameLightSpots,
    } = lightUniforms;
    const atlasSize = froxelUniforms.froxelAtlasSize;

    return Fn(() => {
      const fragCoord = frameFragCoord(atlasSize).toVar();
      const texel = ivec2(fragCoord).toVar();
      const densityAlbedo = frameLoad(this.frameDensityAlbedoMap, texel, atlasSize).toVar();
      const extinction = densityAlbedo.a.toVar();

      If(extinction.lessThanEqual(0.0), () => {
        Discard();
      });

      const densityEmission = frameLoad(this.frameDensityEmissionMap, texel, atlasSize).toVar();
      const froxel = frameGetFroxel(froxelUniforms, fragCoord);
      const viewNear = froxel.viewNear.toVar();
      const viewFar = froxel.viewFar.toVar();

      // NOTE Spot light angles use the extinction-weighted visible position of all volumes
      const visibleT = clamp(densityEmission.a.div(extinction), 0.0, 1.0);
      const worldPosition = this.frameCameraMatrixWorld
        .mul(vec4(mix(viewNear, viewFar, visibleT), 1.0))
        .xyz.toVar();

      // NOTE Extinction-weighted mean transmittance. Each volume sampled its own visible position.
      const shadow0 = frameLoad(this.frameDensityShadowMap0, texel, atlasSize).div(extinction).toVar();
      const shadow1 = frameLoad(this.frameDensityShadowMap1, texel, atlasSize).div(extinction).toVar();
      const shadowSlots = [shadow0.z, shadow0.w, shadow1.x, shadow1.y, shadow1.z, shadow1.w];

      const skyDirection = normalize(frameSkyDirection).toVar();
      const skyUp = shadow0.x.mul(0.5);
      const skyDown = shadow0.y.mul(0.5);

      const irradiance = vec3(frameAmbientColor).toVar();

      irradiance.addAssign(getShIrradianceAt(skyDirection, frameLightProbe).mul(skyUp));
      irradiance.addAssign(getShIrradianceAt(skyDirection.negate(), frameLightProbe).mul(skyDown));
      irradiance.addAssign(frameHemiSkyColor.mul(skyUp));
      irradiance.addAssign(frameHemiGroundColor.mul(skyDown));

      if (this.environment) {
        irradiance.addAssign(this.environmentIrradiance(skyDirection).mul(skyUp));
        irradiance.addAssign(this.environmentIrradiance(skyDirection.negate()).mul(skyDown));
      }

      // NOTE Point and spot lights have no distance falloff. This is the same as FogVolume.
      Loop(frameLightCount, ({ i }) => {
        const position = frameLightPositions.element(i).toVar();
        const color = frameLightColors.element(i).toVar();
        const spot = frameLightSpots.element(i).toVar();

        let shadow = float(1.0);

        shadowSlots.forEach((slot, index) => {
          shadow = select(i.equal(index), slot, shadow);
        });

        shadow = select(i.lessThan(this.frameShadowLightCount), shadow, float(1.0));

        const spotAttenuation = select(
          position.w.greaterThan(2.5),
          smoothstep(spot.w, color.w, dot(normalize(position.xyz.sub(worldPosition)), spot.xyz)),
          float(1.0),
        );

        irradiance.addAssign(color.rgb.mul(spotAttenuation).mul(shadow));
      });

      const albedo = densityAlbedo.rgb.div(extinction);
      const emission = densityEmission.rgb.div(extinction);
      const radiance = albedo.mul(irradiance).mul(1.0 / Math.PI).add(emission);
      const alpha = float(1.0).sub(exp(extinction.negate().mul(length(viewFar.sub(viewNear)))));

      return vec4(radiance.mul(alpha), alpha);
    })();
  }
}

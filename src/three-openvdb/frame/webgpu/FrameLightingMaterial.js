import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Discard,
  float,
  ivec2,
  vec2,
  vec3,
  vec4,
  int,
  uniform,
  texture,
  property,
  outputStruct,
  select,
  mix,
  exp,
  clamp,
  dot,
  max,
  length,
  normalize,
  mat3,
  smoothstep,
  getShIrradianceAt,
  getDistanceAttenuation,
} from 'three/tsl';
import {
  frameFragCoord,
  frameLoad,
  frameGetFroxel,
  frameTileVertex,
  frameShadowedLight,
  createGridNodes,
  frameSpectralShadowedLight,
  frameSpectralShadowTotal,
  frameUnpackSpectralGroup,
} from './frameShaderChunks.js';
import { frameSpectralGroupCount } from '../core/frameSpectrum.js';
// NOTE Lights each froxel one time from the combined data of all volumes.
// NOTE The environment is added in the density pass, along the outward direction of each volume.
export class FrameLightingMaterial extends Three.NodeMaterial {
  constructor({ froxelUniforms, froxelTileUniforms, froxelAreaUniforms, lightUniforms, gridUniforms, densityShadowUniforms }) {
    super();

    this.name = 'FrameLightingMaterial';
    this.froxelUniforms = froxelUniforms;
    this.lightUniforms = lightUniforms;
    this.gridUniforms = gridUniforms;
    this.densityShadowUniforms = densityShadowUniforms;
    // NOTE frameRenderer.settings.spectral: extinction of each channel (density target 2), and the 3 transmittance
    // targets of each slot group (core/frameSpectrum.js), in group order. Groups from frameSpectralGroups are not read.
    this.frameDensityExtinctionMap = texture(new Three.Texture());
    this.frameSpectralTransmittanceMaps = Array.from(
      { length: frameSpectralGroupCount * 3 },
      () => texture(new Three.Texture()),
    );
    this.frameSpectralGroups = uniform(0, 'int');
    this.frameDensityAlbedoMap = texture(new Three.Texture());
    this.frameDensityEmissionMap = texture(new Three.Texture());
    this.frameDensityShadowMap0 = texture(new Three.Texture());
    this.frameDensityShadowMap1 = texture(new Three.Texture());
    this.frameShadowLightCount = uniform(0, 'int');
    this.frameCameraMatrixWorld = uniform(new Three.Matrix4());
    // NOTE One phase for all volumes, from frameRenderer.settings
    this.framePhase = uniform(new Three.Vector4());
    // NOTE Scattering octaves of frameRenderer.settings (core/framePhase.js). Count 0 is off.
    this.frameScatteringOctaves = uniform(new Three.Vector4());
    // NOTE Environment lights with a shadow slot (0 or 1). Light i has slot frameEnvironmentShadowSlot + i.
    this.frameEnvironmentLightCount = uniform(0, 'int');
    this.frameEnvironmentShadowSlot = uniform(0, 'int');

    // NOTE frameRenderer.settings.spectral: two atlas targets
    this.spectral = false;

    // NOTE Only the froxel area of the volumes. Other froxels have no density.
    this.vertexNode = frameTileVertex(
      froxelTileUniforms,
      froxelAreaUniforms.frameAreaRect,
      froxelAreaUniforms.frameAreaSliceStart,
    );
    this.rebuildNodes();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.rebuildNodes();
      this.needsUpdate = true;
    }
  }

  // NOTE Spectral: atlas target 0 is (color, green alpha), target 1 is (red alpha, blue alpha, 0, green alpha)
  rebuildNodes() {
    if (!this.spectral) {
      this.colorNode = null;
      this.outputNode = null;
      this.fragmentNode = this.createFragmentNode();

      return;
    }

    const lightingColor = property('vec4');
    const lightingAlpha = property('vec4');

    this.fragmentNode = null;
    this.colorNode = this.createSpectralFragmentNode({ color: lightingColor, alpha: lightingAlpha });
    this.outputNode = outputStruct(lightingColor, lightingAlpha);
  }

  // NOTE Spectral lighting. The density pass has no light slots, so the slots are sampled here,
  // at the extinction-weighted visible position of all volumes in the froxel. Albedo and extinction are of each channel.
  createSpectralFragmentNode(outputs) {
    const { froxelUniforms, lightUniforms, densityShadowUniforms } = this;
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
      frameLightFalloffs,
      frameEnvironmentColors,
    } = lightUniforms;
    const grid = createGridNodes(this.gridUniforms);
    const atlasSize = froxelUniforms.froxelAtlasSize;
    const octaves = this.frameScatteringOctaves;

    return Fn(() => {
      const fragCoord = frameFragCoord(atlasSize).toVar();
      const texel = ivec2(fragCoord).toVar();
      const densityAlbedo = frameLoad(this.frameDensityAlbedoMap, texel, atlasSize).toVar();
      const weight = densityAlbedo.a.toVar();

      If(weight.lessThanEqual(0.0), () => {
        Discard();
      });

      const densityEmission = frameLoad(this.frameDensityEmissionMap, texel, atlasSize).toVar();
      const extinction = frameLoad(this.frameDensityExtinctionMap, texel, atlasSize).rgb.toVar();
      const froxel = frameGetFroxel(froxelUniforms, fragCoord);
      const viewNear = froxel.viewNear.toVar();
      const viewFar = froxel.viewFar.toVar();

      const visibleT = clamp(densityEmission.a.div(weight), 0.0, 1.0);
      const worldPosition = this.frameCameraMatrixWorld
        .mul(vec4(mix(viewNear, viewFar, visibleT), 1.0))
        .xyz.toVar();
      const rayDirection = normalize(
        mat3(this.frameCameraMatrixWorld).mul(viewFar.sub(viewNear)),
      ).toVar();
      const albedo = densityAlbedo.rgb.div(max(extinction, vec3(1e-8))).toVar();
      const emission = densityEmission.rgb.div(weight);

      // NOTE Transmittance targets of the slot groups in use. 1.0 outside the grid, with no shadows and for other groups.
      const maps = this.frameSpectralTransmittanceMaps.map(() => vec4(1.0).toVar());

      for (let group = 0; group < frameSpectralGroupCount; group++) {
        const groupMaps = this.frameSpectralTransmittanceMaps.slice(group * 3, group * 3 + 3);

        If(int(group).lessThan(this.frameSpectralGroups), () => {
          const shadows = grid.sampleShadows(groupMaps, worldPosition);

          shadows.forEach((shadow, index) => maps[group * 3 + index].assign(shadow));
        });
      }

      // NOTE Group 0: sky (up, down) and slot 0. Group g: slots 2g - 1 and 2g. Slot entries are (total, direct).
      const groups = Array.from({ length: frameSpectralGroupCount }, (_, group) =>
        frameUnpackSpectralGroup(maps[group * 3], maps[group * 3 + 1], maps[group * 3 + 2]),
      );
      const slotEntry = (slot) => (slot === 0 ? groups[0].b : slot % 2 === 1 ? groups[(slot + 1) / 2].a : groups[slot / 2].b);

      const skyDirection = normalize(frameSkyDirection).toVar();
      const skyUp = frameSpectralShadowTotal(groups[0].a.x, octaves, albedo).mul(0.5).toVar();
      const skyDown = frameSpectralShadowTotal(groups[0].a.y, octaves, albedo).mul(0.5).toVar();

      const irradiance = vec3(frameAmbientColor).toVar();

      irradiance.addAssign(getShIrradianceAt(skyDirection, frameLightProbe).mul(skyUp));
      irradiance.addAssign(getShIrradianceAt(skyDirection.negate(), frameLightProbe).mul(skyDown));
      irradiance.addAssign(frameHemiSkyColor.mul(skyUp));
      irradiance.addAssign(frameHemiGroundColor.mul(skyDown));

      const slots = Array.from({ length: 6 }, (_, slot) => ({
        total: slotEntry(slot).x.toVar(),
        direct: slotEntry(slot).y.toVar(),
      }));

      Loop(frameLightCount, ({ i }) => {
        const position = frameLightPositions.element(i).toVar();
        const color = frameLightColors.element(i).toVar();
        const spot = frameLightSpots.element(i).toVar();
        const falloff = frameLightFalloffs.element(i).toVar();
        const lightVector = position.xyz.sub(worldPosition).toVar();

        // NOTE A light with no shadow slot: no shadow (1.0), then octaves still add their light
        let total = vec3(1.0);
        let direct = vec3(1.0);

        slots.forEach((slot, index) => {
          const useSlot = i.equal(index).and(i.lessThan(this.frameShadowLightCount));

          total = select(useSlot, slot.total, total);
          direct = select(useSlot, slot.direct, direct);
        });

        const spotAttenuation = select(
          position.w.greaterThan(2.5),
          smoothstep(spot.w, color.w, dot(normalize(lightVector), spot.xyz)),
          float(1.0),
        );

        const distanceAttenuation = select(
          position.w.greaterThan(1.5),
          getDistanceAttenuation({
            lightDistance: length(lightVector),
            cutoffDistance: falloff.x,
            decayExponent: falloff.y,
          }),
          float(1.0),
        );

        // NOTE Directional position xyz is the direction to the light
        const light = frameSpectralShadowedLight(
          this.framePhase,
          octaves,
          rayDirection,
          select(position.w.lessThan(1.5), position.xyz, normalize(lightVector)),
          { x: direct.toVar(), y: total.toVar() },
          albedo,
        );

        irradiance.addAssign(color.rgb.mul(light).mul(spotAttenuation).mul(distanceAttenuation));
      });

      // NOTE Dominant directional environment light with a shadow slot. Isotropic, no phase.
      Loop(this.frameEnvironmentLightCount, ({ i }) => {
        const slot = this.frameEnvironmentShadowSlot.add(i).toVar();
        let total = vec3(1.0);

        slots.forEach((value, index) => {
          total = select(slot.equal(index), value.total, total);
        });

        irradiance.addAssign(
          frameEnvironmentColors.element(i).mul(frameSpectralShadowTotal(total.toVar(), octaves, albedo)),
        );
      });

      const radiance = albedo.mul(irradiance).mul(1.0 / Math.PI).add(emission);
      const alpha = vec3(1.0)
        .sub(exp(extinction.negate().mul(length(viewFar.sub(viewNear)))))
        .toVar();

      outputs.color.assign(vec4(radiance.mul(alpha), alpha.y));
      outputs.alpha.assign(vec4(alpha.x, alpha.z, 0.0, alpha.y));

      return vec4(0.0);
    })();
  }

  // NOTE spectralOutputs: { color, alpha } property nodes of the spectral targets. null: one target.
  createFragmentNode(spectralOutputs = null) {
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
      frameLightFalloffs,
      frameEnvironmentColors,
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

      // NOTE Spot light angles and light falloff use the extinction-weighted visible position of all volumes
      const visibleT = clamp(densityEmission.a.div(extinction), 0.0, 1.0);
      const worldPosition = this.frameCameraMatrixWorld
        .mul(vec4(mix(viewNear, viewFar, visibleT), 1.0))
        .xyz.toVar();
      const rayDirection = normalize(
        mat3(this.frameCameraMatrixWorld).mul(viewFar.sub(viewNear)),
      ).toVar();

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

      Loop(frameLightCount, ({ i }) => {
        const position = frameLightPositions.element(i).toVar();
        const color = frameLightColors.element(i).toVar();
        const spot = frameLightSpots.element(i).toVar();
        const falloff = frameLightFalloffs.element(i).toVar();
        const lightVector = position.xyz.sub(worldPosition).toVar();

        let shadow = float(1.0);

        shadowSlots.forEach((slot, index) => {
          shadow = select(i.equal(index), slot, shadow);
        });


        const spotAttenuation = select(
          position.w.greaterThan(2.5),
          smoothstep(spot.w, color.w, dot(normalize(lightVector), spot.xyz)),
          float(1.0),
        );

        const distanceAttenuation = select(
          position.w.greaterThan(1.5),
          getDistanceAttenuation({
            lightDistance: length(lightVector),
            cutoffDistance: falloff.x,
            decayExponent: falloff.y,
          }),
          float(1.0),
        );

        // NOTE Directional position xyz is the direction to the light
        const unshadowed = frameShadowedLight(
          this.framePhase,
          this.frameScatteringOctaves,
          rayDirection,
          select(position.w.lessThan(1.5), position.xyz, normalize(lightVector)),
          vec2(1.0),
        );

        // NOTE A light with a shadow slot: the density pass stored phase * direct + scattered light.
        // A light with no shadow slot: no shadow, then octaves still add their light.
        const lightFactor = select(i.lessThan(this.frameShadowLightCount), shadow, unshadowed);

        irradiance.addAssign(
          color.rgb.mul(lightFactor).mul(spotAttenuation).mul(distanceAttenuation),
        );
      });

      // NOTE Dominant directional environment light with a shadow slot. Isotropic, no phase.
      Loop(this.frameEnvironmentLightCount, ({ i }) => {
        const slot = this.frameEnvironmentShadowSlot.add(i).toVar();
        let shadow = float(1.0);

        shadowSlots.forEach((value, index) => {
          shadow = select(slot.equal(index), value, shadow);
        });

        irradiance.addAssign(frameEnvironmentColors.element(i).mul(shadow));
      });

      const albedo = densityAlbedo.rgb.div(extinction);
      const emission = densityEmission.rgb.div(extinction);
      const radiance = albedo.mul(irradiance).mul(1.0 / Math.PI).add(emission);
      const alpha = float(1.0).sub(exp(extinction.negate().mul(length(viewFar.sub(viewNear)))));

      if (spectralOutputs) {
        spectralOutputs.color.assign(vec4(radiance.mul(alpha), alpha));
        spectralOutputs.alpha.assign(vec4(alpha, alpha, 0.0, alpha));

        return vec4(0.0);
      }

      return vec4(radiance.mul(alpha), alpha);
    })();
  }
}

import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Discard,
  float,
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
} from 'three/tsl';
import {
  frameFragCoord,
  frameGetFroxel,
  getFroxelLod,
  frameNoise,
  frameTileVertex,
  createVolumeUniforms,
  createVolumeNodes,
  createGridNodes,
} from './frameShaderChunks.js';
import { FrameEnvironmentMaterial } from './FrameEnvironmentMaterial.js';

// NOTE Shadow grid data for the density pass. Each volume samples its own visible position.
export const createDensityShadowUniforms = () => ({
  frameTransmittanceMap0: texture(new Three.Texture()),
  frameTransmittanceMap1: texture(new Three.Texture()),
  frameUseShadows: uniform(0, 'int'),
  frameCameraMatrixWorld: uniform(new Three.Matrix4()),
});

// NOTE Writes the extinction and material of one volume into the froxel grid. Lights are added in the lighting pass.
// NOTE The environment is added here, along the outward direction of each volume.
// NOTE All volumes use this material. Pool meshes set the volume uniforms before each draw.
export class FrameDensityMaterial extends FrameEnvironmentMaterial {
  constructor({
    froxelUniforms,
    froxelTileUniforms,
    gridUniforms,
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
      densityShadowUniforms,
      lightUniforms,
    };
    this.mipmaps = false;
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

  rebuildNodes() {
    this.buildNodes();
  }

  buildNodes() {
    const {
      froxelUniforms,
      froxelTileUniforms,
      gridUniforms,
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

      const subStepCount = float(froxelSubSteps);
      const subStepLength = length(viewFar.sub(viewNear)).div(subStepCount).toVar();
      const lod = getFroxelLod(froxelUniforms, froxel, volume, subStepLength, frameWorldScale);

      // NOTE Mean extinction of the slice. The visibility-weighted mean position is the light position in the lighting pass.
      const extinctionSum = float(0.0).toVar();
      const transmittance = float(1.0).toVar();
      const visibleWeight = float(0.0).toVar();
      const visibleTSum = float(0.0).toVar();
      const jitter = frameNoise(frameJitter, fragCoord).toVar();

      Loop(froxelSubSteps, ({ i }) => {
        const t = float(i).add(jitter).div(subStepCount).toVar();

        If(t.greaterThanEqual(boxSegment.x).and(t.lessThanEqual(boxSegment.y)), () => {
          const extinction = volume
            .sampleExtinction(mix(localNear, localFar, t), lod)
            .mul(frameOpacity)
            .toVar();
          const stepTransmittance = exp(extinction.mul(subStepLength).negate()).toVar();
          const weight = transmittance.mul(float(1.0).sub(stepTransmittance)).toVar();

          visibleWeight.addAssign(weight);
          visibleTSum.addAssign(weight.mul(t));
          extinctionSum.addAssign(extinction);
          transmittance.mulAssign(stepTransmittance);
        });
      });

      const extinction = extinctionSum.div(subStepCount).toVar();

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
      const shadow0 = vec4(1.0).toVar();
      const shadow1 = vec4(1.0).toVar();

      If(densityShadowUniforms.frameUseShadows.equal(1), () => {
        const viewPosition = mix(viewNear, viewFar, visibleT);
        const worldPosition = densityShadowUniforms.frameCameraMatrixWorld
          .mul(vec4(viewPosition, 1.0))
          .xyz.toVar();
        const shadows = grid.sampleShadows(
          densityShadowUniforms.frameTransmittanceMap0,
          densityShadowUniforms.frameTransmittanceMap1,
          worldPosition,
        );

        shadow0.assign(shadows.shadow0);
        shadow1.assign(shadows.shadow1);
      });

      // NOTE Environment along the outward direction from the volume center, the same as per-volume lighting.
      // NOTE Its shadow is between the sky down and sky up transmittance of the shadow grid.
      if (this.environment) {
        const skyDirection = normalize(lightUniforms.frameSkyDirection).toVar();
        const outwardDirection = select(
          length(visiblePosition).greaterThan(1e-4),
          normalize(mat3(frameCameraMatrixWorld).mul(mat3(frameLocalToView).mul(visiblePosition))),
          skyDirection,
        ).toVar();
        const environmentShadow = mix(
          shadow0.y,
          shadow0.x,
          dot(outwardDirection, skyDirection).mul(0.5).add(0.5),
        );

        emission.addAssign(
          albedo
            .mul(this.environmentIrradiance(outwardDirection))
            .mul(environmentShadow)
            .mul(1.0 / Math.PI),
        );
      }

      // NOTE Values are weighted by extinction. Additive blending then gives extinction-weighted means.
      densityAlbedo.assign(vec4(albedo.mul(extinction), extinction));
      densityEmission.assign(vec4(emission.mul(extinction), visibleT.mul(extinction)));
      densityShadow0.assign(shadow0.mul(extinction));
      densityShadow1.assign(shadow1.mul(extinction));

      return vec4(0.0);
    })();

    this.outputNode = outputStruct(densityAlbedo, densityEmission, densityShadow0, densityShadow1);
  }
}

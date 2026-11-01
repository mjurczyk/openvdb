import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  Discard,
  float,
  vec2,
  vec3,
  uniform,
  texture,
  screenUV,
  viewportDepthTexture,
  viewportTexture,
  sRGBTransferEOTF,
  sRGBTransferOETF,
  perspectiveDepthToViewZ,
  orthographicDepthToViewZ,
  select,
  clamp,
  floor,
  min,
  mix,
  mod,
  pow,
  vec4,
} from 'three/tsl';
import { frameSample, frameSliceDepth, frameFullscreenVertex } from './frameShaderChunks.js';

const maxSlices = 1024;

// NOTE Marches the froxel slices of each screen pixel and stops at the scene depth.
// NOTE Scene depth comes from the depth buffer of the current render (viewportDepthTexture).
export class FrameIntegrateMaterial extends Three.NodeMaterial {
  constructor({ froxelUniforms }) {
    super();

    this.name = 'FrameIntegrateMaterial';
    this.froxelAtlas = texture(new Three.Texture());
    this.frameCameraNear = uniform(0.1);
    this.frameCameraFar = uniform(1000.0);
    this.frameCameraOrthographic = uniform(0, 'int');
    this.froxelUniforms = froxelUniforms;
    this.srgbBlending = null;

    this.vertexNode = frameFullscreenVertex;
    this.setSrgbBlending(true);

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.transparent = true;
    this.depthTest = false;
    this.depthWrite = false;
  }

  // NOTE WebGLRenderer blended on the sRGB canvas. WebGPURenderer blends in linear space.
  // NOTE sRGB blending reads the scene color and blends in sRGB, the same as WebGLRenderer.
  setSrgbBlending(srgbBlending) {
    if (srgbBlending === this.srgbBlending) {
      return;
    }

    this.srgbBlending = srgbBlending;
    this.fragmentNode = this.createFragmentNode();
    this.needsUpdate = true;

    if (srgbBlending) {
      this.blending = Three.NoBlending;
    } else {
      this.blending = Three.CustomBlending;
      this.blendEquation = Three.AddEquation;
      this.blendSrc = Three.OneFactor;
      this.blendDst = Three.OneMinusSrcAlphaFactor;
      this.blendSrcAlpha = Three.OneFactor;
      this.blendDstAlpha = Three.OneMinusSrcAlphaFactor;
    }
  }

  createFragmentNode() {
    const { froxelUniforms, srgbBlending } = this;
    const { froxelGrid, froxelColumns, froxelRange, froxelAtlasSize } = froxelUniforms;

    // NOTE Empty depth (no geometry) gives an infinite scene depth
    const sceneDepth = Fn((_, builder) => {
      const depth = viewportDepthTexture().x;
      const near = this.frameCameraNear;
      const far = this.frameCameraFar;
      const isEmpty = builder.renderer.reversedDepthBuffer
        ? depth.lessThanEqual(0.0)
        : depth.greaterThanEqual(1.0);
      const viewZ = select(
        this.frameCameraOrthographic.equal(1),
        orthographicDepthToViewZ(depth, near, far),
        perspectiveDepthToViewZ(depth, near, far),
      );

      return select(isEmpty, float(1e20), viewZ.negate());
    });

    return Fn(() => {
      const depth = sceneDepth().toVar();
      const uv = vec2(screenUV.x, float(1.0).sub(screenUV.y));
      const froxelUv = clamp(uv.mul(froxelGrid.xy), vec2(0.5), froxelGrid.xy.sub(0.5)).toVar();
      const sliceCount = froxelGrid.z;

      const radiance = vec3(0.0).toVar();
      const transmittance = float(1.0).toVar();
      const sliceStart = froxelRange.x.toVar();

      Loop(maxSlices, ({ i }) => {
        const slice = float(i);

        If(
          slice
            .greaterThanEqual(sliceCount)
            .or(sliceStart.greaterThanEqual(depth))
            .or(transmittance.lessThan(0.001)),
          () => {
            Break();
          },
        );

        const sliceEnd = frameSliceDepth(froxelUniforms, slice.add(1.0).div(sliceCount)).toVar();
        const coverage = min(sliceEnd, depth).sub(sliceStart).div(sliceEnd.sub(sliceStart));

        const tile = vec2(mod(slice, froxelColumns), floor(slice.div(froxelColumns)));
        const froxel = frameSample(
          this.froxelAtlas,
          tile.mul(froxelGrid.xy).add(froxelUv).div(froxelAtlasSize),
        ).toVar();
        const froxelAlpha = clamp(froxel.a, 0.0, 1.0).toVar();

        // NOTE Froxels store premultiplied slice color and alpha. Scene depth can cut the last slice.
        If(froxelAlpha.greaterThan(0.0), () => {
          const sliceAlpha = select(
            coverage.lessThan(1.0),
            float(1.0).sub(pow(float(1.0).sub(froxelAlpha), coverage)),
            froxelAlpha,
          ).toVar();

          radiance.addAssign(transmittance.mul(froxel.rgb).mul(sliceAlpha.div(froxelAlpha)));
          transmittance.mulAssign(float(1.0).sub(sliceAlpha));
        });

        sliceStart.assign(sliceEnd);
      });

      const alpha = float(1.0).sub(transmittance).toVar();

      If(alpha.lessThanEqual(0.0), () => {
        Discard();
      });

      if (srgbBlending) {
        // NOTE The 8-bit sRGB canvas of WebGLRenderer clamped both colors to 0.0 - 1.0
        const background = viewportTexture().toVar();
        const volumeColor = clamp(sRGBTransferOETF(radiance.div(alpha)), 0.0, 1.0);
        const backgroundColor = clamp(sRGBTransferOETF(background.rgb), 0.0, 1.0);

        return vec4(
          sRGBTransferEOTF(mix(backgroundColor, volumeColor, alpha)),
          alpha.add(background.a.mul(float(1.0).sub(alpha))),
        );
      }

      // NOTE Premultiplied output. The renderer output pass applies tone mapping and color space.
      return vec4(radiance, alpha);
    })();
  }
}

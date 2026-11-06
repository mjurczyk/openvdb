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
  max,
  vec4,
} from 'three/tsl';
import {
  frameSample,
  frameSliceDepth,
  frameFullscreenVertex,
  maxComponent,
} from './frameShaderChunks.js';

const maxSlices = 1024;

// NOTE Marches the froxel slices of each screen pixel and stops at the scene depth.
// NOTE Scene depth comes from the depth buffer of the current render (viewportDepthTexture).
export class FrameIntegrateMaterial extends Three.NodeMaterial {
  constructor({ froxelUniforms }) {
    super();

    this.name = 'FrameIntegrateMaterial';
    this.froxelAtlas = texture(new Three.Texture());
    // NOTE frameRenderer.settings.spectral: second atlas target (red alpha, blue alpha, 0, green alpha)
    this.froxelAlphaAtlas = texture(new Three.Texture());
    this.spectral = false;
    this.frameCameraNear = uniform(0.1);
    this.frameCameraFar = uniform(1000.0);
    this.frameCameraOrthographic = uniform(0, 'int');
    this.froxelUniforms = froxelUniforms;
    this.srgbBlending = null;
    this.srgbClamp = null;

    this.vertexNode = frameFullscreenVertex;
    this.setSrgbBlending(true, true);

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.transparent = true;
    this.depthTest = false;
    this.depthWrite = false;
  }

  // NOTE WebGLRenderer blended on the sRGB canvas. WebGPURenderer blends in linear space.
  // NOTE sRGB blending reads the scene color and blends in sRGB, the same as WebGLRenderer.
  // NOTE srgbClamp: clamp the colors to 0.0 - 1.0. Tone mapping comes after this pass, so clamp only without it.
  setSrgbBlending(srgbBlending, srgbClamp) {
    if (srgbBlending === this.srgbBlending && srgbClamp === this.srgbClamp) {
      return;
    }

    this.srgbBlending = srgbBlending;
    this.srgbClamp = srgbClamp;
    this.updateNodes();
  }

  setSpectral(spectral) {
    if (spectral === this.spectral) {
      return;
    }

    this.spectral = spectral;
    this.updateNodes();
  }

  // NOTE Spectral: transmittance of each channel. Hardware blending has one alpha, so the pass reads the scene color.
  updateNodes() {
    const { srgbBlending, spectral } = this;

    this.fragmentNode = spectral ? this.createSpectralFragmentNode() : this.createFragmentNode();
    this.needsUpdate = true;

    if (srgbBlending || spectral) {
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

  // NOTE The 8-bit sRGB canvas of WebGLRenderer clamped both colors to 0.0 - 1.0 after tone mapping.
  // NOTE With tone mapping, the colors stay HDR. A clamp would cut bright scene color at the volume edges.
  createSrgbColor() {
    const { srgbClamp } = this;

    return (color) =>
      srgbClamp ? clamp(sRGBTransferOETF(color), 0.0, 1.0) : sRGBTransferOETF(color);
  }

  // NOTE Empty depth (no geometry) gives an infinite scene depth
  createSceneDepth() {
    return Fn((_, builder) => {
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
  }

  // NOTE The same march as createFragmentNode, with the alpha of each channel.
  // NOTE Composite: scene color * transmittance + volume color, in sRGB (srgbBlending) or in linear space.
  createSpectralFragmentNode() {
    const { froxelUniforms, srgbBlending } = this;
    const srgbColor = this.createSrgbColor();
    const { froxelGrid, froxelColumns, froxelRange, froxelAtlasSize } = froxelUniforms;
    const sceneDepth = this.createSceneDepth();

    return Fn(() => {
      const depth = sceneDepth().toVar();
      const uv = vec2(screenUV.x, float(1.0).sub(screenUV.y));
      const froxelUv = clamp(uv.mul(froxelGrid.xy), vec2(0.5), froxelGrid.xy.sub(0.5)).toVar();
      const sliceCount = froxelGrid.z;

      const radiance = vec3(0.0).toVar();
      const transmittance = vec3(1.0).toVar();
      const sliceStart = froxelRange.x.toVar();

      Loop(maxSlices, ({ i }) => {
        const slice = float(i);

        If(
          slice
            .greaterThanEqual(sliceCount)
            .or(sliceStart.greaterThanEqual(depth))
            .or(maxComponent(transmittance).lessThan(0.001)),
          () => {
            Break();
          },
        );

        const sliceEnd = frameSliceDepth(froxelUniforms, slice.add(1.0).div(sliceCount)).toVar();
        const coverage = min(sliceEnd, depth).sub(sliceStart).div(sliceEnd.sub(sliceStart)).toVar();

        const tile = vec2(mod(slice, froxelColumns), floor(slice.div(froxelColumns)));
        const atlasUv = tile.mul(froxelGrid.xy).add(froxelUv).div(froxelAtlasSize).toVar();
        const froxel = frameSample(this.froxelAtlas, atlasUv).toVar();
        const froxelAlphas = frameSample(this.froxelAlphaAtlas, atlasUv).toVar();
        const froxelAlpha = clamp(vec3(froxelAlphas.x, froxel.a, froxelAlphas.y), 0.0, 1.0).toVar();

        // NOTE Froxels store premultiplied slice color and alpha of each channel. Scene depth can cut the last slice.
        If(maxComponent(froxelAlpha).greaterThan(0.0), () => {
          const sliceAlpha = select(
            coverage.lessThan(1.0),
            vec3(1.0).sub(pow(vec3(1.0).sub(froxelAlpha), vec3(coverage))),
            froxelAlpha,
          ).toVar();

          radiance.addAssign(
            transmittance.mul(froxel.rgb).mul(sliceAlpha.div(max(froxelAlpha, vec3(1e-6)))),
          );
          transmittance.mulAssign(vec3(1.0).sub(sliceAlpha));
        });

        sliceStart.assign(sliceEnd);
      });

      const alpha = vec3(1.0).sub(transmittance).toVar();

      If(maxComponent(alpha).lessThanEqual(0.0), () => {
        Discard();
      });

      const background = viewportTexture().toVar();

      // NOTE Output alpha uses the green channel
      const outputAlpha = alpha.y.add(background.a.mul(float(1.0).sub(alpha.y)));

      if (srgbBlending) {
        const volumeColor = srgbColor(radiance.div(max(alpha, vec3(1e-6))));
        const backgroundColor = srgbColor(background.rgb);

        return vec4(sRGBTransferEOTF(mix(backgroundColor, volumeColor, alpha)), outputAlpha);
      }

      return vec4(radiance.add(background.rgb.mul(transmittance)), outputAlpha);
    })();
  }

  createFragmentNode() {
    const { froxelUniforms, srgbBlending } = this;
    const { froxelGrid, froxelColumns, froxelRange, froxelAtlasSize } = froxelUniforms;
    const srgbColor = this.createSrgbColor();

    const sceneDepth = this.createSceneDepth();

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
        const background = viewportTexture().toVar();
        const volumeColor = srgbColor(radiance.div(alpha));
        const backgroundColor = srgbColor(background.rgb);

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

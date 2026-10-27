import * as Three from 'three';

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = position.xy * 0.5 + 0.5;

    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  #define FRAME_MAX_SLICES 1024

  uniform sampler2D froxelAtlas;
  uniform vec2 froxelAtlasSize;
  uniform vec3 froxelGrid;
  uniform float froxelColumns;
  uniform vec2 froxelRange;

  uniform sampler2D frameDepthMap;
  uniform float frameCameraNear;
  uniform float frameCameraFar;

  varying vec2 vUv;

  #include <common>
  #include <packing>

  float frameSliceDepth(float t) {
    return froxelRange.x * pow(froxelRange.y / froxelRange.x, t);
  }

  float frameSceneDepth() {
    float depth = texture2D(frameDepthMap, vUv).x;

    #ifdef USE_REVERSED_DEPTH_BUFFER
      bool isEmpty = depth <= 0.0;
    #else
      bool isEmpty = depth >= 1.0;
    #endif

    if (isEmpty) {
      return 1e20;
    }

    return -(isOrthographic
      ? orthographicDepthToViewZ(depth, frameCameraNear, frameCameraFar)
      : perspectiveDepthToViewZ(depth, frameCameraNear, frameCameraFar));
  }

  void main() {
    float sceneDepth = frameSceneDepth();

    vec2 froxelUv = clamp(vUv * froxelGrid.xy, vec2(0.5), froxelGrid.xy - 0.5);
    int sliceCount = int(froxelGrid.z);

    vec3 radiance = vec3(0.0);
    float transmittance = 1.0;
    float sliceStart = froxelRange.x;

    for (int i = 0; i < FRAME_MAX_SLICES; i++) {
      if (i >= sliceCount || sliceStart >= sceneDepth || transmittance < 0.001) {
        break;
      }

      float sliceEnd = frameSliceDepth(float(i + 1) / froxelGrid.z);
      float coverage = (min(sliceEnd, sceneDepth) - sliceStart) / (sliceEnd - sliceStart);

      vec2 tile = vec2(mod(float(i), froxelColumns), floor(float(i) / froxelColumns));
      vec4 froxel = texture2D(froxelAtlas, (tile * froxelGrid.xy + froxelUv) / froxelAtlasSize);

      float froxelAlpha = clamp(froxel.a, 0.0, 1.0);

      // NOTE Froxels store premultiplied slice color and alpha. Scene depth can cut the last slice.
      if (froxelAlpha > 0.0) {
        float sliceAlpha = coverage < 1.0 ? 1.0 - pow(1.0 - froxelAlpha, coverage) : froxelAlpha;

        radiance += transmittance * froxel.rgb * (sliceAlpha / froxelAlpha);
        transmittance *= 1.0 - sliceAlpha;
      }

      sliceStart = sliceEnd;
    }

    float alpha = 1.0 - transmittance;

    if (alpha <= 0.0) {
      discard;
    }

    gl_FragColor = vec4(radiance / alpha, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

export class FrameIntegrateMaterial extends Three.ShaderMaterial {
  name = 'FrameIntegrateMaterial';

  constructor(froxelUniforms) {
    super({
      uniforms: {
        ...froxelUniforms,
        froxelAtlas: { value: null },
        froxelAtlasSize: { value: new Three.Vector2(1.0, 1.0) },
        frameDepthMap: { value: null },
        frameCameraNear: { value: 0.1 },
        frameCameraFar: { value: 1000.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
    });
  }
}

import * as Three from 'three';
import { gridPars } from './frameShaderChunks.js';

// NOTE Upper limit of the castShadowSteps setting
export const frameMaxShadowSteps = 256;

// NOTE Beer shadow map of all volumes for one light, from the world shadow grid (the extinction of all volumes).
// NOTE A fullscreen pass. Each texel marches its light ray through the last grid cascade, with frameShadowSteps samples.
// NOTE The last cascade covers all volumes and does not move with the camera. Then the pass cost is fixed.
// NOTE Texel: (optical depth * first depth, optical depth * last depth, 0, optical depth). Depths are divided by far.
// NOTE Empty texels are 0. Then linear filtering of the map is correct.
// NOTE The camera of each draw (also each cube face) sets frameCameraProjectionInverse and frameCameraWorld.
// NOTE frameRenderer.settings.spectral (FRAME_SPECTRAL): the grid has the extinction of each channel. Two maps, two draws:
// output 0 is the first map with the mean optical depth of the channels, output 1 is (optical depth rgb, 0).
export class FrameVolumeShadowMaterial extends Three.ShaderMaterial {
  constructor(gridUniforms) {
    super({
      name: 'FrameVolumeShadowMaterial',
      uniforms: {
        ...gridUniforms,
        frameShadowDensityMap: { value: null },
        frameShadowSteps: { value: 32 },
        frameCameraProjectionInverse: { value: new Three.Matrix4() },
        frameCameraWorld: { value: new Three.Matrix4() },
        frameShadowOrigin: { value: new Three.Vector3() },
        frameShadowForward: { value: new Three.Vector3(0.0, 0.0, -1.0) },
        frameShadowPerspective: { value: 0 },
        frameShadowFar: { value: 1.0 },
        frameShadowOutput: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vNdc;

        void main() {
          vNdc = position.xy;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;

        ${gridPars}

        #define FRAME_MAX_SHADOW_STEPS ${frameMaxShadowSteps}
        // NOTE Optical depth with transmittance below 1/e^8. More samples do not change the shadow.
        #define FRAME_MAX_OPTICAL_DEPTH 8.0

        uniform sampler2D frameShadowDensityMap;
        uniform int frameShadowSteps;
        uniform mat4 frameCameraProjectionInverse;
        uniform mat4 frameCameraWorld;
        uniform vec3 frameShadowOrigin;
        uniform vec3 frameShadowForward;
        uniform int frameShadowPerspective;
        uniform float frameShadowFar;
        uniform int frameShadowOutput;

        #ifdef FRAME_SPECTRAL
          #define FrameDepth vec3
          #define frameAnyDepth(value) dot(value, vec3(1.0))
          #define frameMinDepth(value) min(value.x, min(value.y, value.z))
          #define frameGridDepth(value) value.rgb
        #else
          #define FrameDepth float
          #define frameAnyDepth(value) value
          #define frameMinDepth(value) value
          #define frameGridDepth(value) value.r
        #endif

        varying vec2 vNdc;

        // NOTE Distance from the light (perspective) or from the camera plane (orthographic)
        float frameShadowDepth(vec3 worldPosition) {
          vec3 offset = worldPosition - frameShadowOrigin;

          return frameShadowPerspective == 1 ? length(offset) : dot(offset, frameShadowForward);
        }

        // NOTE A point on the pixel ray of the light camera
        vec3 frameUnproject(float z) {
          vec4 view = frameCameraProjectionInverse * vec4(vNdc, z, 1.0);

          return (frameCameraWorld * vec4(view.xyz / view.w, 1.0)).xyz;
        }

        void main() {
          vec3 near = frameUnproject(-0.5);
          vec3 direction = normalize(frameUnproject(0.5) - near);
          vec3 cameraWorld = frameCameraWorld[3].xyz;

          // NOTE Perspective rays (spot, point) start at the light. Orthographic rays (directional) start on the camera plane.
          vec3 origin = frameShadowPerspective == 1 ? cameraWorld : near - direction * dot(near - cameraWorld, direction);

          vec4 result = vec4(0.0);

          if (frameGridCount > 0) {
            // NOTE The last cascade covers all volumes
            int cascade = frameGridCount - 1;
            vec3 boxMin = frameGridMin[cascade];
            vec3 boxMax = boxMin + frameGridSize[cascade];
            vec3 tA = (boxMin - origin) / direction;
            vec3 tB = (boxMax - origin) / direction;
            vec3 tMin = min(tA, tB);
            vec3 tMax = max(tA, tB);
            float tStart = max(0.0, max(tMin.x, max(tMin.y, tMin.z)));
            float tEnd = min(tMax.x, min(tMax.y, tMax.z));

            if (tEnd > tStart) {
              int steps = max(frameShadowSteps, 1);
              float stepLength = (tEnd - tStart) / float(steps);
              FrameDepth opticalDepth = FrameDepth(0.0);
              float firstT = -1.0;
              float lastT = -1.0;

              for (int i = 0; i < FRAME_MAX_SHADOW_STEPS; i++) {
                if (i >= steps || frameMinDepth(opticalDepth) > FRAME_MAX_OPTICAL_DEPTH) {
                  break;
                }

                float t = tStart + float(i) * stepLength;
                vec3 samplePosition = origin + direction * (t + stepLength * 0.5);
                FrameDepth extinction = frameGridDepth(frameSampleGrid(frameShadowDensityMap, cascade, frameGridUvw(cascade, samplePosition)));

                if (frameAnyDepth(extinction) > 0.0) {
                  if (firstT < 0.0) {
                    firstT = t;
                  }

                  lastT = t + stepLength;
                  opticalDepth += extinction * stepLength;
                }
              }

              if (frameAnyDepth(opticalDepth) > 0.0) {
                float first = frameShadowDepth(origin + direction * firstT) / frameShadowFar;
                float last = frameShadowDepth(origin + direction * lastT) / frameShadowFar;

                #ifdef FRAME_SPECTRAL
                  float meanDepth = dot(opticalDepth, vec3(1.0 / 3.0));

                  result = frameShadowOutput == 1
                    ? vec4(opticalDepth, 0.0)
                    : vec4(first * meanDepth, last * meanDepth, 0.0, meanDepth);
                #else
                  result = vec4(first * opticalDepth, last * opticalDepth, 0.0, opticalDepth);
                #endif
              }
            }
          }

          gl_FragColor = result;
        }
      `,
      depthTest: false,
      depthWrite: false,
      blending: Three.NoBlending,
    });

    this.spectral = false;
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.defines = spectral ? { FRAME_SPECTRAL: '' } : {};
      this.needsUpdate = true;
    }
  }
}

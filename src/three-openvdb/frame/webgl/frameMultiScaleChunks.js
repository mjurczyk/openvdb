import { frameMaxMultiScaleLevels } from '../core/framePhase.js';

// NOTE multipleScattering 'multi-scale': scattered light of a shadow slot from the grid mips toward the light.
// REF Disney "Deep Scattering" (Kallweit et al. 2017), §4.2: a hierarchical density stencil toward the light.
// NOTE Level k reads the segment from h (2^k - 1) to h (2^(k+1) - 1) toward the light (h: voxel of the last cascade).
// The mean of 5 points (the axis and 4 points at h 2^k around it) is the occluding bulk of that scale.
// The diffusion approximation of the summed bulk gives the scattered light (total - direct).
// The direct light stays the explicit march: coarse levels cannot make hard shadows.
// NOTE Needs gridPars, shadowPars and neuralMipPars. The same as webgpu/frameMultiScaleChunks.js.
export const multiScalePars = `
  #define FRAME_MAX_MULTI_SCALE_LEVELS ${frameMaxMultiScaleLevels}

  uniform int frameMultiScaleLevels;

  // NOTE Two unit vectors at right angles to n (Frisvad). They change smoothly with n, except near -y.
  void frameMultiScaleBasis(vec3 n, out vec3 u, out vec3 v) {
    if (n.y < -0.9999) {
      u = vec3(1.0, 0.0, 0.0);
      v = vec3(0.0, 0.0, 1.0);

      return;
    }

    float a = 1.0 / (1.0 + n.y);
    float b = -n.x * n.z * a;

    u = vec3(1.0 - n.x * n.x * a, -n.x, b);
    v = vec3(b, -n.z, 1.0 - n.z * n.z * a);
  }

  // NOTE Scattered light (total - direct) for each unit of light. direction: unit direction to the light,
  // maxDistance: distance to the light.
  float frameMultiScaleLight(vec3 worldPosition, vec3 direction, float maxDistance) {
    float h = frameNeuralUnit();
    vec3 u;
    vec3 v;
    vec3 depths = vec3(0.0);

    frameMultiScaleBasis(direction, u, v);

    for (int level = 0; level < FRAME_MAX_MULTI_SCALE_LEVELS; level++) {
      float scale = h * exp2(float(level));
      float start = scale - h;
      float segment = min(scale, maxDistance - start);

      if (level >= frameMultiScaleLevels || segment <= 0.0) {
        break;
      }

      vec3 center = worldPosition + direction * (start + 0.5 * segment);
      vec2 bulk = (
        frameNeuralSample(level, center) +
        frameNeuralSample(level, center + u * scale) +
        frameNeuralSample(level, center - u * scale) +
        frameNeuralSample(level, center + v * scale) +
        frameNeuralSample(level, center - v * scale)
      ) * 0.2;

      depths += frameShadowStep(bulk.x, bulk.y) * segment;
    }

    return max(exp(-frameShadowDepth(depths)) - exp(-depths.x), 0.0);
  }
`;

import { Fn, If, float, int, vec3, max, min, exp, select } from 'three/tsl';
import { frameShadowStep, frameShadowDepth } from './frameShaderChunks.js';
import { frameMaxMultiScaleLevels } from '../core/framePhase.js';

// NOTE multipleScattering 'multi-scale': scattered light of a shadow slot from the grid mips toward the light.
// REF Disney "Deep Scattering" (Kallweit et al. 2017), §4.2: a hierarchical density stencil toward the light.
// NOTE Level k reads the segment from h (2^k - 1) to h (2^(k+1) - 1) toward the light (h: voxel of the last cascade).
// The mean of 5 points (the axis and 4 points at h 2^k around it) is the occluding bulk of that scale.
// The diffusion approximation of the summed bulk gives the scattered light (total - direct).
// The direct light stays the explicit march: coarse levels cannot make hard shadows.
// NOTE mipNodes: createNeuralMipNodes (frameNeuralChunks.js). levels: int uniform, multipleScattering: 1 - g uniform.
// The same as webgl/frameMultiScaleChunks.js.
export const createMultiScaleNodes = ({ sampleLevel, unit }, levels, multipleScattering) => {
  // NOTE Scattered light (total - direct) for each unit of light. direction: unit direction to the light,
  // maxDistance: distance to the light.
  const multiScaleLight = Fn(([worldPosition, direction, maxDistance]) => {
    const h = unit().toVar();
    const depths = vec3(0.0).toVar();

    // NOTE Two unit vectors at right angles to the direction (Frisvad). They change smoothly, except near -y.
    const pole = direction.y.lessThan(-0.9999);
    const a = float(1.0)
      .div(max(direction.y.add(1.0), 1e-4))
      .toVar();
    const b = direction.x.negate().mul(direction.z).mul(a).toVar();
    const u = select(
      pole,
      vec3(1.0, 0.0, 0.0),
      vec3(float(1.0).sub(direction.x.mul(direction.x).mul(a)), direction.x.negate(), b),
    ).toVar();
    const v = select(
      pole,
      vec3(0.0, 0.0, 1.0),
      vec3(b, direction.z.negate(), float(1.0).sub(direction.z.mul(direction.z).mul(a))),
    ).toVar();

    for (let level = 0; level < frameMaxMultiScaleLevels; level++) {
      const scale = h.mul(2 ** level).toVar();
      const start = scale.sub(h).toVar();
      const segment = min(scale, maxDistance.sub(start)).toVar();

      If(levels.greaterThan(int(level)).and(segment.greaterThan(0.0)), () => {
        const center = worldPosition.add(direction.mul(start.add(segment.mul(0.5)))).toVar();
        const bulk = sampleLevel(level, center)
          .add(sampleLevel(level, center.add(u.mul(scale))))
          .add(sampleLevel(level, center.sub(u.mul(scale))))
          .add(sampleLevel(level, center.add(v.mul(scale))))
          .add(sampleLevel(level, center.sub(v.mul(scale))))
          .mul(0.2)
          .toVar();

        depths.addAssign(frameShadowStep(bulk.x, bulk.y, multipleScattering).mul(segment));
      });
    }

    return max(
      exp(frameShadowDepth(depths, multipleScattering).negate()).sub(exp(depths.x.negate())),
      0.0,
    );
  }).setLayout({
    name: 'frameMultiScaleLight',
    type: 'float',
    inputs: [
      { name: 'worldPosition', type: 'vec3' },
      { name: 'direction', type: 'vec3' },
      { name: 'maxDistance', type: 'float' },
    ],
  });

  return { multiScaleLight };
};

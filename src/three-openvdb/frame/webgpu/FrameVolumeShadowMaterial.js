import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  float,
  vec3,
  vec4,
  uniform,
  texture,
  varying,
  select,
  min,
  max,
  dot,
  length,
  normalize,
  positionGeometry,
  cameraPosition,
  cameraWorldMatrix,
  cameraProjectionMatrix,
  cameraProjectionMatrixInverse,
} from 'three/tsl';
import { createGridNodes } from './frameShaderChunks.js';

// NOTE Optical depth with transmittance below 1/e^8. More samples do not change the shadow.
const maxOpticalDepth = 8.0;

// NOTE Upper limit of the castShadowSteps setting
export const frameMaxShadowSteps = 256;

// NOTE Ray uniforms of one light shadow camera. The shadow pass and the receivers measure depth with them.
// NOTE Depth is the distance from the light (perspective) or from the camera plane (orthographic).
// NOTE Far is the far plane of the shadow camera. Depths in the map are divided by it, for half float precision.
export const createShadowRayUniforms = () => ({
  frameShadowOrigin: uniform(new Three.Vector3()),
  frameShadowForward: uniform(new Three.Vector3(0.0, 0.0, -1.0)),
  frameShadowPerspective: uniform(0, 'int'),
  frameShadowFar: uniform(1.0),
});

export const frameShadowDepth = (rayUniforms, worldPosition) => {
  const { frameShadowOrigin, frameShadowForward, frameShadowPerspective } = rayUniforms;
  const offset = worldPosition.sub(frameShadowOrigin);

  return select(frameShadowPerspective.equal(1), length(offset), dot(offset, frameShadowForward));
};

// NOTE Beer shadow map of all volumes for one light, from the world shadow grid (the extinction of all volumes).
// NOTE A fullscreen pass. Each texel marches its light ray through the last grid cascade, with frameShadowSteps samples.
// NOTE The last cascade covers all volumes and does not move with the camera. Then the pass cost is fixed.
// NOTE Texel: (optical depth * first depth, optical depth * last depth, 0, optical depth). Depths are divided by far.
// NOTE Empty texels are 0. Then linear filtering of the map is correct.
export class FrameVolumeShadowMaterial extends Three.NodeMaterial {
  constructor({ gridUniforms }, rayUniforms) {
    super();

    this.name = 'FrameVolumeShadowMaterial';
    this.frameShadowDensityMap = texture(new Three.Texture());
    this.frameShadowSteps = uniform(32, 'int');
    this.vertexNode = vec4(positionGeometry.xy, 0.0, 1.0);
    this.fragmentNode = this.createFragmentNode(gridUniforms, rayUniforms);

    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }

  createFragmentNode(gridUniforms, rayUniforms) {
    const grid = createGridNodes(gridUniforms);
    const { frameGridMin, frameGridSize, frameGridCount } = gridUniforms;
    const { frameShadowFar } = rayUniforms;
    const ndc = varying(positionGeometry.xy);

    // NOTE World position of a point on the pixel ray of the current camera
    const unproject = (z) => {
      const view = cameraProjectionMatrixInverse.mul(vec4(ndc, z, 1.0));
      const world = cameraWorldMatrix.mul(vec4(view.xyz.div(view.w), 1.0));

      return world.xyz;
    };

    return Fn(() => {
      // NOTE Two points in the depth range of all backends give the ray direction
      const near = unproject(float(0.25)).toVar();
      const direction = normalize(unproject(float(0.75)).sub(near)).toVar();
      const perspective = cameraProjectionMatrix.element(3).w.lessThan(0.5);

      // NOTE Perspective rays start at the light. Orthographic rays start on the camera plane.
      const origin = select(
        perspective,
        cameraPosition,
        near.sub(direction.mul(dot(near.sub(cameraPosition), direction))),
      ).toVar();

      const opticalDepth = float(0.0).toVar();
      const first = float(0.0).toVar();
      const last = float(0.0).toVar();

      If(frameGridCount.greaterThan(0), () => {
        const cascade = frameGridCount.sub(1).toVar();
        const boxMin = frameGridMin.element(cascade);
        const boxMax = boxMin.add(frameGridSize.element(cascade));
        const inverseDirection = vec3(1.0).div(direction);
        const tA = boxMin.sub(origin).mul(inverseDirection);
        const tB = boxMax.sub(origin).mul(inverseDirection);
        const tMin = min(tA, tB);
        const tMax = max(tA, tB);
        const tStart = max(0.0, max(tMin.x, max(tMin.y, tMin.z))).toVar();
        const tEnd = min(tMax.x, min(tMax.y, tMax.z)).toVar();

        If(tEnd.greaterThan(tStart), () => {
          const steps = max(this.frameShadowSteps, 1);
          const stepLength = tEnd.sub(tStart).div(float(steps)).toVar();
          const firstT = float(-1.0).toVar();
          const lastT = float(-1.0).toVar();

          Loop(steps, ({ i }) => {
            If(opticalDepth.greaterThan(maxOpticalDepth), () => {
              Break();
            });

            const t = tStart.add(float(i).mul(stepLength)).toVar();
            const sample = origin.add(direction.mul(t.add(stepLength.mul(0.5))));
            const extinction = grid
              .sampleGrid(this.frameShadowDensityMap, cascade, grid.gridUvw(cascade, sample))
              .r.toVar();

            If(extinction.greaterThan(0.0), () => {
              If(firstT.lessThan(0.0), () => {
                firstT.assign(t);
              });

              lastT.assign(t.add(stepLength));
              opticalDepth.addAssign(extinction.mul(stepLength));
            });
          });

          If(opticalDepth.greaterThan(0.0), () => {
            first.assign(frameShadowDepth(rayUniforms, origin.add(direction.mul(firstT))).div(frameShadowFar));
            last.assign(frameShadowDepth(rayUniforms, origin.add(direction.mul(lastT))).div(frameShadowFar));
          });
        });
      });

      return vec4(first.mul(opticalDepth), last.mul(opticalDepth), 0.0, opticalDepth);
    })();
  }
}

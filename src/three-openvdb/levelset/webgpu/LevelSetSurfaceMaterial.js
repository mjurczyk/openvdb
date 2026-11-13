import * as Three from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Break,
  float,
  vec2,
  vec3,
  vec4,
  uniform,
  texture3D,
  select,
  abs,
  dot,
  max,
  min,
  positionLocal,
  positionView,
  positionViewDirection,
  modelViewMatrix,
  modelWorldMatrix,
  modelWorldMatrixInverse,
  cameraWorldMatrix,
  cameraPosition,
  cameraProjectionMatrix,
  cameraNear,
  cameraFar,
  viewZToPerspectiveDepth,
  viewZToOrthographicDepth,
  transformNormalToView,
} from 'three/tsl';

// NOTE Upper limit of trace steps for each pixel
const maxSteps = 512;

const maxComponent = (value) => max(value.x, max(value.y, value.z));
const minComponent = (value) => min(value.x, min(value.y, value.z));

// NOTE MeshStandardNodeMaterial that traces the signed distance texture of a LevelSetSurface.
// Back faces of the box start the ray, so the camera can be in the box. Light, shadows and depth use the hit point.
export class LevelSetSurfaceMaterial extends Three.MeshStandardNodeMaterial {
  constructor(parameters) {
    super(parameters);

    this.name = 'LevelSetSurfaceMaterial';
    this.side = Three.BackSide;
    // NOTE Shadow passes start the ray at back faces too
    this.shadowSide = Three.BackSide;

    const placeholder = new Three.Data3DTexture(new Uint8Array([255]), 1, 1, 1);
    placeholder.format = Three.RedFormat;
    placeholder.needsUpdate = true;

    this.distanceMap = texture3D(placeholder);
    this.boxMin = uniform(new Three.Vector3());
    this.boxSize = uniform(new Three.Vector3(1.0, 1.0, 1.0));
    // NOTE World size of one texel on each axis
    this.texelSize = uniform(new Three.Vector3(1.0, 1.0, 1.0));
    this.background = uniform(1.0);

    const { distanceMap, boxMin, boxSize, texelSize, background } = this;

    const sampleDistance = (position) =>
      distanceMap
        .sample(position.sub(boxMin).div(boxSize))
        .level(float(0.0))
        .r.mul(2.0)
        .sub(1.0)
        .mul(background);

    // NOTE positionViewDirection is the camera forward direction for orthographic cameras (directional shadows)
    const rayDirection = Fn(() => {
      const world = cameraWorldMatrix.mul(vec4(positionViewDirection.negate(), 0.0)).xyz;

      return modelWorldMatrixInverse.mul(vec4(world, 0.0)).xyz.normalize();
    })
      .once()()
      .toVar('levelSetRayDirection');

    // NOTE t along the ray from the back face (t = 0) and 1.0 on a hit
    const trace = Fn(() => {
      const origin = positionLocal;
      const direction = rayDirection;
      const inverse = vec3(1.0).div(
        select(abs(direction).lessThan(vec3(1e-6)), vec3(1e-6), direction),
      );
      const enter = maxComponent(
        min(boxMin.sub(origin).mul(inverse), boxMin.add(boxSize).sub(origin).mul(inverse)),
      );
      const camera = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1.0)).xyz;
      const t = max(enter, dot(camera.sub(origin), direction)).toVar();
      const hit = float(0.0).toVar();
      const previousT = t.toVar();
      // NOTE Negative: no sample before the current one
      const previousDistance = float(-1.0).toVar();
      const minStep = minComponent(texelSize).mul(0.25);
      const farStep = minComponent(texelSize).mul(0.5);

      Loop(maxSteps, () => {
        If(t.greaterThan(0.0), () => {
          Break();
        });

        const distance = sampleDistance(origin.add(direction.mul(t))).toVar();

        If(distance.lessThan(0.0), () => {
          // NOTE Secant step between the last sample outside and the first sample inside
          If(previousDistance.greaterThan(0.0), () => {
            t.assign(
              previousT.add(
                t.sub(previousT).mul(previousDistance.div(previousDistance.sub(distance))),
              ),
            );
          });

          hit.assign(1.0);
          Break();
        });

        previousT.assign(t);
        previousDistance.assign(distance);

        // NOTE All 8 texels outside the band: the surface is at least half a texel away
        t.addAssign(
          select(
            distance.greaterThanEqual(background.mul(0.9999)),
            max(distance, farStep),
            max(distance, minStep),
          ),
        );
      });

      return vec2(t, hit);
    })
      .once()()
      .toVar('levelSetTrace');

    const hitLocal = positionLocal.add(rayDirection.mul(trace.x)).toVar('levelSetHitLocal');
    const hitView = modelViewMatrix.mul(vec4(hitLocal, 1.0)).xyz;

    this.hitView = hitView;
    this.maskNode = trace.y.greaterThan(0.5);

    // NOTE With a vertexNode, positionView of the fragment stage is a variable. setupLighting moves it to the hit.
    this.vertexNode = cameraProjectionMatrix.mul(modelViewMatrix.mul(vec4(positionLocal, 1.0)));

    // NOTE Shadow passes use this depth too, with the shadow camera
    this.depthNode = Fn((builder) =>
      builder.camera.isOrthographicCamera
        ? viewZToOrthographicDepth(hitView.z, cameraNear, cameraFar)
        : viewZToPerspectiveDepth(hitView.z, cameraNear, cameraFar),
    )();

    this.receivedShadowPositionNode = modelWorldMatrix.mul(vec4(hitLocal, 1.0)).xyz;

    // NOTE Central differences at one texel. Distance grows outward.
    this.normalNode = Fn(() => {
      const gradient = vec3(
        sampleDistance(hitLocal.add(vec3(texelSize.x, 0.0, 0.0))).sub(
          sampleDistance(hitLocal.sub(vec3(texelSize.x, 0.0, 0.0))),
        ),
        sampleDistance(hitLocal.add(vec3(0.0, texelSize.y, 0.0))).sub(
          sampleDistance(hitLocal.sub(vec3(0.0, texelSize.y, 0.0))),
        ),
        sampleDistance(hitLocal.add(vec3(0.0, 0.0, texelSize.z))).sub(
          sampleDistance(hitLocal.sub(vec3(0.0, 0.0, texelSize.z))),
        ),
      ).div(texelSize);

      return transformNormalToView(gradient.normalize());
    })();
  }

  // NOTE Lights read positionView. The shading point is the hit, not the box face.
  setupLighting(builder) {
    positionView.assign(this.hitView).toStack();

    return super.setupLighting(builder);
  }

  setDistance(texture, bbox, background) {
    const size = bbox.getSize(new Three.Vector3());
    const { width, height, depth } = texture.image;

    this.distanceMap.value = texture;
    this.boxMin.value.copy(bbox.min);
    this.boxSize.value.copy(size);
    this.texelSize.value.set(size.x / width, size.y / height, size.z / depth);
    this.background.value = background;
  }
}

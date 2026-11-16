import * as Three from 'three/webgpu';
import {
  instancedBufferAttribute,
  materialColor,
  max,
  modelViewMatrix,
  uniform,
  vec4,
} from 'three/tsl';
import {
  buildPointData,
  getAttenuatedPointSize,
  getPointDiameter,
  getPointDiscTexture,
} from '../pointsCore.js';

const canvasSize = new Three.Vector2();

// NOTE Round points of a point data grid (WebGPURenderer). size: world diameter. Points are 1 pixel or larger.
// WebGPU points are 1 pixel. An instanced sprite gives any size.
// source: a point data GridDescriptor, or a points grid of WVDBVolumeData. Then call volumeData.attach( points ).
export class VDBPoints extends Three.Sprite {
  isVDBPoints = true;
  cancel = null;
  spacing = 1.0;
  pointCount = 0;

  constructor(source, { maxPoints, size = null, ...materialProps } = {}, onConverted) {
    super(
      new Three.PointsNodeMaterial({
        alphaMap: getPointDiscTexture(),
        alphaTest: 0.5,
        ...materialProps,
        // NOTE sizeNode does the attenuation, with a minimum of 1 pixel. Sprites smaller than a pixel are not drawn.
        sizeAttenuation: false,
      }),
    );

    // NOTE Point diameter in CSS pixels at view depth 1.0
    this.pixelScale = uniform(1.0);

    this.size = size;
    this.onConverted = onConverted;
    // NOTE WVDB points grids only. update() reads it again when a new LOD is in.
    this.pointsSource = source?.isPoints ? source : null;
    this.positionAttribute = null;
    this.colorAttribute = null;
    // NOTE The sprite position is the origin. The points are in local space, so the box of the sprite does not work.
    this.frustumCulled = false;
    // NOTE No points until the build is done
    this.count = 0;

    this.cancel = buildPointData(source, { maxPoints }, (pointData) => {
      this.cancel = null;
      this.setPointData(pointData);
      this.onConverted?.(this);
    });

    this.onBeforeRender = (renderer, scene, camera) => {
      this.updatePixelScale(renderer, camera, this);
    };
  }

  // NOTE The arrays can have space for points that are not in yet (WVDB points grids). count is the number of points in.
  setPointData({ positions, colors, spacing, count }) {
    if (this.positionAttribute?.array === positions) {
      this.updatePoints(count);
    } else {
      this.createPointNodes(positions, colors);
    }

    this.count = count;
    this.pointCount = count;
    this.spacing = spacing;
  }

  // NOTE Same arrays with more points: only the new points go to the GPU.
  // Ranges add up until the next upload, so updates between two renders all upload.
  updatePoints(count) {
    if (count <= this.pointCount) {
      return;
    }

    [this.positionAttribute, this.colorAttribute].filter(Boolean).forEach((attribute) => {
      attribute.addUpdateRange(this.pointCount * 3, (count - this.pointCount) * 3);
      attribute.needsUpdate = true;
    });
  }

  createPointNodes(positions, colors) {
    const { material } = this;

    this.positionAttribute = new Three.InstancedBufferAttribute(positions, 3);
    this.colorAttribute = colors ? new Three.InstancedBufferAttribute(colors, 3) : null;

    const position = instancedBufferAttribute(this.positionAttribute);
    const viewDepth = modelViewMatrix.mul(vec4(position, 1.0)).z.negate();

    material.positionNode = position;
    material.sizeNode = max(this.pixelScale.div(viewDepth), 1.0);
    material.colorNode = this.colorAttribute
      ? vec4(instancedBufferAttribute(this.colorAttribute), 1.0).mul(materialColor)
      : null;
    material.needsUpdate = true;
  }

  // NOTE WVDBVolumeData calls it when more points are in
  update() {
    if (this.pointsSource) {
      this.setPointData(this.pointsSource);
    }
  }

  updatePixelScale(renderer, camera, object) {
    renderer.getSize(canvasSize);

    this.pixelScale.value =
      getAttenuatedPointSize(object, camera, getPointDiameter(this)) * canvasSize.y * 0.5;
  }

  createInstance() {
    return this.applyToInstance(new Three.Sprite());
  }

  // NOTE Makes a sprite show these points. FrameVolume instances use it for each new frame.
  // The count updates before each render, so instances made before the build show the points later.
  applyToInstance(instance) {
    instance.material = this.material;
    instance.frustumCulled = false;
    instance.count = this.count;
    instance.onBeforeRender = (renderer, scene, camera) => {
      instance.count = this.count;
      this.updatePixelScale(renderer, camera, instance);
    };

    return instance;
  }

  dispose() {
    this.cancel?.();
    this.cancel = null;
    this.material.dispose();
  }
}

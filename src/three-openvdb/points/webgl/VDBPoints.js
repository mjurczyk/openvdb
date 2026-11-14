import * as Three from 'three';
import {
  buildPointData,
  getAttenuatedPointSize,
  getPointDiameter,
  getPointDiscTexture,
} from '../pointsCore.js';

// NOTE Round points of a point data grid (WebGLRenderer). size: world diameter. Points are 1 pixel or larger.
export class VDBPoints extends Three.Points {
  isVDBPoints = true;
  cancel = null;
  spacing = 1.0;
  pointCount = 0;

  constructor(source, { maxPoints, size = null, ...materialProps } = {}, onConverted) {
    super(
      new Three.BufferGeometry(),
      new Three.PointsMaterial({
        alphaMap: getPointDiscTexture(),
        alphaTest: 0.5,
        sizeAttenuation: true,
        ...materialProps,
      }),
    );

    this.size = size;
    this.onConverted = onConverted;
    // NOTE No points until the build is done. Instances share the geometry, so they show the points later.
    this.geometry.setAttribute('position', new Three.Float32BufferAttribute(new Float32Array(0), 3));

    this.cancel = buildPointData(source, { maxPoints }, (pointData) => {
      this.cancel = null;
      this.setPointData(pointData);
      this.onConverted?.(this);
    });

    this.onBeforeRender = (renderer, scene, camera) => {
      this.material.size = getAttenuatedPointSize(this, camera, getPointDiameter(this));
    };
  }

  setPointData({ positions, colors, spacing, count }) {
    this.geometry.dispose();
    this.geometry.setAttribute('position', new Three.Float32BufferAttribute(positions, 3));

    if (colors) {
      this.geometry.setAttribute('color', new Three.Float32BufferAttribute(colors, 3));
      this.material.vertexColors = true;
      this.material.needsUpdate = true;
    }

    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();

    this.pointCount = count;
    this.spacing = spacing;
  }

  createInstance() {
    return this.applyToInstance(new Three.Points());
  }

  // NOTE Makes points show these points. FrameVolume instances use it for each new frame.
  applyToInstance(instance) {
    instance.geometry = this.geometry;
    instance.material = this.material;
    instance.onBeforeRender = (renderer, scene, camera) => {
      this.material.size = getAttenuatedPointSize(instance, camera, getPointDiameter(this));
    };

    return instance;
  }

  dispose() {
    this.cancel?.();
    this.cancel = null;
    this.geometry.dispose();
    this.material.dispose();
  }
}

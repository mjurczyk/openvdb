import * as Three from 'three';
import {
  buildPointData,
  getAttenuatedPointSize,
  getPointDiameter,
  getPointDiscTexture,
} from '../pointsCore.js';

// NOTE Round points of a point data grid (WebGLRenderer). size: world diameter. Points are 1 pixel or larger.
// source: a point data GridDescriptor, or a points grid of WVDBVolumeData. Then call volumeData.attach( points ).
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
    // NOTE WVDB points grids only. update() reads it again when a new LOD is in.
    this.pointsSource = source?.isPoints ? source : null;
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

  // NOTE bbox (WVDB points grids): box of all points. The arrays can have space for points that are not in yet.
  setPointData({ positions, colors, spacing, count, bbox }) {
    const { geometry } = this;
    const position = geometry.getAttribute('position');

    if (position.array === positions) {
      // NOTE Same arrays with more points: only the new points go to the GPU.
      // Ranges add up until the next upload, so updates between two renders all upload.
      if (count > this.pointCount) {
        [position, geometry.getAttribute('color')].filter(Boolean).forEach((attribute) => {
          attribute.addUpdateRange(this.pointCount * 3, (count - this.pointCount) * 3);
          attribute.needsUpdate = true;
        });
      }
    } else {
      geometry.dispose();
      geometry.setAttribute('position', new Three.BufferAttribute(positions, 3));

      if (colors) {
        geometry.setAttribute('color', new Three.BufferAttribute(colors, 3));
        this.material.vertexColors = true;
        this.material.needsUpdate = true;
      }
    }

    geometry.setDrawRange(0, count);

    if (bbox) {
      geometry.boundingBox = bbox.clone();
      geometry.boundingSphere = bbox.getBoundingSphere(new Three.Sphere());
    } else {
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }

    this.pointCount = count;
    this.spacing = spacing;
  }

  // NOTE WVDBVolumeData calls it when more points are in
  update() {
    if (this.pointsSource) {
      this.setPointData(this.pointsSource);
    }
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

import * as Three from 'three';
import { FogVolume } from '../index';

const vector2 = new Three.Vector2();
const clearColor = new Three.Color();

let depthRenderTarget;
let depthMaterial;
let depthBuffer;
let depthPacking = 0;
let depthView;
let cachedFrame = -1;
let cachedCamera = null;

export class MeshDistanceMaterial extends Three.MeshBasicMaterial {
  name = 'MeshDistanceMaterial';
  customProgramCacheKey = () => 'MeshDistanceMaterial';

  _uniforms = {};

  constructor(props) {
    super(props);

    this._uniforms = props._uniforms || {};

    this.onBeforeCompile = (shader) => {
      Object.entries(this._uniforms).forEach(([key, value]) => {
        shader.uniforms[key] = value;
      });

      const shaderVaryings = `
        #define DISTANCE

        varying mat4 mModelMatrix;
        varying mat4 mViewMatrix;
        varying mat4 mProjectionMatrix;
        varying mat4 mModelViewMatrix;
      `;

      shader.vertexShader = shader.vertexShader
        .replace(
          `#include <common>`,
          `
            ${shaderVaryings}

            out vec3 vPosition;

            #include <common>
          `
        )
        .replace(
          `#include <worldpos_vertex>`,
          `
            #include <worldpos_vertex>

            vPosition = worldPosition.xyz;

            mModelMatrix = modelMatrix;
            mViewMatrix = viewMatrix;
            mProjectionMatrix = projectionMatrix;
            mModelViewMatrix = modelViewMatrix;
          `
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          `#include <common>`,
          `
            precision highp float;

            in vec3 vPosition;

            uniform float cameraNear;
            uniform float cameraFar;

            ${shaderVaryings}

            #include <packing>
            #include <common>
          `
        )
        .replace(
          `#include <opaque_fragment>`,
          `
            float dist = length(vPosition - cameraPosition);
            dist = (dist - cameraNear) / (cameraFar - cameraNear);
            dist = saturate(dist);
          
            gl_FragColor = packDepthToRGBA(dist);
          `
        )
        .replace('#include <tonemapping_fragment>', '')
        .replace('#include <colorspace_fragment>', '')
        .replace('#include <fog_fragment>', '')
        .replace('#include <premultiplied_alpha_fragment>', '')
        .replace('#include <dithering_fragment>', '');
    };
  }
};

export const getDepthUniforms = () => {
  if (!depthRenderTarget) {
    depthRenderTarget = new Three.WebGLRenderTarget();
    depthRenderTarget.texture.minFilter = Three.NearestFilter;
    depthRenderTarget.texture.magFilter = Three.NearestFilter;
    depthRenderTarget.texture.generateMipmaps = false;
    depthRenderTarget.depthTexture = new Three.DepthTexture();

    depthBuffer = depthRenderTarget.texture;
    depthPacking = 1;

    depthMaterial = new MeshDistanceMaterial({
      _uniforms: {
        cameraPosition: { value: new Three.Vector3(0.0, 0.0, 0.0) },
        cameraNear: { value: 1.0 },
        cameraFar: { value: 1.0 },
      }
    });

    depthView = new Three.Vector4(
      0.1, // NOTE Camera near
      1.0, // NOTE Camera far
      1.0, // NOTE Resolution X
      1.0, // NOTE Resolution Y
    );
  }

  return {
    depthScreenMap: {
      value: depthBuffer,
    },
    depthPacking: {
      value: depthPacking,
    },
    depthView: {
      value: depthView,
    },
  };
};

export const updateFrameDepth = (renderer, scene, camera, geometry, material) => {
  if (!depthBuffer) {
    return;
  }

  material._uniforms.cameraPosition.value.setFromMatrixPosition(camera.matrixWorld);
  material._uniforms.cameraNear.value = camera.near;
  material._uniforms.cameraFar.value = camera.far;

  const currentFrame = renderer?.info?.render?.frame || 0;

  if (currentFrame === cachedFrame && camera === cachedCamera) {
    // NOTE All volumes should have the depth texture already available in this frame
    return;
  }

  depthMaterial._uniforms.cameraPosition.value.setFromMatrixPosition(camera.matrixWorld);
  depthMaterial._uniforms.cameraNear.value = camera.near;
  depthMaterial._uniforms.cameraFar.value = camera.far;

  renderer.getSize(vector2);
  depthRenderTarget.setSize(
    vector2.x,
    vector2.y,
  );

  depthView.x = camera.near;
  depthView.y = camera.far;

  depthView.z = vector2.x;
  depthView.w = vector2.y;

  const volumes = [];

  scene.traverseVisible(child => {
    if (child instanceof FogVolume || child.isFogVolume) {
      child.visible = false;
      volumes.push(child);
    }
  });
  
  // NOTE Empty pixels must unpack to depth 1.0. In r186 packing, red is the high byte, so background colors give wrong depth.
  const background = scene.background;
  const clearAlpha = renderer.getClearAlpha();
  renderer.getClearColor(clearColor);

  scene.background = null;
  scene.overrideMaterial = depthMaterial;
  renderer.setClearColor(0xffffff, 1.0);

  renderer.setRenderTarget(depthRenderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  renderer.setClearColor(clearColor, clearAlpha);
  scene.overrideMaterial = null;
  scene.background = background;

  volumes.forEach(volume => {
    volume.visible = true;
  });

  // NOTE The nested render increases info.render.frame. Keep the new value. Then other fog meshes in this frame use the cached depth.
  cachedCamera = camera;
  cachedFrame = renderer?.info?.render?.frame || 0;
};

import * as Three from 'three';
import {
  froxelPars,
  volumePars,
  gridPars,
  noisePars,
  tileQuadVertexShader,
  createVolumeUniforms,
} from './frameShaderChunks.js';

const fragmentShader = `
  precision highp float;

  layout(location = 0) out highp vec4 frameDensityAlbedo;
  layout(location = 1) out highp vec4 frameDensityEmission;
  layout(location = 2) out highp vec4 frameDensityShadow0;
  layout(location = 3) out highp vec4 frameDensityShadow1;

  ${froxelPars}
  ${volumePars}
  ${gridPars}
  ${noisePars}

  uniform sampler2D frameTransmittanceMap0;
  uniform sampler2D frameTransmittanceMap1;
  uniform bool frameUseShadows;
  uniform mat4 frameCameraMatrixWorld;
  uniform vec3 frameSkyDirection;

  #include <common>
  #include <lights_pars_begin>
  #include <envmap_common_pars_fragment>
  #include <envmap_physical_pars_fragment>

  void main() {
    vec2 tile = floor(gl_FragCoord.xy / froxelGrid.xy);
    float slice = tile.y * froxelColumns + tile.x;
    vec2 uv = (gl_FragCoord.xy - tile * froxelGrid.xy) / froxelGrid.xy;

    float sliceNear = frameSliceDepth(slice / froxelGrid.z);
    float sliceFar = frameSliceDepth((slice + 1.0) / froxelGrid.z);
    vec3 viewNear = frameGetViewPosition(uv, sliceNear);
    vec3 viewFar = frameGetViewPosition(uv, sliceFar);
    vec3 localNear = (frameViewToLocal * vec4(viewNear, 1.0)).xyz;
    vec3 localFar = (frameViewToLocal * vec4(viewFar, 1.0)).xyz;

    vec2 boxSegment = frameBoxSegment(localNear, localFar);

    if (boxSegment.x >= boxSegment.y) {
      discard;
    }

    // NOTE Pick the mip level from the froxel width or the sub-step length, the larger one
    float subStepLength = length(viewFar - viewNear) / float(froxelSubSteps);
    float sliceMiddle = (sliceNear + sliceFar) * 0.5;
    float froxelWidth = length(
      frameGetViewPosition(uv + vec2(1.0 / froxelGrid.x, 0.0), sliceMiddle) -
      frameGetViewPosition(uv, sliceMiddle)
    );
    float lod = frameLod(max(froxelWidth, subStepLength) / frameWorldScale);

    // NOTE Mean extinction of the slice. The visibility-weighted mean position is the light position in the lighting pass.
    float extinctionSum = 0.0;
    float transmittance = 1.0;
    float visibleWeight = 0.0;
    float visibleTSum = 0.0;
    float jitter = frameNoise(gl_FragCoord.xy);

    for (int i = 0; i < froxelSubSteps; i++) {
      float t = (float(i) + jitter) / float(froxelSubSteps);

      if (t < boxSegment.x || t > boxSegment.y) {
        continue;
      }

      float extinction = frameSampleExtinction(mix(localNear, localFar, t), lod) * frameOpacity;
      float stepTransmittance = exp(-extinction * subStepLength);
      float weight = transmittance * (1.0 - stepTransmittance);

      visibleWeight += weight;
      visibleTSum += weight * t;
      extinctionSum += extinction;
      transmittance *= stepTransmittance;
    }

    float extinction = extinctionSum / float(froxelSubSteps);

    if (extinction <= 0.0) {
      discard;
    }

    float visibleT = visibleWeight > 0.0 ? visibleTSum / visibleWeight : 0.5;
    vec3 visiblePosition = mix(localNear, localFar, visibleT);
    vec3 albedo = frameSampleAlbedo(visiblePosition, lod);
    vec3 emission = frameSampleEmission(visiblePosition, lod) + frameScatterColor;

    // NOTE Shadows at the visible position of this volume, not of other volumes in the froxel
    vec4 shadow0 = vec4(1.0);
    vec4 shadow1 = vec4(1.0);

    if (frameUseShadows) {
      vec3 viewPosition = mix(viewNear, viewFar, visibleT);
      vec3 worldPosition = (frameCameraMatrixWorld * vec4(viewPosition, 1.0)).xyz;

      frameSampleShadows(
        frameTransmittanceMap0,
        frameTransmittanceMap1,
        worldPosition,
        shadow0,
        shadow1
      );
    }

    // NOTE Environment along the outward direction from the volume center, the same as per-volume lighting.
    // NOTE Its shadow is between the sky down and sky up transmittance of the shadow grid.
    #if defined( USE_ENVMAP )
      vec3 skyDirection = normalize(frameSkyDirection);
      vec3 outwardDirection = length(visiblePosition) > 1e-4
        ? normalize(mat3(frameCameraMatrixWorld) * (mat3(frameLocalToView) * visiblePosition))
        : skyDirection;
      float environmentShadow = mix(shadow0.y, shadow0.x, dot(outwardDirection, skyDirection) * 0.5 + 0.5);

      // NOTE getIBLIrradiance takes a view-space normal
      emission += albedo * getIBLIrradiance(normalize(mat3(viewMatrix) * outwardDirection)) * environmentShadow * RECIPROCAL_PI;
    #endif

    // NOTE Values are weighted by extinction. Additive blending then gives extinction-weighted means.
    frameDensityAlbedo = vec4(albedo * extinction, extinction);
    frameDensityEmission = vec4(emission * extinction, visibleT * extinction);
    frameDensityShadow0 = shadow0 * extinction;
    frameDensityShadow1 = shadow1 * extinction;
  }
`;

// NOTE Writes the extinction and material of one volume into the froxel grid. Lights are added in the lighting pass.
// NOTE The environment is added here, along the outward direction of each volume.
// NOTE MeshStandardMaterial gives the PMREM environment. The shader is fully replaced. GLSL3 keeps the 4 outputs.
export class FrameDensityMaterial extends Three.MeshStandardMaterial {
  name = 'FrameDensityMaterial';
  customProgramCacheKey = () => 'FrameDensityMaterial';

  constructor(sharedUniforms) {
    super();

    this.frameUniforms = {
      ...sharedUniforms,
      ...createVolumeUniforms(),
      frameRect: { value: new Three.Vector4() },
      frameSliceStart: { value: 0.0 },
    };

    this.glslVersion = Three.GLSL3;
    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;
    this.blending = Three.CustomBlending;
    this.blendEquation = Three.AddEquation;
    this.blendSrc = Three.OneFactor;
    this.blendDst = Three.OneFactor;
    this.blendSrcAlpha = Three.OneFactor;
    this.blendDstAlpha = Three.OneFactor;

    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.frameUniforms);

      shader.vertexShader = tileQuadVertexShader;
      shader.fragmentShader = fragmentShader;
    };
  }
}

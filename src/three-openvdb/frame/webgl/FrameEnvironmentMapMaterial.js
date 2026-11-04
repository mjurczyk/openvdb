import * as Three from 'three';
import {
  frameEnvironmentMapWidth,
  frameEnvironmentMapHeight,
  frameEnvironmentMapRoughness,
} from '../core/frameEnvironment.js';

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  #include <common>
  #include <envmap_common_pars_fragment>

  void main() {
    vec2 uv = gl_FragCoord.xy / vec2(${frameEnvironmentMapWidth}.0, ${frameEnvironmentMapHeight}.0);
    float phi = uv.x * 2.0 * PI;
    float theta = uv.y * PI;
    vec3 direction = vec3(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
    vec3 radiance = vec3(0.0);

    #if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
      radiance = textureLod(envMap, envMapRotation * direction, roughnessToMip(${frameEnvironmentMapRoughness})).rgb;
    #endif

    gl_FragColor = vec4(radiance, uv.y);
  }
`;

// NOTE Small lat-long map of the scene environment, for the environment lights (core/frameEnvironment.js).
// NOTE RGB is radiance, A is the v coordinate. The direction is the same as getEnvironmentMapDirection().
// NOTE MeshStandardMaterial gives the PMREM environment. The shader is fully replaced.
export class FrameEnvironmentMapMaterial extends Three.MeshStandardMaterial {
  name = 'FrameEnvironmentMapMaterial';
  customProgramCacheKey = () => 'FrameEnvironmentMapMaterial';

  constructor() {
    super();

    this.depthTest = false;
    this.depthWrite = false;
    this.side = Three.DoubleSide;
    this.blending = Three.NoBlending;

    this.onBeforeCompile = (shader) => {
      shader.vertexShader = vertexShader;
      shader.fragmentShader = fragmentShader;
    };
  }
}

import * as Three from 'three/webgpu';
import { Fn, vec2, vec3, vec4, sin, cos } from 'three/tsl';
import { frameFragCoord, frameFullscreenVertex } from './frameShaderChunks.js';
import { FrameEnvironmentMaterial } from './FrameEnvironmentMaterial.js';
import {
  frameEnvironmentMapWidth,
  frameEnvironmentMapHeight,
  frameEnvironmentMapRoughness,
} from '../core/frameEnvironment.js';

const mapSize = vec2(frameEnvironmentMapWidth, frameEnvironmentMapHeight);

// NOTE Small lat-long map of the scene environment, for the environment lights (core/frameEnvironment.js).
// NOTE RGB is radiance, A is the v coordinate. The direction is the same as getEnvironmentMapDirection().
export class FrameEnvironmentMapMaterial extends FrameEnvironmentMaterial {
  constructor() {
    super();

    this.name = 'FrameEnvironmentMapMaterial';
    this.vertexNode = frameFullscreenVertex;
    this.fragmentNode = this.createFragmentNode();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.blending = Three.NoBlending;
  }

  createFragmentNode() {
    return Fn(() => {
      const uv = frameFragCoord(mapSize).div(mapSize).toVar();
      const phi = uv.x.mul(2.0 * Math.PI);
      const theta = uv.y.mul(Math.PI);
      const direction = vec3(sin(theta).mul(cos(phi)), cos(theta), sin(theta).mul(sin(phi)));

      if (!this.environment) {
        return vec4(0.0, 0.0, 0.0, uv.y);
      }

      return vec4(this.environmentRadiance(direction, frameEnvironmentMapRoughness), uv.y);
    })();
  }
}

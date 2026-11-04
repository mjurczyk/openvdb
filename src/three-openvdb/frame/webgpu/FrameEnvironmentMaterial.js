import * as Three from 'three/webgpu';
import { float, pmremTexture, materialEnvIntensity } from 'three/tsl';

// NOTE Base of the passes that read the scene environment.
// The PMREM node needs a texture, so a new or removed environment builds the shader again.
export class FrameEnvironmentMaterial extends Three.NodeMaterial {
  environment = null;
  environmentNodes = [];

  constructor() {
    super();

    // NOTE No own envMap. Then the PMREM rotation and intensity uniforms read the pass scene values.
    this.envMap = null;
  }

  // NOTE Subclasses return the fragment node. Call environmentIrradiance() in it.
  createFragmentNode() {
    return null;
  }

  // NOTE Builds the shader nodes again. Subclasses with other output nodes override it.
  rebuildNodes() {
    this.fragmentNode = this.createFragmentNode();
  }

  setEnvironment(environment) {
    const hasEnvironment = !!environment;

    if (hasEnvironment !== !!this.environment) {
      this.environment = environment;
      this.environmentNodes = [];
      this.rebuildNodes();
      this.needsUpdate = true;
    } else if (hasEnvironment && this.environment !== environment) {
      this.environment = environment;
      this.environmentNodes.forEach((node) => {
        node.value = environment;
      });
    }
  }

  // NOTE Radiance of the PMREM environment at the roughness. Rotation is from the pass scene, intensity is not applied.
  environmentRadiance(direction, roughness) {
    const node = pmremTexture(this.environment, direction, float(roughness));

    this.environmentNodes.push(node);

    return node;
  }

  // NOTE Diffuse irradiance of the PMREM environment, the same as three.js IBL irradiance
  environmentIrradiance(direction) {
    return this.environmentRadiance(direction, 1.0).mul(Math.PI).mul(materialEnvIntensity);
  }
}

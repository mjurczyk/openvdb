import { LevelSetSurfaceCore } from '../LevelSetSurfaceCore.js';
import {
  LevelSetSurfaceMaterial,
  LevelSetDepthMaterial,
  LevelSetDistanceMaterial,
  createLevelSetUniforms,
} from './LevelSetSurfaceMaterial.js';

// NOTE Surface of a level set, traced on the GPU in the box of the grid (WebGLRenderer).
// source: a level set GridDescriptor, or a level set grid of WVDBVolumeData. Then call volumeData.attach( surface ).
// Material props (color, roughness, metalness) go to a MeshStandardMaterial.
export class LevelSetSurface extends LevelSetSurfaceCore {
  constructor(source, { resolution, ...materialProps } = {}, onConverted) {
    const uniforms = createLevelSetUniforms();

    super(
      source,
      new LevelSetSurfaceMaterial(materialProps, uniforms),
      { resolution },
      onConverted,
    );

    // NOTE Shadow maps trace the same surface
    this.customDepthMaterial = new LevelSetDepthMaterial(uniforms);
    this.customDistanceMaterial = new LevelSetDistanceMaterial(uniforms);
  }

  createInstance() {
    const instance = super.createInstance();

    instance.customDepthMaterial = this.customDepthMaterial;
    instance.customDistanceMaterial = this.customDistanceMaterial;

    return instance;
  }

  dispose() {
    super.dispose();
    this.customDepthMaterial.dispose();
    this.customDistanceMaterial.dispose();
  }
}

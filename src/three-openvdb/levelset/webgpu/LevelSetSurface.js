import { LevelSetSurfaceCore } from '../LevelSetSurfaceCore.js';
import { LevelSetSurfaceMaterial } from './LevelSetSurfaceMaterial.js';

// NOTE Surface of a level set, traced on the GPU in the box of the grid (WebGPURenderer).
// source: a level set GridDescriptor, or a level set grid of WVDBVolumeData. Then call volumeData.attach( surface ).
// Material props (color, roughness, metalness) go to a MeshStandardNodeMaterial.
export class LevelSetSurface extends LevelSetSurfaceCore {
  constructor(source, { resolution, ...materialProps } = {}, onConverted) {
    super(source, new LevelSetSurfaceMaterial(materialProps), { resolution }, onConverted);
  }
}

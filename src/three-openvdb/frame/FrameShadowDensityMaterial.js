import * as Three from 'three/webgpu';
import { Fn, If, Discard, vec4, uniform, max } from 'three/tsl';
import {
  frameFragCoord,
  frameTileVertex,
  createVolumeUniforms,
  createVolumeNodes,
  createGridNodes,
} from './frameShaderChunks';

// NOTE Writes the extinction of one volume into one cascade of the world-space shadow grid.
// NOTE All volumes use this material. Pool meshes set the volume uniforms before each draw.
export class FrameShadowDensityMaterial extends Three.NodeMaterial {
  constructor({ gridUniforms, gridTileUniforms }) {
    super();

    this.name = 'FrameShadowDensityMaterial';
    this.volumeUniforms = createVolumeUniforms();
    this.frameRect = uniform(new Three.Vector4());
    this.frameSliceStart = uniform(0.0);

    this.frameUniforms = { gridUniforms, gridTileUniforms };
    this.mipmaps = false;
    this.vertexNode = frameTileVertex(gridTileUniforms, this.frameRect, this.frameSliceStart);
    this.fragmentNode = this.createFragmentNode();

    this.side = Three.DoubleSide;
    this.forceSinglePass = true;
    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;
    this.blending = Three.CustomBlending;
    this.blendEquation = Three.AddEquation;
    this.blendSrc = Three.OneFactor;
    this.blendDst = Three.OneFactor;
    this.blendSrcAlpha = Three.OneFactor;
    this.blendDstAlpha = Three.OneFactor;
  }

  // NOTE Mip sampling is in the shader only when a volume uses mipmaps
  setMipmaps(mipmaps) {
    if (mipmaps !== this.mipmaps) {
      this.mipmaps = mipmaps;
      this.fragmentNode = this.createFragmentNode();
      this.needsUpdate = true;
    }
  }

  createFragmentNode() {
    const { gridUniforms, gridTileUniforms } = this.frameUniforms;
    const volume = createVolumeNodes(this.volumeUniforms, this.mipmaps);
    const grid = createGridNodes(gridUniforms);
    const { frameWorldToLocal, frameAbsorbance, frameWorldScale } = this.volumeUniforms;
    const { frameGridMin, frameGridSize, frameGridVoxel, frameGridCount } = gridUniforms;

    return Fn(() => {
      const cell = grid.getGridCell(frameFragCoord(gridTileUniforms.frameTargetSize));
      const cascade = cell.cascade.toVar();

      If(cascade.greaterThanEqual(frameGridCount), () => {
        Discard();
      });

      const worldPosition = frameGridMin
        .element(cascade)
        .add(cell.gridUvw.mul(frameGridSize.element(cascade)));
      const localPosition = frameWorldToLocal.mul(vec4(worldPosition, 1.0)).xyz.toVar();

      If(volume.insideBox(localPosition).not(), () => {
        Discard();
      });

      // NOTE Absorbance scales the shadow of this volume, not its look from the camera
      const voxel = frameGridVoxel.element(cascade);
      const lod = volume.getLod(max(voxel.x, max(voxel.y, voxel.z)).div(frameWorldScale));
      const extinction = volume.sampleExtinction(localPosition, lod).mul(frameAbsorbance).toVar();

      If(extinction.lessThanEqual(0.0), () => {
        Discard();
      });

      return vec4(extinction, 0.0, 0.0, 0.0);
    })();
  }
}

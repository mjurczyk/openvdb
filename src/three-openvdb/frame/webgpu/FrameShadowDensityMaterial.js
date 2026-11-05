import * as Three from 'three/webgpu';
import { Fn, If, Discard, float, vec4, uniform, property, outputStruct, clamp, max } from 'three/tsl';
import {
  frameFragCoord,
  frameTileVertex,
  createVolumeUniforms,
  createVolumeNodes,
  createGridNodes,
  frameShadowAbsorption,
} from './frameShaderChunks.js';

// NOTE Writes the extinction and absorption of one volume into one cascade of the world-space shadow grid.
// NOTE Absorption limits multiple scattering in the shadow marches. Dark volumes keep sharp shadows.
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
    // NOTE frameRenderer.settings.spectral: two targets, (extinction rgb, 0) and (absorption rgb, 0)
    this.spectral = false;
    this.vertexNode = frameTileVertex(gridTileUniforms, this.frameRect, this.frameSliceStart);
    this.rebuildNodes();

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
      this.rebuildNodes();
      this.needsUpdate = true;
    }
  }

  setSpectral(spectral) {
    if (spectral !== this.spectral) {
      this.spectral = spectral;
      this.rebuildNodes();
      this.needsUpdate = true;
    }
  }

  rebuildNodes() {
    if (!this.spectral) {
      this.colorNode = null;
      this.outputNode = null;
      this.fragmentNode = this.createFragmentNode();

      return;
    }

    const extinction = property('vec4');
    const absorption = property('vec4');

    this.fragmentNode = null;
    this.colorNode = this.createFragmentNode({ extinction, absorption });
    this.outputNode = outputStruct(extinction, absorption);
  }

  // NOTE spectralOutputs: { extinction, absorption } property nodes of the spectral targets. null: one target.
  createFragmentNode(spectralOutputs = null) {
    const { gridUniforms, gridTileUniforms } = this.frameUniforms;
    const volume = createVolumeNodes(this.volumeUniforms, this.mipmaps);
    const grid = createGridNodes(gridUniforms);
    const { frameWorldToLocal, frameAbsorbance, frameWorldScale, frameExtinctionSpectrum } =
      this.volumeUniforms;
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

      if (spectralOutputs) {
        // NOTE Extinction and absorption of each channel. Absorption is the part that the albedo of the channel does not scatter.
        const spectralExtinction = frameExtinctionSpectrum.mul(extinction).toVar();
        const albedo = clamp(volume.sampleAlbedo(localPosition, lod), 0.0, 1.0);

        spectralOutputs.extinction.assign(vec4(spectralExtinction, 0.0));
        spectralOutputs.absorption.assign(vec4(spectralExtinction.mul(float(1.0).sub(albedo)), 0.0));

        return vec4(0.0);
      }

      return vec4(
        extinction,
        frameShadowAbsorption(extinction, volume.sampleAlbedo(localPosition, lod)),
        0.0,
        0.0,
      );
    })();
  }
}

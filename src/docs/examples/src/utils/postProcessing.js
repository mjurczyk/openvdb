import * as Three from 'three';
import * as ThreeWebGPU from 'three/webgpu';
import { pass, texture3D } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { lut3D } from 'three/examples/jsm/tsl/display/Lut3DNode.js';
import { pixelationPass } from 'three/examples/jsm/tsl/display/PixelationPassNode.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { LUTPass } from 'three/examples/jsm/postprocessing/LUTPass.js';
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// NOTE Built-in three post-processing: EffectComposer (WebGLRenderer) or RenderPipeline (WebGPURenderer).
// NOTE Older three releases name RenderPipeline PostProcessing.
const RenderPipeline = ThreeWebGPU.RenderPipeline ?? ThreeWebGPU.PostProcessing;

const bloomStrength = 0.5;
const bloomRadius = 0.4;
const bloomThreshold = 0.8;
const lutSize = 32;
const pixelSize = 4;

// NOTE A warm grade without a LUT file: 30% less saturation, more red, less blue
const createLut = () => {
  const data = new Uint8Array(lutSize * lutSize * lutSize * 4);

  for (let b = 0; b < lutSize; b++) {
    for (let g = 0; g < lutSize; g++) {
      for (let r = 0; r < lutSize; r++) {
        const index = (r + g * lutSize + b * lutSize * lutSize) * 4;
        const color = [r, g, b].map((value) => value / (lutSize - 1));
        const luminance = 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
        const tint = [1.1, 1.0, 0.85];

        color.forEach((value, channel) => {
          const graded = (value * 0.7 + luminance * 0.3) * tint[channel];

          data[index + channel] = Three.MathUtils.clamp(graded, 0.0, 1.0) * 255.0;
        });

        data[index + 3] = 255;
      }
    }
  }

  const lut = new Three.Data3DTexture(data, lutSize, lutSize, lutSize);

  lut.format = Three.RGBAFormat;
  lut.minFilter = Three.LinearFilter;
  lut.magFilter = Three.LinearFilter;
  lut.wrapS = Three.ClampToEdgeWrapping;
  lut.wrapT = Three.ClampToEdgeWrapping;
  lut.wrapR = Three.ClampToEdgeWrapping;
  lut.unpackAlignment = 1;
  lut.needsUpdate = true;

  return lut;
};

let pipeline = null;
let pipelineMode = 'off';

const createPipeline = (renderer, scene, camera, mode) => {
  if (renderer.isWebGLRenderer) {
    const composer = new EffectComposer(renderer);
    const lut = mode === 'lut' ? createLut() : null;

    // NOTE The pixelated pass renders the scene itself
    composer.addPass(mode === 'pixel' ? new RenderPixelatedPass(pixelSize, scene, camera) : new RenderPass(scene, camera));

    if (mode === 'bloom') {
      composer.addPass(
        new UnrealBloomPass(new Three.Vector2(window.innerWidth, window.innerHeight), bloomStrength, bloomRadius, bloomThreshold),
      );
    }

    composer.addPass(new OutputPass());

    // NOTE The LUT grades the display colors, after the output pass
    if (lut) {
      composer.addPass(new LUTPass({ lut }));
    }

    return {
      render: () => composer.render(),
      setSize: (width, height) => composer.setSize(width, height),
      dispose: () => {
        composer.dispose();
        lut?.dispose();
      },
    };
  }

  const lut = mode === 'lut' ? createLut() : null;
  const scenePass = mode === 'pixel' ? pixelationPass(scene, camera, pixelSize) : pass(scene, camera);
  const sceneColor = mode === 'pixel' ? scenePass : scenePass.getTextureNode('output');
  let outputNode = sceneColor;

  if (mode === 'bloom') {
    outputNode = sceneColor.add(bloom(sceneColor, bloomStrength, bloomRadius, bloomThreshold));
  }

  const renderPipeline = new RenderPipeline(renderer);

  // NOTE The LUT grades the display colors, after tone mapping and the output color space
  if (lut) {
    renderPipeline.outputColorTransform = false;
    outputNode = lut3D(sceneColor.renderOutput(), texture3D(lut), lutSize, 1.0);
  }

  renderPipeline.outputNode = outputNode;

  return {
    render: () => renderPipeline.render(),
    setSize: () => {},
    dispose: () => {
      renderPipeline.dispose();
      scenePass.dispose();
      lut?.dispose();
    },
  };
};

// NOTE 'off' renders without post-processing. 'output' has only the scene pass and the output pass.
export const setPostProcessing = (renderer, scene, camera, mode) => {
  if (mode === pipelineMode) {
    return;
  }

  pipeline?.dispose();
  pipeline = mode === 'off' ? null : createPipeline(renderer, scene, camera, mode);
  pipelineMode = mode;
};

export const renderWithPostProcessing = (renderer, scene, camera) => {
  if (pipeline) {
    pipeline.render();
  } else {
    renderer.render(scene, camera);
  }
};

export const resizePostProcessing = (width, height) => {
  pipeline?.setSize(width, height);
};

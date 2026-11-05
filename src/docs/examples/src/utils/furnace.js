import * as Three from 'three';

// NOTE White furnace test. A uniform environment of radiance L is the background and the environment.
// A volume with albedo 1 must then have radiance L everywhere: it is not visible. The readout gives volume / L.
// L is 0.5, so values up to 2 L are not clipped by the 8-bit sRGB output.
export const furnaceEnvironment = 'furnace';
export const furnaceRadiance = 0.5;

let furnaceActive = false;

export const setFurnaceActive = (active) => {
  furnaceActive = active;
};

export const createFurnaceMap = () => {
  const width = 64;
  const height = 32;
  const data = new Float32Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    data.set([furnaceRadiance, furnaceRadiance, furnaceRadiance, 1.0], i * 4);
  }

  const map = new Three.DataTexture(data, width, height, Three.RGBAFormat, Three.FloatType);

  map.mapping = Three.EquirectangularReflectionMapping;
  map.colorSpace = Three.LinearSRGBColorSpace;
  map.magFilter = Three.LinearFilter;
  map.minFilter = Three.LinearFilter;
  map.needsUpdate = true;

  return map;
};

// NOTE The readout copies 9x9 pixels of the canvas after a render, in the same task. Then the WebGPU canvas texture is still valid.
const sampleSize = 9;
const sampleCanvas = document.createElement('canvas');
sampleCanvas.width = sampleSize;
sampleCanvas.height = sampleSize;
const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });

const srgbToLinear = (value) => {
  const c = value / 255.0;

  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

// NOTE Mean linear RGB of the 9x9 pixels at (x, y), in canvas pixels
const sampleMean = (canvas, x, y) => {
  sampleContext.clearRect(0, 0, sampleSize, sampleSize);
  sampleContext.drawImage(canvas, x, y, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);

  const { data } = sampleContext.getImageData(0, 0, sampleSize, sampleSize);
  const mean = [0.0, 0.0, 0.0];

  for (let i = 0; i < sampleSize * sampleSize; i++) {
    for (let c = 0; c < 3; c++) {
      mean[c] += srgbToLinear(data[i * 4 + c]) / (sampleSize * sampleSize);
    }
  }

  return mean;
};

const format = (values) => values.map((value) => value.toFixed(3)).join(', ');

let lastReadout = 0;

// NOTE Call after renderer.render. Logs about one time each second when the furnace environment is shown.
export const readFurnace = (renderer) => {
  const now = performance.now();

  if (!furnaceActive || now - lastReadout < 1000) {
    return;
  }

  lastReadout = now;

  const canvas = renderer.domElement;
  const center = sampleMean(canvas, Math.floor(canvas.width / 2 - sampleSize / 2), Math.floor(canvas.height / 2 - sampleSize / 2));
  const corner = sampleMean(canvas, 0, 0);
  const ratio = center.map((value) => value / furnaceRadiance);

  console.log(
    `[Furnace] L ${furnaceRadiance} | background (corner) ${format(corner)} | volume (center) ${format(center)} | volume / L ${format(ratio)}`,
  );
};

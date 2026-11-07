import { frameRenderer } from 'three-openvdb';
import { isLoading } from './loading';

// NOTE The examples start with the full froxel grid on every device. When the frames stay slow, at most one froxel for
// each 2 x 2 canvas pixels (settings.pixelsPerFroxel), one time. Desktops and phones that draw the volumes fast keep
// the full grid. 25 fps and not 30: Safari can hold a page at 30 fps (Low Power Mode).
const slowFrameMs = 1000.0 / 25.0;
const sampleFrames = 20;
const frameTimes = new Float32Array(sampleFrames);
const sorted = new Float32Array(sampleFrames);
let frameCount = 0;
let lastTime = null;
let capped = false;

// NOTE Call once in each frame. A value set by hand (above 0) is kept. Automated browsers (navigator.webdriver, the
// validation tests) keep the full grid, so their pictures don't depend on the speed of the machine.
export const updateFroxelCap = () => {
  if (capped || navigator.webdriver || frameRenderer.settings.pixelsPerFroxel > 0) {
    return;
  }

  // NOTE While an asset loads (a WVDB sequence, a custom VDB), slow frames come from the loading: they don't count
  if (isLoading()) {
    frameCount = 0;
    lastTime = null;

    return;
  }

  const now = performance.now();
  const delta = lastTime === null ? null : now - lastTime;

  lastTime = now;

  // NOTE A frame over a second is a hidden tab or a long task on the main thread, not the drawing
  if (delta === null || delta > 1000.0) {
    return;
  }

  frameTimes[frameCount % sampleFrames] = delta;
  frameCount++;

  if (frameCount < sampleFrames) {
    return;
  }

  sorted.set(frameTimes);
  sorted.sort();

  if (sorted[sampleFrames / 2] > slowFrameMs) {
    frameRenderer.settings.pixelsPerFroxel = 2;
    capped = true;
  }
};

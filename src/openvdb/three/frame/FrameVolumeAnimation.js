import * as Three from 'three';

// NOTE FrameVolume parameters. A value set here applies to all frames, also to new frames.
const sharedParams = [
  'baseColor',
  'scatterColor',
  'extinction',
  'densityScale',
  'densityCutoff',
  'absorbance',
  'opacity',
  'emissiveIntensity',
  'temperatureRange',
  'wrap3D',
  'lights',
  'shadowSteps',
];

const applyParam = (frame, key, value) => {
  if (frame[key] instanceof Three.Color) {
    frame[key].set(value);
  } else if (frame[key] instanceof Three.Vector2) {
    frame[key].fromArray(value);
  } else {
    frame[key] = value;
  }
};

export class FrameVolumeAnimation extends Three.Group {
  isFrameVolumeAnimation = true;

  frames = [];
  loadedFrames = 0;
  totalFrames = 0;
  bbox = new Three.Box3();

  fps = 24.0;
  loop = true;
  playing = false;
  disposed = false;

  params = {};
  currentFrame = 0;
  time = 0.0;

  get frame() {
    return this.currentFrame;
  }

  set frame(index) {
    this.currentFrame = Three.MathUtils.clamp(
      Math.round(index),
      0,
      Math.max(0, this.frames.length - 1),
    );

    this.frames.forEach((frame, frameIndex) => {
      frame.visible = frameIndex === this.currentFrame;
    });
  }

  addFrame(frame) {
    Object.entries(this.params).forEach(([key, value]) => applyParam(frame, key, value));

    frame.visible = this.frames.length === this.currentFrame;

    this.frames.push(frame);
    this.add(frame);
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  stop() {
    this.playing = false;
    this.time = 0.0;
    this.frame = 0;
  }

  // NOTE Delta is in seconds. Playback starts after all frames are converted.
  update(delta) {
    const count = this.loadedFrames;

    if (!this.playing || count < 2 || count < this.totalFrames) {
      return;
    }

    this.time += delta * this.fps;

    const steps = Math.floor(this.time);

    if (steps < 1) {
      return;
    }

    this.time -= steps;

    let next = this.currentFrame + steps;

    if (next >= count) {
      if (this.loop) {
        next %= count;
      } else {
        next = count - 1;
        this.playing = false;
      }
    }

    this.frame = next;
  }

  dispose() {
    this.disposed = true;
    this.playing = false;

    this.frames.forEach((frame) => {
      this.remove(frame);
      frame.dispose();
    });

    this.frames = [];
    this.loadedFrames = 0;
  }
}

sharedParams.forEach((key) => {
  Object.defineProperty(FrameVolumeAnimation.prototype, key, {
    get() {
      return key in this.params ? this.params[key] : this.frames[0]?.[key];
    },
    set(value) {
      this.params[key] = value;
      this.frames.forEach((frame) => applyParam(frame, key, value));
    },
  });
});

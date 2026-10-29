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

// NOTE Moves the playback by delta seconds. Returns the new frame index, or -1 for no change.
// Playback starts after all frames are converted.
const advance = (playback, delta, count, totalFrames) => {
  if (!playback.playing || count < 2 || count < totalFrames) {
    return -1;
  }

  playback.time += delta * playback.fps;

  const steps = Math.floor(playback.time);

  if (steps < 1) {
    return -1;
  }

  playback.time -= steps;

  let next = playback.currentFrame + steps;

  if (next >= count) {
    if (playback.loop) {
      next %= count;
    } else {
      next = count - 1;
      playback.playing = false;
    }
  }

  return next;
};

const clampFrame = (index, count) =>
  Three.MathUtils.clamp(Math.round(index), 0, Math.max(0, count - 1));

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
    this.currentFrame = clampFrame(index, this.frames.length);

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
    const next = advance(this, delta, this.loadedFrames, this.totalFrames);

    if (next !== -1) {
      this.frame = next;
    }
  }

  // NOTE A player of the same frames, with no new textures.
  // Own frame, time, fps, loop and props. Call after onLoad.
  createInstance(props) {
    return new FrameVolumeAnimationInstance(this, props);
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

// NOTE Plays the frames of a FrameVolumeAnimation with one FrameVolume instance.
// The instance shows the textures of the current frame.
// Frames that load later are used too. Dispose the animation after its instances.
export class FrameVolumeAnimationInstance extends Three.Group {
  isFrameVolumeAnimationInstance = true;

  playing = false;
  currentFrame = 0;
  time = 0.0;

  constructor(animation, props = {}) {
    super();

    if (animation.frames.length === 0) {
      throw new Error(
        'FrameVolumeAnimation.createInstance: the animation has no frames. Call it after onLoad.'
      );
    }

    this.animation = animation;
    this.fps = animation.fps;
    this.loop = animation.loop;
    this.volume = animation.frames[0].createInstance(props);
    this.add(this.volume);
  }

  get loadedFrames() {
    return this.animation.loadedFrames;
  }

  get totalFrames() {
    return this.animation.totalFrames;
  }

  get frame() {
    return this.currentFrame;
  }

  set frame(index) {
    const { frames } = this.animation;
    this.currentFrame = clampFrame(index, frames.length);
    this.volume.setSource(frames[this.currentFrame]);
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
    const next = advance(this, delta, this.loadedFrames, this.totalFrames);

    if (next !== -1) {
      this.frame = next;
    }
  }

  // NOTE The animation keeps its textures
  dispose() {
    this.playing = false;
    this.remove(this.volume);
    this.volume.dispose();
  }
}

sharedParams.forEach((key) => {
  Object.defineProperty(FrameVolumeAnimationInstance.prototype, key, {
    get() {
      return this.volume[key];
    },
    set(value) {
      applyParam(this.volume, key, value);
    },
  });

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

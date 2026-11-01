// NOTE Three.js-style loader for .wvdb sequences. Each file is one FrameVolume frame.
// Frames load in LOD passes: LOD 0 of all frames, then LOD 1 of all frames, and so on.
// Each pass requests only the first bytes of each file, up to the end of that LOD.
// The animation can play after the first pass.
import * as Three from 'three';
import { FrameVolume } from '../frame/core/FrameVolume.js';
import { FrameVolumeAnimation } from '../frame/core/FrameVolumeAnimation.js';
import { WVDBReader } from './WVDBReader.js';
import { WVDBVolumeData } from './WVDBLoader.js';

// NOTE These options are grid names, same as VDBAnimationLoader
const gridOptions = ['emissiveGrid', 'baseColorGrid', 'maskGrid'];

class WVDBAnimationLoader extends Three.Loader {
  options = {};
  maxLod = Infinity;
  // NOTE Files that load at the same time in each pass. HTTP/2 sends all requests on one connection.
  concurrency = Infinity;

  constructor(manager) {
    super(manager);
  }

  // NOTE FrameVolume props. All frames use the same props.
  // emissiveGrid, baseColorGrid and maskGrid are grid names. emissiveScale also scales the emission grid.
  setOptions(options) {
    this.options = { ...options };

    return this;
  }

  setMaxLod(maxLod) {
    this.maxLod = maxLod;

    return this;
  }

  setConcurrency(concurrency) {
    this.concurrency = Math.max(1, concurrency);

    return this;
  }

  // NOTE Returns the animation at once. onLoad runs when all frames show LOD 0.
  // onProgress({ lod, loadedFrames, totalFrames }) runs when a frame gets a LOD.
  load(urls, onLoad, onProgress, onError) {
    const animation = new FrameVolumeAnimation();
    animation.totalFrames = urls.length;

    const readers = urls.map(
      () => new WVDBReader({ maxLod: this.maxLod, scales: this.getScales() })
    );

    this.loadFrames(animation, urls, readers, onLoad, onProgress).catch((error) => {
      // NOTE One failed file stops all downloads
      readers.forEach((reader) => reader.cancel());

      if (animation.disposed) {
        return;
      }

      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }
    });

    return animation;
  }

  // NOTE The emission grid divides by emissiveScale, same as FrameVolume
  getScales() {
    const { emissiveGrid, emissiveScale = 1.0 } = this.options;

    return typeof emissiveGrid === 'string' ? { [emissiveGrid]: emissiveScale } : {};
  }

  async loadFrames(animation, urls, readers, onLoad, onProgress) {
    const volumeData = readers.map((reader) => new WVDBVolumeData(reader));
    const frames = new Array(urls.length);

    let addedFrames = 0;
    const lodFrames = [];

    const stopIfDisposed = () => {
      if (animation.disposed) {
        readers.forEach((reader) => reader.cancel());
      }

      return animation.disposed;
    };

    const reportLod = (lod) => {
      lodFrames[lod] = (lodFrames[lod] || 0) + 1;

      if (onProgress) {
        onProgress({ lod, loadedFrames: lodFrames[lod], totalFrames: urls.length });
      }
    };

    // NOTE Runs task(index) for all frames in file order, concurrency files at a time
    const runPass = async (task) => {
      let next = 0;

      const run = async () => {
        while (next < urls.length && !stopIfDisposed()) {
          await task(next++);
        }
      };

      await Promise.all(Array.from({ length: Math.min(this.concurrency, urls.length) }, run));
    };

    const onUpdate = (index) => () => {
      if (!stopIfDisposed()) {
        volumeData[index].updateTextures();
      }
    };

    // NOTE Frames are added in file order. A frame can arrive before the frames before it.
    const addFrames = () => {
      while (addedFrames < frames.length && frames[addedFrames]) {
        animation.addFrame(frames[addedFrames]);
        addedFrames++;
        animation.loadedFrames = addedFrames;
      }
    };

    await runPass(async (index) => {
      await readers[index].loadLods(urls[index], 0, {
        onHeader: () => volumeData[index].readGrids(),
        onUpdate: onUpdate(index),
      });

      if (stopIfDisposed()) {
        return;
      }

      frames[index] = this.createFrame(volumeData[index], animation);
      addFrames();
      reportLod(0);
    });

    if (stopIfDisposed()) {
      return;
    }

    if (onLoad) {
      onLoad(animation);
    }

    const finalLod = Math.max(0, ...readers.map(({ finalLod }) => finalLod));

    for (let lod = 1; lod <= finalLod; lod++) {
      await runPass(async (index) => {
        if (readers[index].finalLod < lod) {
          return;
        }

        await readers[index].loadLods(urls[index], lod, { onUpdate: onUpdate(index) });

        if (!stopIfDisposed()) {
          reportLod(lod);
        }
      });

      if (stopIfDisposed()) {
        return;
      }
    }
  }

  createFrame(volumeData, animation) {
    const { grids } = volumeData;
    const props = { ...this.options };

    gridOptions.forEach((key) => {
      const grid = typeof props[key] === 'string' ? grids[props[key]] : null;

      delete props[key];

      if (grid) {
        props[key] = grid;
      }
    });

    const auxGrids = gridOptions.map((key) => props[key]).filter(Boolean);
    const densityGrid =
      (grids.density && !auxGrids.includes(grids.density) && grids.density) ||
      Object.values(grids).find((grid) => !grid.isColor && !auxGrids.includes(grid));

    // NOTE A file with no density grid keeps its place in the sequence. One empty texel shows nothing.
    if (!densityGrid) {
      return new FrameVolume(new Uint8Array(1), { resolution: 1 });
    }

    gridOptions.forEach((key) => {
      if (props[key]) {
        props[key] = props[key].data;
      }
    });

    if (!densityGrid.bbox.isEmpty()) {
      animation.bbox.union(densityGrid.bbox);
    }

    return volumeData.attach(
      new FrameVolume(densityGrid.data, {
        ...props,
        resolution: densityGrid.resolution,
        bbox: densityGrid.bbox,
      })
    );
  }
}

export { WVDBAnimationLoader };

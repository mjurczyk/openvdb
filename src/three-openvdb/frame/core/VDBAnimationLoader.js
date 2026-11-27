// NOTE Three.js-style loader for VDB sequences. Each VDB is one FrameVolume frame.
import * as Three from 'three';
import { OpenVDBReader, GridDescriptor } from 'openvdb';
import { FrameVolume } from './FrameVolume.js';
import { FrameVolumeAnimation } from './FrameVolumeAnimation.js';

// NOTE These options are grid names. Each frame has different grid objects.
const gridOptions = ['emissiveGrid', 'baseColorGrid', 'maskGrid'];

const findGrid = (vdb, name) => Object.values(vdb.grids).find((grid) => grid.gridName === name);

const fetchVDB = async (url, signal) => {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Could not load ${url} (${response.status}).`);
  }

  return new Uint8Array(await response.arrayBuffer());
};

const readVDB = async (source, readOptions) => {
  const vdb = new OpenVDBReader();

  try {
    await vdb.read(source, readOptions);
  } catch (error) {
    console.error({ error });
    throw new Error('VDB could not be parsed.', { cause: error });
  }

  return vdb;
};

// NOTE Empty grids store an inverted box. The world transform makes it very large. Do not use it.
const isEmptyGrid = (grid) => {
  const {
    file_voxel_count: voxelCount,
    file_bbox_min: min,
    file_bbox_max: max,
  } = grid.metadata || {};

  if (voxelCount && Number(voxelCount.value) === 0) {
    return true;
  }

  return (
    !!min &&
    !!max &&
    (min.value.x > max.value.x || min.value.y > max.value.y || min.value.z > max.value.z)
  );
};

class VDBAnimationLoader extends Three.Loader {
  options = {};

  constructor(manager) {
    super(manager);
  }

  // NOTE FrameVolume props. All frames use the same props.
  setOptions(options) {
    this.options = { ...options };

    return this;
  }

  // NOTE Returns the animation immediately. Frames are added while they are converted.
  load(urls, onLoad, onProgress, onError) {
    const animation = new FrameVolumeAnimation();
    animation.totalFrames = urls.length;

    this.loadFrames(animation, urls, onProgress)
      .then(() => {
        if (onLoad && !animation.disposed) {
          onLoad(animation);
        }
      })
      .catch((error) => {
        if (onError) {
          onError(error);
        } else {
          console.error(error);
        }
      });

    return animation;
  }

  // NOTE All files download at the same time. Until the box is known, only the file bytes stay.
  async loadFrames(animation, urls, onProgress) {
    const sources = new Array(urls.length);
    const abortController = new AbortController();

    try {
      await Promise.all(
        urls.map(async (url, index) => {
          const source = await fetchVDB(url, abortController.signal);

          // NOTE Stops the other downloads
          if (animation.disposed) {
            abortController.abort();
            return;
          }

          // NOTE The box needs only the tree topology. The full parse is just before the conversion.
          const topology = await readVDB(source, { topologyOnly: true });

          this.addToBox(animation, topology);

          sources[index] = source;
        }),
      );
    } catch (error) {
      // NOTE One failed file stops all downloads
      abortController.abort();

      if (animation.disposed) {
        return;
      }

      throw error;
    }

    if (animation.disposed) {
      return;
    }

    for (let index = 0; index < sources.length; index++) {
      const vdb = await readVDB(sources[index]);

      sources[index] = null;

      await new Promise((resolve) => {
        animation.addFrame(
          new FrameVolume(vdb, { ...this.getFrameProps(vdb), bbox: animation.bbox }, resolve),
        );
      });

      if (animation.disposed) {
        return;
      }

      animation.loadedFrames++;

      if (onProgress) {
        onProgress({ loadedFrames: animation.loadedFrames, totalFrames: animation.totalFrames });
      }
    }
  }

  getFrameProps(vdb) {
    const props = { ...this.options };

    gridOptions.forEach((key) => {
      if (typeof props[key] === 'string') {
        props[key] = findGrid(vdb, props[key]);
      }
    });

    return props;
  }

  // NOTE All frames use the union of the non-empty density grid boxes
  addToBox(animation, vdb) {
    const props = this.getFrameProps(vdb);
    const auxGrids = gridOptions.map((key) => props[key]);

    Object.values(vdb.grids)
      .filter(
        (grid) => grid instanceof GridDescriptor && !auxGrids.includes(grid) && !isEmptyGrid(grid),
      )
      .forEach((grid) => {
        animation.bbox.union(new Three.Box3().set(...grid.getPreciseWorldBbox()));
      });
  }
}

export { VDBAnimationLoader };

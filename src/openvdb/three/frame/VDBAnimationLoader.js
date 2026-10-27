// NOTE Three.js-style loader for VDB sequences. Each VDB is one FrameVolume frame.
import * as Three from 'three';
import { loadVDB } from '../../index';
import { GridDescriptor } from '../../core/GridDescriptor';
import { FrameVolume } from './FrameVolume';
import { FrameVolumeAnimation } from './FrameVolumeAnimation';

// NOTE These options are grid names. Each frame has different grid objects.
const gridOptions = ['emissiveGrid', 'baseColorGrid', 'maskGrid'];

const findGrid = (vdb, name) => Object.values(vdb.grids).find((grid) => grid.gridName === name);

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

  async loadFrames(animation, urls, onProgress) {
    const vdbs = [];

    for (const url of urls) {
      vdbs.push(await loadVDB(url));

      if (animation.disposed) {
        return;
      }
    }

    const frameProps = vdbs.map((vdb) => {
      const props = { ...this.options };

      gridOptions.forEach((key) => {
        if (typeof props[key] === 'string') {
          props[key] = findGrid(vdb, props[key]);
        }
      });

      return props;
    });

    // NOTE All frames use the union of the non-empty density grid boxes
    vdbs.forEach((vdb, index) => {
      const auxGrids = gridOptions.map((key) => frameProps[index][key]);

      Object.values(vdb.grids)
        .filter(
          (grid) =>
            grid instanceof GridDescriptor && !auxGrids.includes(grid) && !isEmptyGrid(grid),
        )
        .forEach((grid) => {
          animation.bbox.union(new Three.Box3().set(...grid.getPreciseWorldBbox()));
        });
    });

    for (let index = 0; index < vdbs.length; index++) {
      await new Promise((resolve) => {
        animation.addFrame(
          new FrameVolume(vdbs[index], { ...frameProps[index], bbox: animation.bbox }, resolve),
        );
      });

      // NOTE The textures keep the converted data. Release the parsed VDB.
      vdbs[index] = null;

      if (animation.disposed) {
        return;
      }

      animation.loadedFrames++;

      if (onProgress) {
        onProgress({ loadedFrames: animation.loadedFrames, totalFrames: animation.totalFrames });
      }
    }
  }
}

export { VDBAnimationLoader };

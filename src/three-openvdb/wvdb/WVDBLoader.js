// NOTE Three.js-style .wvdb loader. Grid data works as raw data for FrameVolume.
import * as Three from 'three';
import { WVDBReader } from './WVDBReader.js';
import { getDensityStats } from '../frame/core/FrameVolume.js';

const textureKeys = ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'];

// NOTE Each LOD has its own size. A texture with a new size needs new GPU memory, so it is disposed first.
const updateTexture = (texture, { data, dimensions: [width, height, depth] }) => {
  const { image } = texture;
  const resized = image.width !== width || image.height !== height || image.depth !== depth;

  texture.image = { data, width, height, depth };

  if (resized) {
    texture.dispose();
  }

  texture.needsUpdate = true;
};

export class WVDBVolumeData {
  grids = {};
  bindings = [];

  constructor(reader) {
    this.reader = reader;
  }

  // NOTE Grid data always shows the newest LOD
  readGrids() {
    Object.values(this.reader.grids).forEach((grid) => {
      const { name, class: gridClass, channels, bbox } = grid;

      this.grids[name] = {
        name,
        isLevelSet: gridClass === 'level set',
        // NOTE Vector grids give RGBA colour (baseColorGrid), scalar grids give density
        isColor: channels === 3,
        // NOTE Grids of a file with only empty grids have no box
        bbox: bbox
          ? new Three.Box3(new Three.Vector3(...bbox[0]), new Three.Vector3(...bbox[1]))
          : new Three.Box3(),
        get data() {
          return grid.data;
        },
        get dimensions() {
          return grid.dimensions;
        },
        // NOTE Level sets only: signed distance texels of the newest LOD, else null. See levelSetDistance.js.
        get distance() {
          return grid.distance;
        },
        background: grid.background,
        // NOTE Texels on the longest side
        get resolution() {
          return Math.max(...grid.dimensions);
        },
        get lod() {
          return grid.lod;
        },
        // NOTE Baked stats of the finest LOD, or null. Then the stats come from the data of each LOD.
        get densityStats() {
          return grid.densityStats;
        },
        source: grid,
      };
    });
  }

  get lod() {
    return Math.min(...Object.values(this.reader.grids).map(({ lod }) => lod));
  }

  get lods() {
    return this.reader.finalLod + 1;
  }

  get done() {
    return this.reader.done;
  }

  // NOTE Textures of attached FrameVolumes follow their grid when a new LOD arrives.
  // Baked density stats keep the mean density the same for all LODs.
  attach(object) {
    const grids = Object.values(this.grids);

    // NOTE LevelSetMesh builds again from its grid when the distance changes
    if (object.levelSetSource) {
      const grid = grids.find((entry) => entry === object.levelSetSource);

      if (grid) {
        this.bindings.push({ object, grid: grid.source, distance: grid.distance });
      }

      return object;
    }

    object.volumes.forEach((holder) => {
      textureKeys.forEach((key) => {
        const texture = holder[key];
        const grid = texture && grids.find(({ data }) => data === texture.image?.data);

        if (grid) {
          // NOTE Instances use the stats of their source
          const statsHolder = key === 'densityMap3D' && !object.source ? holder : null;

          if (statsHolder && grid.densityStats) {
            statsHolder.densityStats = grid.densityStats;
          }

          this.bindings.push({ object, texture, grid: grid.source, statsHolder });
        }
      });
    });

    object.updateMeanDensity();

    return object;
  }

  detach(object) {
    this.bindings = this.bindings.filter((binding) => binding.object !== object);
  }

  updateTextures() {
    const changed = new Set();

    this.bindings.forEach((binding) => {
      const { object, texture, grid, statsHolder } = binding;

      if (!texture) {
        if (binding.distance !== grid.distance) {
          binding.distance = grid.distance;
          object.update();
        }

        return;
      }

      if (texture.image.data !== grid.data) {
        updateTexture(texture, grid);

        // NOTE Files with no baked stats: stats of the new LOD
        if (statsHolder && !grid.densityStats) {
          statsHolder.densityStats = getDensityStats(grid.data);
          changed.add(object);
        }
      }
    });

    changed.forEach((object) => object.updateMeanDensity());
  }

  dispose() {
    this.reader.cancel();
    this.bindings = [];
  }
}

class WVDBLoader extends Three.Loader {
  maxLod = Infinity;
  scales = {};

  constructor(manager) {
    super(manager);
  }

  // NOTE The loader stops the download after this LOD
  setMaxLod(maxLod) {
    this.maxLod = maxLod;

    return this;
  }

  // NOTE { gridName: scale }. Grid values divide by scale before they become density.
  // Use the emissiveScale of the volume for emission grids, for example { flames: 6.0 }.
  setGridScales(scales) {
    this.scales = { ...scales };

    return this;
  }

  // NOTE onLoad runs when all grids show LOD 0. Each next LOD replaces the previous one.
  // onProgress runs on each update after onLoad.
  load(url, onLoad, onProgress, onError) {
    const reader = new WVDBReader({ maxLod: this.maxLod, scales: this.scales });
    const volumeData = new WVDBVolumeData(reader);

    let loaded = false;

    reader
      .load(url, {
        onHeader: () => volumeData.readGrids(),
        onUpdate: (event) => {
          volumeData.updateTextures();

          if (!loaded && volumeData.lod >= 0) {
            loaded = true;

            if (onLoad) {
              onLoad(volumeData);
            }
          }

          if (loaded && onProgress) {
            onProgress({
              lod: event.lod,
              lods: volumeData.lods,
              lodComplete: event.lodComplete,
              done: event.done,
              bytesLoaded: reader.bytesLoaded,
              bytesTotal: reader.bytesTotal,
            });
          }
        },
      })
      .catch((error) => {
        if (reader.cancelled) {
          return;
        }

        if (onError) {
          onError(error);
        } else {
          console.error(error);
        }
      });

    return volumeData;
  }
}

export { WVDBLoader };

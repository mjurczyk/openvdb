// NOTE Three.js-style .wvdb loader. Grid data works as raw data for FrameVolume and FogVolume of three-openvdb.
import * as Three from 'three';
import { WVDBReader } from './WVDBReader';

const textureKeys = ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'];

class WVDBVolumeData {
  grids = {};
  attached = new Set();

  constructor(reader) {
    this.reader = reader;
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

  // NOTE Textures of attached volumes update when a new LOD arrives.
  // FrameVolume keeps them in volumes, FogVolume in materials.
  attach(object) {
    this.attached.add(object);
    this.updateTextures();

    return object;
  }

  detach(object) {
    this.attached.delete(object);
  }

  updateTextures() {
    const arrays = Object.values(this.grids).map(({ data }) => data);

    this.attached.forEach((object) => {
      [...(object.volumes || []), ...(object.materials || [])].forEach((holder) => {
        textureKeys.forEach((key) => {
          const texture = holder[key];

          if (texture && arrays.includes(texture.image?.data)) {
            texture.needsUpdate = true;
          }
        });
      });
    });
  }

  dispose() {
    this.reader.cancel();
    this.attached.clear();
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

  // NOTE onLoad runs when all grids show their first LOD. onProgress runs on each update after that.
  load(url, onLoad, onProgress, onError) {
    const reader = new WVDBReader({ maxLod: this.maxLod, scales: this.scales });
    const volumeData = new WVDBVolumeData(reader);

    let loaded = false;

    reader
      .load(url, {
        onHeader: () => {
          Object.values(reader.grids).forEach(
            ({ name, class: gridClass, channels, bbox, dimensions, data }) => {
              volumeData.grids[name] = {
                name,
                isLevelSet: gridClass === 'level set',
                // NOTE Vector grids give RGBA colour (baseColorGrid), scalar grids give density
                isColor: channels === 3,
                data,
                resolution: dimensions[0],
                // NOTE Grids of a file with only empty grids have no box
                bbox: bbox
                  ? new Three.Box3(new Three.Vector3(...bbox[0]), new Three.Vector3(...bbox[1]))
                  : new Three.Box3(),
              };
            }
          );
        },
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

import * as Three from 'three';
import { GridDescriptor, Vector3 } from 'openvdb';
import { frameLights } from './frameLights.js';
import { getFrameBackend } from './frameBackend.js';

// NOTE Draw the frame after all other transparent objects
const frameRenderOrder = 1000000;

const allLights = Object.values(frameLights).reduce((mask, flag) => mask | flag, 0);

// NOTE The backend sets the filters and mipmaps
const createTexture3D = (data, dimensions, format, mipmaps) => {
  const texture = new Three.Data3DTexture(data, dimensions.x, dimensions.y, dimensions.z);
  texture.format = format;
  texture.unpackAlignment = 1;
  getFrameBackend().configureTexture(texture, mipmaps);
  texture.needsUpdate = true;

  return texture;
};

// NOTE Level sets store signed distance. Active voxels give density 1.0. Scale maps to 1.0.
const sampleDensity = (grid, position, scale = 1.0) => {
  if (grid.isLevelSet?.()) {
    return grid.isActive(position) ? 1.0 : 0.0;
  }

  return Three.MathUtils.clamp(grid.getValue(position) / scale, 0.0, 1.0);
};

const sampleColor = (grid, position, target) => {
  const value = grid.getValue(position);

  if (value instanceof Three.Color) {
    target.copy(value);
  } else if (value instanceof Vector3 || value instanceof Three.Vector3) {
    target.setRGB(value.x, value.y, value.z);
  } else {
    target.setRGB(1.0, 0.0, 1.0); // NOTE Show debug issues as violet
  }

  return target;
};

const textureKeys = ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'];

// NOTE Volume of an instance, with its own render state.
// Textures, box and ready come from the volume of the source.
class SharedVolume {
  source = null;
  matrixWorld = new Three.Matrix4();
  localToView = new Three.Matrix4();
  viewToLocal = new Three.Matrix4();
  worldToLocal = new Three.Matrix4();
  worldBox = new Three.Box3();
  viewNear = 0.0;
  viewFar = 0.0;

  get densityMap3D() {
    return this.source.densityMap3D;
  }

  get emissiveMap3D() {
    return this.source.emissiveMap3D;
  }

  get baseColorMap3D() {
    return this.source.baseColorMap3D;
  }

  get maskMap3D() {
    return this.source.maskMap3D;
  }

  get mipMaps() {
    return this.source.mipMaps;
  }

  get matrix() {
    return this.source.matrix;
  }

  get ready() {
    return this.source.ready;
  }
}

// NOTE Volume props of a FrameVolume, in the constructor props format
const getProps = (frameVolume) => ({
  baseColor: frameVolume.baseColor,
  scatterColor: frameVolume.scatterColor,
  extinction: frameVolume.extinction,
  densityScale: frameVolume.densityScale,
  densityCutoff: frameVolume.densityCutoff,
  absorbance: frameVolume.absorbance,
  opacity: frameVolume.opacity,
  emissiveIntensity: frameVolume.emissiveIntensity,
  emissiveScale: frameVolume.emissiveScale,
  temperatureRange: frameVolume.temperatureRange.toArray(),
  offset3D: frameVolume.offset3D,
  wrap3D: frameVolume.wrap3D,
  lights: frameVolume.lights,
  shadowSteps: frameVolume.shadowSteps,
  mipmaps: frameVolume.mipmaps,
});

export class FrameVolume extends Three.Group {
  isFrameVolume = true;

  volumes = [];
  process = null;
  // NOTE Instances only: the FrameVolume with the textures. null when the textures are its own.
  source = null;

  // NOTE A FrameVolume as source makes an instance. It shares the textures and boxes of the source.
  // Props start from the source props.
  constructor(source, props = {}, onConverted, onProgress) {
    super();

    const instanceSource = source?.isFrameVolume ? source : null;

    const {
      // NOTE Texels on the longest box side
      resolution = 100,
      progressive = false,
      emissiveGrid,
      baseColorGrid,
      maskGrid,
      baseColor = 0xffffff,
      scatterColor = 0x000000,
      extinction = 100.0,
      densityScale = 1.0,
      densityCutoff = 0.0,
      absorbance = 1.0,
      opacity = 1.0,
      emissiveIntensity = 1.0,
      // NOTE Emissive grid value that maps to the top of the temperature range
      emissiveScale = 1.0,
      // NOTE Kelvin values for emissive values 0.0 and emissiveScale
      temperatureRange = [0.0, 6500.0],
      offset3D = new Three.Vector3(),
      wrap3D = Three.ClampToEdgeWrapping,
      lights = allLights,
      shadowSteps = 32,
      // NOTE CPU mipmaps for far volumes and coarse shadow cascades. false saves memory (+25%) and GPU time.
      mipmaps = true,
      // NOTE World box for all grids. Animation frames share one box. Then voxels do not move.
      bbox: sharedBbox,
    } = instanceSource ? { ...getProps(instanceSource), ...props } : props;

    this.baseColor = new Three.Color(baseColor);
    this.scatterColor = new Three.Color(scatterColor);
    this.extinction = extinction;
    this.densityScale = densityScale;
    this.densityCutoff = densityCutoff;
    this.absorbance = absorbance;
    this.opacity = opacity;
    this.emissiveIntensity = emissiveIntensity;
    this.emissiveScale = emissiveScale;
    this.temperatureRange = new Three.Vector2().fromArray(temperatureRange);
    this.offset3D = new Three.Vector3().copy(offset3D);
    this.wrap3D = wrap3D;
    this.lights = lights;
    this.shadowSteps = shadowSteps;
    this.mipmaps = mipmaps;

    const backend = getFrameBackend();

    this.proxy = new Three.Mesh(backend.createProxyGeometry(), backend.integrateMaterial);
    this.proxy.frustumCulled = false;
    this.proxy.renderOrder = frameRenderOrder;
    this.proxy.onBeforeRender = (renderer, scene, camera) => {
      backend.render(renderer, scene, camera, this.proxy);
    };
    this.add(this.proxy);

    if (instanceSource) {
      // NOTE An instance of an instance shares the textures of the first source
      this.setSource(instanceSource.source ?? instanceSource);

      return;
    }

    let grids;

    if (source instanceof Array) {
      grids = source;
    } else if (typeof source.grids !== 'undefined') {
      grids = Object.values(source.grids);
    } else {
      grids = [source];
    }

    grids = grids.filter(
      (grid) =>
        grid !== emissiveGrid &&
        grid !== baseColorGrid &&
        grid !== maskGrid &&
        (grid instanceof Uint8Array || grid instanceof GridDescriptor)
    );

    const tasks = [];
    const hasRawAuxGrids = [emissiveGrid, baseColorGrid, maskGrid].some(
      (grid) => grid instanceof Uint8Array
    );

    grids.forEach((grid) => {
      const volume = {
        densityMap3D: null,
        emissiveMap3D: null,
        baseColorMap3D: null,
        maskMap3D: null,
        mipMaps: {},
        matrix: new Three.Matrix4(),
        matrixWorld: new Three.Matrix4(),
        localToView: new Three.Matrix4(),
        viewToLocal: new Three.Matrix4(),
        worldToLocal: new Three.Matrix4(),
        worldBox: new Three.Box3(),
        viewNear: 0.0,
        viewFar: 0.0,
        ready: false,
      };

      const bbox = new Three.Box3(
        new Three.Vector3(-0.5, -0.5, -0.5),
        new Three.Vector3(0.5, 0.5, 0.5)
      );

      if (sharedBbox) {
        bbox.copy(sharedBbox);
      } else if (grid instanceof GridDescriptor) {
        bbox.set(...grid.getPreciseWorldBbox());
      }

      const center = bbox.getCenter(new Three.Vector3());
      const size = bbox.getSize(new Three.Vector3()).max(new Three.Vector3(1e-6, 1e-6, 1e-6));

      volume.matrix.compose(center, new Three.Quaternion(), size);

      // NOTE Raw data is a resolution^3 cube. Other grids get cube-shaped texels.
      // The longest box side has resolution texels.
      const dimensions =
        grid instanceof Uint8Array || hasRawAuxGrids
          ? new Three.Vector3(resolution, resolution, resolution)
          : size
              .clone()
              .multiplyScalar(resolution / Math.max(size.x, size.y, size.z))
              .round()
              .max(new Three.Vector3(1, 1, 1));

      const voxelCount = dimensions.x * dimensions.y * dimensions.z;

      volume.densityMap3D = createTexture3D(
        grid instanceof Uint8Array ? grid : new Uint8Array(voxelCount),
        dimensions,
        Three.RedFormat,
        mipmaps,
      );

      const auxGrids = {};

      if (emissiveGrid) {
        auxGrids.emissive = emissiveGrid;
        volume.emissiveMap3D = createTexture3D(
          emissiveGrid instanceof Uint8Array ? emissiveGrid : new Uint8Array(voxelCount),
          dimensions,
          Three.RedFormat,
          mipmaps,
        );
      }

      if (baseColorGrid) {
        auxGrids.baseColor = baseColorGrid;
        volume.baseColorMap3D = createTexture3D(
          baseColorGrid instanceof Uint8Array ? baseColorGrid : new Uint8Array(voxelCount * 4),
          dimensions,
          Three.RGBAFormat,
          mipmaps,
        );
      }

      if (maskGrid) {
        auxGrids.mask = maskGrid;
        volume.maskMap3D = createTexture3D(
          maskGrid instanceof Uint8Array ? maskGrid : new Uint8Array(voxelCount),
          dimensions,
          Three.RedFormat,
          mipmaps,
        );
      }

      volume.ready = progressive;

      this.volumes.push(volume);

      tasks.push({
        volume,
        voxelCount,
        task: this.convert(volume, grid, auxGrids, center, size, dimensions),
      });
    });

    let convertedGrids = 0;
    let convertedVoxels = 0;
    let convertedGridVoxels = 0;

    const totalGrids = tasks.length;
    const totalVoxels = tasks.reduce((sum, { voxelCount }) => sum + voxelCount, 0);

    const updateTextures = (volume) => {
      textureKeys.forEach((key) => {
        if (volume[key]) {
          volume[key].needsUpdate = true;
        }
      });
    };

    const onTimeout = () => {
      // NOTE Unblocking conversion
      // REF https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/voxelize.js#L326
      const startTime = window.performance.now();
      const current = tasks[convertedGrids];

      while (current && window.performance.now() - startTime < 12) {
        const { value, done } = current.task.next();

        if (done) {
          break;
        }

        convertedVoxels += value;
        convertedGridVoxels += value;
      }

      if (current) {
        const gridConverted = convertedGridVoxels >= current.voxelCount;

        if (progressive || gridConverted) {
          updateTextures(current.volume);
        }

        if (gridConverted) {
          current.volume.ready = true;
          convertedGrids++;
          convertedGridVoxels = 0;
        }
      }

      if (onProgress) {
        onProgress({ convertedVoxels, totalVoxels, convertedGrids, totalGrids });
      }

      if (convertedGrids < totalGrids) {
        this.process = setTimeout(onTimeout, 0);
      } else {
        this.process = null;

        if (onConverted) {
          onConverted();
        }
      }
    };

    onTimeout();
  }

  // NOTE Yields the number of converted voxels after each row
  *convert(volume, grid, auxGrids, center, size, dimensions) {
    const { x: width, y: height, z: depth } = dimensions;

    if (grid instanceof Uint8Array) {
      yield width * height * depth;

      return;
    }

    const density = volume.densityMap3D.image.data;
    const emissive = auxGrids.emissive instanceof GridDescriptor && volume.emissiveMap3D.image.data;
    const baseColor =
      auxGrids.baseColor instanceof GridDescriptor && volume.baseColorMap3D.image.data;
    const mask = auxGrids.mask instanceof GridDescriptor && volume.maskMap3D.image.data;

    const world = new Three.Vector3();
    const position = new Three.Vector3();
    const color = new Three.Color();

    const toIndex = (target) => target.transform.applyInverseTransformMap(position.copy(world));

    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = x + y * width + z * width * height;

          world.set(
            (x + 0.5) / width - 0.5,
            (y + 0.5) / height - 0.5,
            (z + 0.5) / depth - 0.5
          ).multiply(size).add(center);

          density[index] = sampleDensity(grid, toIndex(grid)) * 255.0;

          if (emissive) {
            emissive[index] =
              sampleDensity(auxGrids.emissive, toIndex(auxGrids.emissive), this.emissiveScale) *
              255.0;
          }

          if (mask) {
            mask[index] = sampleDensity(auxGrids.mask, toIndex(auxGrids.mask)) * 255.0;
          }

          if (baseColor) {
            sampleColor(auxGrids.baseColor, toIndex(auxGrids.baseColor), color);

            baseColor[index * 4 + 0] = color.r * 255.0;
            baseColor[index * 4 + 1] = color.g * 255.0;
            baseColor[index * 4 + 2] = color.b * 255.0;
            baseColor[index * 4 + 3] = 255.0;
          }
        }

        yield width;
      }
    }
  }

  // NOTE An instance with the same textures and boxes.
  // Own transform and own props, which start from the props of this volume.
  createInstance(props) {
    return new FrameVolume(this, props);
  }

  // NOTE Instances only. Shows the textures and boxes of another FrameVolume.
  // For example the next animation frame.
  setSource(frameVolume) {
    this.source = frameVolume;
    this.volumes = frameVolume.volumes.map((volume, index) => {
      const shared =
        this.volumes[index] instanceof SharedVolume ? this.volumes[index] : new SharedVolume();
      shared.source = volume;

      return shared;
    });
  }

  // NOTE An instance frees only its own objects. The source keeps the textures.
  dispose() {
    if (this.process) {
      clearTimeout(this.process);
      this.process = null;
    }

    if (!this.source) {
      this.volumes.forEach((volume) => {
        textureKeys.forEach((key) => {
          if (volume[key]) {
            volume[key].dispose();
          }
        });

        getFrameBackend().disposeVolume(volume);
      });
    }

    this.volumes = [];
    this.proxy.geometry.dispose();
  }
}

import * as Three from 'three';
import { GridDescriptor } from '../../core/GridDescriptor';
import { frameLights } from './FrameInjectMaterial';
import { frameRenderer, createFullscreenGeometry } from './FrameRenderer';

// NOTE Draw the frame after all other transparent objects
const frameRenderOrder = 1000000;

const allLights = Object.values(frameLights).reduce((mask, flag) => mask | flag, 0);

const createTexture3D = (data, resolution, format) => {
  const texture = new Three.Data3DTexture(data, resolution, resolution, resolution);
  texture.format = format;
  texture.minFilter = Three.LinearMipmapLinearFilter;
  texture.magFilter = Three.LinearFilter;
  texture.generateMipmaps = true;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return texture;
};

// NOTE Level sets store signed distance. Active voxels give density 1.0.
const sampleDensity = (grid, position) => {
  if (grid.isLevelSet?.()) {
    return grid.isActive(position) ? 1.0 : 0.0;
  }

  return Three.MathUtils.clamp(grid.getValue(position), 0.0, 1.0);
};

const sampleColor = (grid, position, target) => {
  const value = grid.getValue(position);

  if (value instanceof Three.Color) {
    target.copy(value);
  } else if (value instanceof Three.Vector3) {
    target.setRGB(value.x, value.y, value.z);
  } else {
    target.setRGB(1.0, 0.0, 1.0); // NOTE Show debug issues as violet
  }

  return target;
};

export class FrameVolume extends Three.Group {
  isFrameVolume = true;

  volumes = [];
  process = null;

  constructor(source, props = {}, onConverted, onProgress) {
    super();

    const {
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
      offset3D = new Three.Vector3(),
      wrap3D = Three.ClampToEdgeWrapping,
      lights = allLights,
      shadowSteps = 32,
    } = props;

    this.baseColor = new Three.Color(baseColor);
    this.scatterColor = new Three.Color(scatterColor);
    this.extinction = extinction;
    this.densityScale = densityScale;
    this.densityCutoff = densityCutoff;
    this.absorbance = absorbance;
    this.opacity = opacity;
    this.emissiveIntensity = emissiveIntensity;
    this.offset3D = new Three.Vector3().copy(offset3D);
    this.wrap3D = wrap3D;
    this.lights = lights;
    this.shadowSteps = shadowSteps;

    this.proxy = new Three.Mesh(createFullscreenGeometry(), frameRenderer.integrateMaterial);
    this.proxy.frustumCulled = false;
    this.proxy.renderOrder = frameRenderOrder;
    this.proxy.onBeforeRender = (renderer, scene, camera) => {
      frameRenderer.render(renderer, scene, camera, this.proxy);
    };
    this.add(this.proxy);

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

    const voxelCount = Math.pow(resolution, 3);
    const tasks = [];

    grids.forEach((grid) => {
      const volume = {
        densityMap3D: null,
        emissiveMap3D: null,
        baseColorMap3D: null,
        maskMap3D: null,
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

      if (grid instanceof Uint8Array) {
        // NOTE Raw density data fills the unit box
        volume.densityMap3D = createTexture3D(grid, resolution, Three.RedFormat);
      } else {
        volume.densityMap3D = createTexture3D(
          new Uint8Array(voxelCount),
          resolution,
          Three.RedFormat
        );
      }

      const bbox = new Three.Box3(
        new Three.Vector3(-0.5, -0.5, -0.5),
        new Three.Vector3(0.5, 0.5, 0.5)
      );

      if (grid instanceof GridDescriptor) {
        bbox.set(...grid.getPreciseWorldBbox());
      }

      const center = bbox.getCenter(new Three.Vector3());
      const size = bbox.getSize(new Three.Vector3()).max(new Three.Vector3(1e-6, 1e-6, 1e-6));

      volume.matrix.compose(center, new Three.Quaternion(), size);

      const auxGrids = {};

      if (emissiveGrid) {
        auxGrids.emissive = emissiveGrid;
        volume.emissiveMap3D = createTexture3D(
          emissiveGrid instanceof Uint8Array ? emissiveGrid : new Uint8Array(voxelCount),
          resolution,
          Three.RedFormat
        );
      }

      if (baseColorGrid) {
        auxGrids.baseColor = baseColorGrid;
        volume.baseColorMap3D = createTexture3D(
          baseColorGrid instanceof Uint8Array ? baseColorGrid : new Uint8Array(voxelCount * 4),
          resolution,
          Three.RGBAFormat
        );
      }

      if (maskGrid) {
        auxGrids.mask = maskGrid;
        volume.maskMap3D = createTexture3D(
          maskGrid instanceof Uint8Array ? maskGrid : new Uint8Array(voxelCount),
          resolution,
          Three.RedFormat
        );
      }

      volume.ready = progressive;

      this.volumes.push(volume);

      tasks.push({ volume, task: this.convert(volume, grid, auxGrids, center, size, resolution) });
    });

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = tasks.length;
    const totalVoxels = totalGrids * voxelCount;

    const updateTextures = (volume) => {
      ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'].forEach((key) => {
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
      }

      if (current) {
        if (progressive || convertedVoxels >= (convertedGrids + 1) * voxelCount) {
          updateTextures(current.volume);
        }

        if (convertedVoxels >= (convertedGrids + 1) * voxelCount) {
          current.volume.ready = true;
          convertedGrids++;
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
  *convert(volume, grid, auxGrids, center, size, resolution) {
    if (grid instanceof Uint8Array) {
      yield Math.pow(resolution, 3);

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

    for (let z = 0; z < resolution; z++) {
      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          const index = x + y * resolution + z * resolution * resolution;

          world.set(
            (x + 0.5) / resolution - 0.5,
            (y + 0.5) / resolution - 0.5,
            (z + 0.5) / resolution - 0.5
          ).multiply(size).add(center);

          density[index] = sampleDensity(grid, toIndex(grid)) * 255.0;

          if (emissive) {
            emissive[index] = sampleDensity(auxGrids.emissive, toIndex(auxGrids.emissive)) * 255.0;
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

        yield resolution;
      }
    }
  }

  dispose() {
    if (this.process) {
      clearTimeout(this.process);
      this.process = null;
    }

    this.volumes.forEach((volume) => {
      ['densityMap3D', 'emissiveMap3D', 'baseColorMap3D', 'maskMap3D'].forEach((key) => {
        if (volume[key]) {
          volume[key].dispose();
        }
      });
    });

    this.volumes = [];
    this.proxy.geometry.dispose();
  }
}

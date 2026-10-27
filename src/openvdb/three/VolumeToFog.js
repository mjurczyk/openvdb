import * as Three from 'three';
import { GridDescriptor } from '../core/GridDescriptor';
import { Bbox } from '../math/bbox';
import { Vector3 } from '../math/vector';
import { VolumeBasicMaterial } from './VolumeBasicMaterial';
import { updateFrameDepth } from '../utils/depth';
import { getDensity } from '../utils/density';
import {
  createScalarTexture3D,
  createTextureData,
  getTextureScale,
  readTexel,
  textureTypes,
  writeTexel,
} from '../utils/densityTexture';
import {
  buildLeafTexture,
  canBuildFromLeaves,
  textureBuilds,
  textureFilters,
} from '../utils/leafTexture';

// NOTE Center of texel (0, 0, 0) and the step between texels, in grid index space
const getTextureMapping = (grid, resolution) => {
  const center = new Vector3();
  const size = new Vector3();
  const step = new Vector3();
  const start = new Vector3();
  const bbox = new Bbox();

  bbox.set(...grid.getPreciseWorldBbox());
  bbox.getCenter(center);
  bbox.getSize(size);

  step.copy(size).multiplyScalar(1.0 / resolution);
  grid.transform.applyInverseJacobian(step);

  start.copy(center).sub(size.clone().multiplyScalar(0.5));
  grid.transform.applyInverseTransformMap(start);
  start.add(step.clone().multiplyScalar(0.5));

  return { center, size, start, step };
};

export class VolumeToFog extends Three.Group {
  processes = [];
  leafBuilds = [];
  materials = [];

  isFogVolume = true;

  constructor(
    source,
    materialProps,
    onConverted,
    onProgress
  ) {
    super();

    const {
      resolution,
      progressive,
      emissiveGrid,
      baseColorGrid,
      maskGrid,
      radius,
      textureBuild = textureBuilds.sample,
      textureFilter = textureFilters.nearest,
      textureType = textureTypes.uint8,
    } = materialProps;

    const textureScale = getTextureScale(textureType);

    this.frustumCulled = false;

    let grids;

    if (source instanceof Array) {
      // NOTE Treat first argument as set of grids
      grids = source;
    } else if (typeof source.grids !== 'undefined') {
      // NOTE Treat first argument as VDB source
      grids = Object.values(source.grids);
    } else {
      // NOTE Hope for the best
      grids = [source];
    }

    // NOTE Shader properties (grids influencing color output)

    let emissiveTexture3D, probeEmissiveValue;
    let baseColorTexture3D, probeBaseColorValue;
    let maskTexture3D, probeMaskValue;

    if (emissiveGrid) {
      grids = grids.filter(match => match !== emissiveGrid);

      if (emissiveGrid instanceof Uint8Array) {
        emissiveTexture3D = createScalarTexture3D(emissiveGrid, resolution, textureTypes.uint8);
      } else {
        const emissiveData = createTextureData(textureType, Math.pow(resolution, 3));
        emissiveTexture3D = createScalarTexture3D(emissiveData, resolution, textureType);

        probeEmissiveValue = (index, target, override) => {
          const value =
            typeof override !== 'undefined'
              ? override
              : getDensity(emissiveGrid, target) * textureScale;
          writeTexel(emissiveData, index, value);

          return value;
        };
      }
    }

    if (baseColorGrid) {
      if (baseColorGrid instanceof Uint8Array) {
        baseColorTexture3D = new Three.Data3DTexture(baseColorGrid, resolution, resolution, resolution);
      } else {
        const baseColorData = new Uint8Array(Math.pow(resolution, 3) * 4);
        baseColorTexture3D = new Three.Data3DTexture(baseColorData, resolution, resolution, resolution);

        const colorSampler = new Three.Color();

        probeBaseColorValue = (index, target, override) => {
          if (override) {
            baseColorData[index * 4 + 0] = override.r * 255.;
            baseColorData[index * 4 + 1] = override.g * 255.;
            baseColorData[index * 4 + 2] = override.b * 255.;
            baseColorData[index * 4 + 3] = 255.;

            return;
          }

          const gridSample = baseColorGrid.getValue(target);

          if (gridSample instanceof Three.Color) {
            colorSampler.set(gridValue);
          } else if (gridSample instanceof Three.Vector3) {
            colorSampler.setRGB(
              gridSample.x,
              gridSample.y,
              gridSample.z
            );
          } else {
            colorSampler.setRGB(1.0, 0.0, 1.0); // NOTE Show debug issues as violet
          }

          baseColorData[index * 4 + 0] = colorSampler.r * 255.;
          baseColorData[index * 4 + 1] = colorSampler.g * 255.;
          baseColorData[index * 4 + 2] = colorSampler.b * 255.;
          baseColorData[index * 4 + 3] = 255.;

          return {
            r: colorSampler.r,
            g: colorSampler.g,
            b: colorSampler.b,
            a: colorSampler.a,
          };
        };
      }

      baseColorTexture3D.format = Three.RGBAFormat;
      baseColorTexture3D.minFilter = Three.LinearFilter;
      baseColorTexture3D.magFilter = Three.LinearFilter;
      baseColorTexture3D.unpackAlignment = 1;
      baseColorTexture3D.needsUpdate = true;
    }

    if (maskGrid) {
      if (maskGrid instanceof Uint8Array) {
        maskTexture3D = createScalarTexture3D(maskGrid, resolution, textureTypes.uint8);
      } else {
        const maskData = createTextureData(textureType, Math.pow(resolution, 3));
        maskTexture3D = createScalarTexture3D(maskData, resolution, textureType);

        probeMaskValue = (index, target, override) => {
          const value =
            typeof override !== 'undefined'
              ? override
              : getDensity(maskGrid, target) * textureScale;
          writeTexel(maskData, index, value);

          return value;
        };
      }
    }

    // NOTE Parse grids

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = grids.length;
    const totalVoxels = totalGrids * Math.pow(resolution, 3);

    // NOTE Leaf build is opt-in. It needs scalar trees for all grids. Uint8Array inputs are used as they are.
    const isLeafBuildInput = (grid) =>
      !grid || grid instanceof Uint8Array || canBuildFromLeaves(grid);
    const useLeafBuild =
      textureBuild === textureBuilds.leaves &&
      grids.every((grid) => !(grid instanceof GridDescriptor) || canBuildFromLeaves(grid)) &&
      isLeafBuildInput(emissiveGrid) &&
      isLeafBuildInput(maskGrid) &&
      (!baseColorGrid || baseColorGrid instanceof Uint8Array);

    if (textureBuild === textureBuilds.leaves && !useLeafBuild) {
      console.warn(
        'VolumeToFog',
        'textureBuild',
        'Primitive or vector grids need the sample build. Using the sample build.'
      );
    }

    const leafBuildsDone = [];
    const leafProgress = [];
    let leafAuxBuildsStarted = false;

    const reportLeafProgress = () => {
      if (onProgress) {
        onProgress({
          convertedVoxels: leafProgress.reduce((sum, progress) => sum + progress.convertedVoxels, 0),
          totalVoxels: leafProgress.reduce((sum, progress) => sum + progress.totalVoxels, 0),
          convertedGrids,
          totalGrids,
        });
      }
    };

    // NOTE Fills the texture when the build is done. Cancelled builds give no data.
    const buildFromLeaves = (grid, mapping, texture3D, bleedRadius) => {
      const progress = { convertedVoxels: 0, totalVoxels: 0 };
      leafProgress.push(progress);

      const build = buildLeafTexture({
        grid,
        resolution,
        start: mapping.start,
        step: mapping.step,
        filter: textureFilter,
        textureType,
        radius: bleedRadius,
        onProgress: ({ convertedVoxels, totalVoxels }) => {
          progress.convertedVoxels = convertedVoxels;
          progress.totalVoxels = totalVoxels;
          reportLeafProgress();
        },
      });

      this.leafBuilds.push(build);

      return build.promise
        .then((data) => {
          if (!data) {
            return false;
          }

          texture3D.image.data = data;
          texture3D.needsUpdate = true;

          return true;
        })
        .catch((error) => {
          console.error('VolumeToFog', 'buildLeafTexture', { error });

          return false;
        });
    };

    grids.reverse().forEach(async (grid, gridIndex) => {
      if (grid instanceof Uint8Array) {
        const volumeTexture3D = new Three.Data3DTexture(grid, resolution, resolution, resolution);
        volumeTexture3D.format = Three.RedFormat;
        volumeTexture3D.minFilter = Three.LinearFilter;
        volumeTexture3D.magFilter = Three.LinearFilter;
        volumeTexture3D.unpackAlignment = 1;
        volumeTexture3D.needsUpdate = true;

        const geometry = new Three.SphereGeometry(1.0);
        const material = new VolumeBasicMaterial({
          ...materialProps,
          emissiveMap3D: emissiveTexture3D,
          densityMap3D: volumeTexture3D,
          baseColorMap3D: baseColorTexture3D,
          maskMap3D: maskTexture3D,
        });

        const fog = new Three.Mesh(geometry, material);
        fog.frustumCulled = false;
        fog.onBeforeRender = updateFrameDepth;

        this.materials.push(material);

        this.add(fog);

        return;
      }

      if (!(grid instanceof GridDescriptor)) {
        return;
      }

      const data = createTextureData(textureType, Math.pow(resolution, 3));
      const volumeTexture3D = createScalarTexture3D(data, resolution, textureType);

      const geometry = new Three.SphereGeometry(1.0);
      const material = new VolumeBasicMaterial({
        ...materialProps,
        emissiveMap3D: emissiveTexture3D,
        densityMap3D: volumeTexture3D,
        baseColorMap3D: baseColorTexture3D,
        maskMap3D: maskTexture3D,
      });

      const fog = new Three.Mesh(geometry, material);
      fog.frustumCulled = false;
      fog.onBeforeRender = updateFrameDepth;

      this.materials.push(material);

      if (useLeafBuild) {
        const mapping = getTextureMapping(grid, resolution);

        fog.position.copy(mapping.center);
        fog.scale.copy(mapping.size);

        if (progressive) {
          this.add(fog);
        }

        leafBuildsDone.push(
          buildFromLeaves(grid, mapping, volumeTexture3D, radius).then((done) => {
            if (!done) {
              return;
            }

            convertedGrids++;

            if (!progressive) {
              this.add(fog);
            }

            reportLeafProgress();
          })
        );

        // NOTE All grids share the emissive and mask textures. Build them one time, with the first grid mapping.
        if (!leafAuxBuildsStarted) {
          leafAuxBuildsStarted = true;

          if (emissiveGrid && !(emissiveGrid instanceof Uint8Array)) {
            leafBuildsDone.push(buildFromLeaves(emissiveGrid, mapping, emissiveTexture3D, 0));
          }

          if (maskGrid && !(maskGrid instanceof Uint8Array)) {
            leafBuildsDone.push(buildFromLeaves(maskGrid, mapping, maskTexture3D, 0));
          }
        }

        return;
      }

      const baseResolution = resolution;
      const baseResolutionPow2 = Math.pow(baseResolution, 2);

      const convertResolution = (resolution) => new Promise((resolve) => {
        const resolutionPow2 = Math.pow(resolution, 2);
        const resolutionPow3 = Math.pow(resolution, 3);

        const { center, size, start: target, step } = getTextureMapping(grid, resolution);

        fog.position.copy(center);
        fog.scale.copy(size);

        let x = 0;
        let y = 0;
        let z = 0;

        function* probeValue() {         
          // NOTE Fill values

          for (let i = 0; i < resolutionPow3; i++) {
            const baseX = x;
            const baseY = y;
            const baseZ = z;
            const baseIndex = baseX + baseY * resolution + baseZ * resolutionPow2;
            
            const value = getDensity(grid, target);
            const emissiveValue = probeEmissiveValue && probeEmissiveValue(baseIndex, target);
            const baseColorValue = probeBaseColorValue && probeBaseColorValue(baseIndex, target);
            const maskValue = probeMaskValue && probeMaskValue(baseIndex, target);

            const cellBleed = radius;

            if (cellBleed) {
              for (let sx = -cellBleed; sx < cellBleed; sx++) {
                for (let sy = -cellBleed; sy < cellBleed; sy++) {
                  for (let sz = -cellBleed; sz < cellBleed; sz++) {
                    if (
                      x + sx < 0.0 ||
                      x + sx >= resolution ||
                      y + sy < 0.0 ||
                      y + sy >= resolution ||
                      z + sz < 0.0 ||
                      z + sz >= resolution
                    ) {
                      continue;
                    }

                    const targetIndex = baseIndex + sx + sy * baseResolution + sz * baseResolutionPow2;

                    const offset = Math.max(0.0, Math.min(1.0, 1. - Math.hypot(
                      sx,
                      sy,
                      sz,
                    ) / (radius / 2.0)));

                    const dataValue = offset * value * textureScale;

                    writeTexel(data, targetIndex, readTexel(data, targetIndex) + dataValue);
                    writeTexel(data, targetIndex, Math.min(readTexel(data, targetIndex), textureScale));

                    probeEmissiveValue && probeEmissiveValue(targetIndex, null, emissiveValue * offset * textureScale);
                    probeBaseColorValue && probeBaseColorValue(targetIndex, null, baseColorValue * offset);
                    probeMaskValue && probeMaskValue(targetIndex, null, maskValue * offset * textureScale);
                  }
                }
              }
            } else {
              const dataValue = value * textureScale;

              writeTexel(data, baseIndex, readTexel(data, baseIndex) + dataValue);
              writeTexel(data, baseIndex, Math.min(readTexel(data, baseIndex), textureScale));
            }

            convertedVoxels++;

            if (progressive) {
              volumeTexture3D.needsUpdate = true;

              if (emissiveTexture3D) {
                emissiveTexture3D.needsUpdate = true;
              }

              if (baseColorTexture3D) {
                baseColorTexture3D.needsUpdate = true;
              }

              if (maskTexture3D) {
                maskTexture3D.needsUpdate = true;
              }
            }

            if (z >= resolution) {
              emissiveTexture3D.needsUpdate = true;
              baseColorTexture3D.needsUpdate = true;
              maskTexture3D.needsUpdate = true;

              break;
            }

            x++;
            target.x += step.x;

            if (x >= resolution) {
              x = 0;
              target.x -= step.x * resolution;

              y++;
              target.y += step.y;
            }

            if (y >= resolution) {
              y = 0;
              target.y -= step.y * resolution;

              z++;
              target.z += step.z;
            }

            yield;
          }
        }

        let probe = probeValue();

        const onAnimationFrame = () => {
          // NOTE Unblocking conversion
          // REF https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/voxelize.js#L326
          let startTime = window.performance.now();
          while (window.performance.now() - startTime < 16 && probe) {
            const { done } = probe.next();

            if (onProgress) {
              onProgress({ convertedVoxels, totalVoxels, convertedGrids, totalGrids });
            }

            if (done) {
              convertedGrids++;
              probe = null;
              delete this.processes[gridIndex];

              resolve();

              if (convertedGrids === totalGrids) {
                if (!progressive) {
                  this.add(fog);
                }

                if (onConverted) {
                  onConverted();
                }
              }
            }
          }

          if (probe && this.processes) {
            this.processes[gridIndex] = setTimeout(onAnimationFrame, 0);
          }
        };
        onAnimationFrame();
      });

      if (progressive) {
        this.add(fog);
      }

      await convertResolution(resolution);
    });

    if (useLeafBuild) {
      Promise.all(leafBuildsDone).then(() => {
        if (this.processes && onConverted) {
          onConverted();
        }
      });
    }
  }

  dispose() {
    this.leafBuilds.forEach((build) => build.cancel());
    this.leafBuilds = [];

    if (!this.processes) {
      return;
    }

    this.processes.forEach((task, taskIndex) => {
      cancelAnimationFrame(task);
      delete this.processes[taskIndex];
    });

    this.processes = null;
  }
}

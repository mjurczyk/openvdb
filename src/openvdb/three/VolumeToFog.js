import * as Three from 'three';
import { GridDescriptor } from '../core/GridDescriptor';
import { Bbox } from '../math/bbox';
import { Vector3 } from '../math/vector';
import { VolumeBasicMaterial } from './VolumeBasicMaterial';

export class VolumeToFog extends Three.Group {
  processes = [];
  materials = [];

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
      radius,
    } = materialProps;

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

    let emissiveTexture3D, probeEmissiveValue, baseColorTexture3D, probeBaseColorValue;

    if (emissiveGrid) {
      grids = grids.filter(match => match !== emissiveGrid);

      emissiveTexture3D.format = Three.RedFormat;
      emissiveTexture3D.minFilter = Three.LinearFilter;
      emissiveTexture3D.magFilter = Three.LinearFilter;
      emissiveTexture3D.unpackAlignment = 1;
      emissiveTexture3D.needsUpdate = true;

      if (emissiveGrid instanceof Uint8Array) {
        emissiveTexture3D = new Three.Data3DTexture(emissiveGrid, resolution, resolution, resolution);
      } else {
        const emissiveData = new Uint8Array(Math.pow(resolution, 3));
        emissiveTexture3D = new Three.Data3DTexture(emissiveData, resolution, resolution, resolution);

        probeEmissiveValue = (index, target, override) => {
          return emissiveData[index] = typeof override !== 'undefined' ? override : emissiveGrid.getValue(target) * 255.;
        };
      }
    }

    if (baseColorGrid) {
      baseColorTexture3D.format = Three.RGBAFormat;
      baseColorTexture3D.minFilter = Three.LinearFilter;
      baseColorTexture3D.magFilter = Three.LinearFilter;
      baseColorTexture3D.unpackAlignment = 1;
      baseColorTexture3D.needsUpdate = true;

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
    }

    // NOTE Parse grids

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = grids.length;
    const totalVoxels = totalGrids * Math.pow(resolution, 3);

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
          baseColorMap3D: baseColorTexture3D
        });

        const fog = new Three.Mesh(geometry, material);
        fog.frustumCulled = false;

        this.materials.push(material);

        this.add(fog);

        return;
      }

      if (!(grid instanceof GridDescriptor)) {
        return;
      }

      const data = new Uint8Array(Math.pow(resolution, 3));
      const volumeTexture3D = new Three.Data3DTexture(data, resolution, resolution, resolution);
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
        baseColorMap3D: baseColorTexture3D
      });

      const fog = new Three.Mesh(geometry, material);
      fog.frustumCulled = false;

      this.materials.push(material);

      let resolutionSteps = [resolution];

      // if (progressive) {
      //   resolutionSteps = [resolution];

      //   while (resolutionSteps[resolutionSteps.length - 1] > 10) {
      //     resolutionSteps.push(resolution / (resolutionSteps.length + 1));
      //   }

      //   resolutionSteps = resolutionSteps.filter(value => ~~value === value);
      //   resolutionSteps.reverse();
      // } else {
      //   resolutionSteps = [resolution];
      // }

      const baseResolution = resolution;
      const baseResolutionPow2 = Math.pow(baseResolution, 2);
      const baseResolutionPow3 = Math.pow(baseResolution, 3);

      const convertResolution = (resolution) => new Promise((resolve) => {
        const resolutionInv = 1.0 / resolution;
        const resolutionPow2 = Math.pow(resolution, 2);
        const resolutionPow3 = Math.pow(resolution, 3);

        const target = new Vector3(0.0, 0.0, 0.0);
        const size = new Vector3(0.0, 0.0, 0.0);
        const step = new Vector3(0.0, 0.0, 0.0);
        const bbox = new Bbox();

        bbox.set(...grid.getPreciseWorldBbox());
        bbox.getCenter(fog.position);
        bbox.getSize(fog.scale);

        bbox.getCenter(target);
        bbox.getSize(size);

        step.copy(size).multiplyScalar(resolutionInv);
        grid.transform.applyInverseTransformMap(step);

        target.sub(size.clone().multiplyScalar(0.5));
        grid.transform.applyInverseTransformMap(target);
        target.add(step.clone().multiplyScalar(0.5));

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
            
            const value = grid.getValue(target);
            const emissiveValue = probeEmissiveValue && probeEmissiveValue(baseIndex, target);
            const baseColorValue = probeBaseColorValue && probeBaseColorValue(baseIndex, target);

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

                    const dataValue = offset * value * 255.;

                    data[targetIndex] += dataValue;
                    data[targetIndex] = Math.min(data[targetIndex], 255.);

                    probeEmissiveValue && probeEmissiveValue(targetIndex, null, emissiveValue * offset);
                    probeBaseColorValue && probeBaseColorValue(targetIndex, null, baseColorValue * offset);
                  }
                }
              }
            } else {
              const dataValue = value * 255.;

              data[baseIndex] += dataValue;
              data[baseIndex] = Math.min(data[baseIndex], 255.);
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
            }

            if (z >= resolution) {
              emissiveTexture3D.needsUpdate = true;
              baseColorTexture3D.needsUpdate = true;

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

      // for (let i = 0; i <= resolutionSteps.length; i++) {
      //   await convertResolution(resolutionSteps[i]);
      // }
    });
  }

  dispose() {
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

import * as Three from 'three';
import { MathUtils } from 'three';
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
      noise,
      emissiveGrid,
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

    let emissiveTexture3D, probeEmissiveValue;

    if (emissiveGrid) {
      grids = grids.filter(match => match !== emissiveGrid);

      const emissiveData = new Uint8Array(Math.pow(resolution, 3));
      emissiveTexture3D = new Three.Data3DTexture(emissiveData, resolution, resolution, resolution);
      emissiveTexture3D.format = Three.RedFormat;
      emissiveTexture3D.minFilter = Three.LinearFilter;
      emissiveTexture3D.magFilter = Three.LinearFilter;
      emissiveTexture3D.unpackAlignment = 1;
      emissiveTexture3D.needsUpdate = true;

      probeEmissiveValue = (index, target, override) => {
        return emissiveData[index] = typeof override !== 'undefined' ? override : emissiveGrid.getValue(target) * 255.;
      };
    }

    // NOTE Parse grids

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = grids.length;
    const totalVoxels = totalGrids * Math.pow(resolution, 3);

    grids.reverse().forEach(async (grid, gridIndex) => {
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
      });

      const fog = new Three.Mesh(geometry, material);
      fog.frustumCulled = false;

      this.materials.push(material);

      let resolutionSteps = [];

      if (progressive) {
        resolutionSteps = [resolution];

        while (resolutionSteps[resolutionSteps.length - 1] > 10) {
          resolutionSteps.push(resolution / (resolutionSteps.length + 1));
        }

        resolutionSteps = resolutionSteps.filter(value => ~~value === value);
        resolutionSteps.reverse();
      } else {
        resolutionSteps = [resolution];
      }

      const baseResolution = resolution;
      const baseResolutionPow2 = Math.pow(baseResolution, 2);
      const baseResolutionPow3 = Math.pow(baseResolution, 3);

      const convertResolution = (resolution) => new Promise((resolve) => {
        const resolutionScale = resolution / (resolutionSteps[resolutionSteps.length - 1]);
        const resolutionScaleInv = 1.0 / resolutionScale;
        const resolutionScaleInvPow2 = Math.pow(resolutionScaleInv, 2);
        const resolutionScaleInvPow3 = Math.pow(resolutionScaleInv, 3);

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
          for (let i = 0; i < resolutionPow3; i++) {
            const noiseSeed = MathUtils.clamp(255.0 * (noise || 0.0), 0.0, 255.0);

            if (resolutionScaleInv !== 1.0) {
              const value = grid.getValue(target);
              const index = Math.round(x * resolutionScaleInv) +
                  Math.round(y * resolutionScaleInvPow2) * resolution +
                  Math.round(z * resolutionScaleInvPow3) * resolutionPow2;
              const emissiveValue = probeEmissiveValue && probeEmissiveValue(index, target);

              for (let sx = 0; sx < resolutionScaleInv; sx++) {
                for (let sy = 0; sy < resolutionScaleInv; sy++) {
                  for (let sz = 0; sz < resolutionScaleInv; sz++) {
                    data[index + sx + sy * baseResolution + sz * baseResolutionPow2] = value;

                    probeEmissiveValue && probeEmissiveValue(
                      index + sx + sy * baseResolution + sz * baseResolutionPow2,
                      null,
                      emissiveValue
                    );
                  }
                }
              }
            } else {
              const index = Math.round(x * resolutionScaleInv) +
                  Math.round(y * resolutionScaleInvPow2) * resolution +
                  Math.round(z * resolutionScaleInvPow3) * resolutionPow2;

              data[index * resolutionScaleInv] = grid.getValue(target) * (255.0 - noiseSeed + Math.random() * noiseSeed);

              probeEmissiveValue && probeEmissiveValue(index, target);
            }

            convertedVoxels++;

            if (progressive) {
              volumeTexture3D.needsUpdate = true;

              if (emissiveTexture3D) {
                emissiveTexture3D.needsUpdate = true;
              }
            }

            if (z >= resolution) {
              probeEmissiveValue = null;
              emissiveTexture3D.needsUpdate = true;

              return;
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
          if (probe) {
            this.processes[gridIndex] = requestAnimationFrame(onAnimationFrame);
          }

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
        };
        onAnimationFrame();
      });

      if (progressive) {
        this.add(fog);
      }

      for (let i = 0; i <= resolutionSteps.length; i++) {
        await convertResolution(resolutionSteps[i]);
      }
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

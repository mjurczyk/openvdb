import * as Three from 'three';
import { MathUtils } from 'three';
import { GridDescriptor } from '../core/GridDescriptor';
import { Bbox } from '../math/bbox';
import { Vector3 } from '../math/vector';
import { VolumeBasicMaterial } from './VolumeBasicMaterial';

export class VolumeToFog extends Three.Group {
  processes = [];
  material = null;
  geometry = null;

  constructor(
    source,
    {
      resolution,
      progressive,
      absorbance,
      opacity,
      steps,
      noise,
      color,
      emissiveGrid
    },
    onConverted,
    onProgress
  ) {
    super();

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

    // NOTE Material

    // const isValidMaterial = [
    //   'MeshBasicMaterial',
    //   'MeshLambertMaterial',
    //   'MeshMatcapMaterial',
    //   'MeshPhongMaterial',
    //   'MeshStandardMaterial',
    //   'MeshPhysicalMaterial',
    //   'MeshToonMaterial',
    // ].includes(material?.type);

    // if (material && !isValidMaterial) {
    //   console.warn(
    //     'VolumeToFog',
    //     'unsupported material type for volume',
    //     material.type,
    //     'use MeshBasicMaterial, MeshLambertMaterial, MeshMatcapMaterial, MeshPhongMaterial, MeshPhysicalMaterial, or MeshToonMaterial'
    //   );
    // }

    // if (!material || !isValidMaterial) {
    //   baseMaterial = new Three.MeshStandardMaterial({
    //     color: new Three.Color(0x000000),
    //     side: Three.DoubleSide,
    //   });
    // } else {
    //   baseMaterial = material;
    // }

    // baseMaterial.customProgramCacheKey = () => Math.random();

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

      probeEmissiveValue = (index, target, x, y, z) => {
        const xr = x / resolution;
        const yr = y / resolution;
        const zr = z / resolution;

        emissiveData[index] = emissiveGrid.getValue(target) * 255.;
        
        // emissiveData[index] = (1. - yr + .3) * ((1. - Math.abs((xr + 0.5) - 1.0)) * (1. - Math.abs((zr + 0.5) - 1.0))) * 100.;
      };
    }

    // NOTE Parse grids

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = grids.length;
    const totalVoxels = totalGrids * Math.pow(resolution, 3);

    grids.forEach((grid, gridIndex) => {
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

      this.geometry = new Three.SphereGeometry(1.0);
      this.material = new VolumeBasicMaterial({
        emissiveMap: emissiveTexture3D,
        volumeMap: volumeTexture3D,
        resolution,
        absorbance,
        opacity,
        steps,
        color,
      });

      // const material = baseMaterial.clone();

      const fog = new Three.Mesh(this.geometry, this.material);
      fog.frustumCulled = false;

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

          const noiseSeed = MathUtils.clamp(255.0 * (noise || 0.0), 0.0, 255.0);
          const index = x + y * resolution + z * resolutionPow2;

          data[index] = grid.getValue(target) * (255.0 - noiseSeed + Math.random() * noiseSeed);
          probeEmissiveValue && probeEmissiveValue(index, target, x, y, z);

          convertedVoxels++;

          if (progressive) {
            volumeTexture3D.needsUpdate = true;

            if (emissiveTexture3D) {
              emissiveTexture3D.needsUpdate = true;
            }
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

      if (progressive) {
        this.add(fog);
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

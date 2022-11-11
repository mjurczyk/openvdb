import * as Three from 'three';
import { MathUtils } from 'three';
import { Bbox } from '../math/bbox';
import { Vector3 } from '../math/vector';

export class VolumeToPoints extends Three.Group {
  processes = [];

  constructor(source, materialProps, { resolution, progressive }, onConverted, onProgress) {
    super();

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

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = grids.length;
    const totalVoxels = totalGrids * Math.pow(resolution, 3);

    // NOTE Parse grids

    grids.forEach((grid, gridIndex) => {
      const geometry = new Three.BufferGeometry();
      const vertices = [];

      const levelSet = new Three.Points(
        geometry,
        new Three.PointsMaterial({ color: 0xff00ff, size: 1.0, ...(materialProps || {}) })
      );

      const resolutionInv = 1.0 / resolution;
      const resolutionPow2 = Math.pow(resolution, 2);
      const resolutionPow3 = Math.pow(resolution, 3);

      const target = new Vector3(0.0, 0.0, 0.0);
      const size = new Vector3(0.0, 0.0, 0.0);
      const step = new Vector3(0.0, 0.0, 0.0);
      const bbox = new Bbox();

      bbox.set(...grid.getPreciseWorldBbox());
      bbox.getCenter(levelSet.position);
      bbox.getSize(levelSet.scale);

      levelSet.scale.multiplyScalar(1.0 / resolution);

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

          const value = grid.getValue(target);

          if (value) {
            vertices.push(x - resolution / 2.0, y - resolution / 2.0, z - resolution / 2.0);
            geometry.setAttribute(
              'position',
              new Three.BufferAttribute(new Float32Array(vertices), 3)
            );
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
                this.add(levelSet);
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
        this.add(levelSet);
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

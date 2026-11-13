import * as Three from 'three';
import { GridDescriptor, sampleLevelSet } from 'openvdb';

// NOTE Signed distance texels: -background to +background maps to 0 to 255. The surface is at 127.5.
// Same encoding as toDistanceTexels in wvdbKernel.js.
export const distanceSurfaceTexel = 127.5;

export const encodeDistance = (value, background) =>
  Math.round((Math.min(Math.max(value / background, -1.0), 1.0) * 0.5 + 0.5) * 255.0);

// NOTE Runs a generator in 12 ms slices, so the page does not freeze. Returns a cancel function.
// The first slice also waits for a timeout, so onDone never runs before the cancel function returns.
// REF https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/voxelize.js#L326
export const runInSlices = (task, onDone) => {
  let timeout = null;

  const onTimeout = () => {
    const startTime = performance.now();

    while (performance.now() - startTime < 12) {
      const { value, done } = task.next();

      if (done) {
        timeout = null;
        onDone(value);

        return;
      }
    }

    timeout = setTimeout(onTimeout, 0);
  };

  timeout = setTimeout(onTimeout, 0);

  return () => clearTimeout(timeout);
};

// NOTE Dense signed distance of a level set grid, for LevelSetMesh.
// source: a level set GridDescriptor (sampled at resolution texels on the longest box side),
// or a level set grid of WVDBVolumeData (its newest LOD).
// task is a generator for GridDescriptor sources. It yields the number of texels after each row.
export const createLevelSetDistance = (source, { resolution = 200 } = {}) => {
  if (source instanceof GridDescriptor) {
    if (!source.isLevelSet()) {
      throw new Error(`Grid "${source.name}" is not a level set.`);
    }

    const bbox = new Three.Box3().set(...source.getPreciseWorldBbox());
    const size = bbox.getSize(new Three.Vector3()).max(new Three.Vector3(1e-6, 1e-6, 1e-6));
    const dimensions = size
      .clone()
      .multiplyScalar(resolution / Math.max(size.x, size.y, size.z))
      .round()
      .max(new Three.Vector3(2, 2, 2));
    const background = source.root.background;
    const data = new Uint8Array(dimensions.x * dimensions.y * dimensions.z).fill(255);

    function* task() {
      const values = new Float32Array(data.length);

      yield* sampleLevelSet(
        source,
        { min: bbox.min, size, dimensions: dimensions.toArray() },
        values,
      );

      for (let i = 0; i < values.length; i++) {
        data[i] = encodeDistance(values[i], background);
      }
    }

    return { data, dimensions, bbox, background, task: task() };
  }

  if (!source?.distance) {
    throw new Error('Source has no signed distance. Use a level set grid.');
  }

  return {
    data: source.distance,
    dimensions: new Three.Vector3(...source.dimensions),
    bbox: source.bbox.clone(),
    background: source.background,
    task: null,
  };
};

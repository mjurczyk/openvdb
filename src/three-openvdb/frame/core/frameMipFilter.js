// NOTE Gaussian mip levels of 3D grid data (FrameVolume mipmapFilter 'gaussian').
// REF Disney "Deep Scattering" (Kallweit et al. 2017), §6: Gaussian-filtered density mipmap, sigma = 2^i at level i.
// NOTE Level i: separable Gaussian of level i - 1, then 2x decimation. Level 0 (sigma 1) is the grid.
// NOTE Sigma adds in squares: each step adds sqrt(4^i - 4^(i-1)) voxels = sqrt(3) texels of level i - 1.
// NOTE Builds run in 12 ms steps, the same as the FrameVolume conversion. Results are cached for each data array.

// NOTE 'ceil': WebGPU atlas level sizes. 'floor': WebGL mip level sizes.
const getLevelSize = (size, level, sizeMode) =>
  Math.max(1, sizeMode === 'floor' ? Math.floor(size / 2 ** level) : Math.ceil(size / 2 ** level));

// NOTE Source texels and weights for each target texel on one axis. Texel centers match in uvw. Edges clamp.
const createAxisTaps = (sourceSize, targetSize) => {
  const ratio = sourceSize / targetSize;
  const sigma = (Math.sqrt(3.0) * ratio) / 2.0;
  const radius = Math.ceil(3.0 * sigma);
  const count = radius * 2 + 2;
  const indices = new Int32Array(targetSize * count);
  const weights = new Float32Array(targetSize * count);

  for (let target = 0; target < targetSize; target++) {
    const center = (target + 0.5) * ratio - 0.5;
    const start = Math.floor(center) - radius;
    let sum = 0.0;

    for (let tap = 0; tap < count; tap++) {
      const source = start + tap;
      const weight = Math.exp(-((source - center) ** 2) / (2.0 * sigma * sigma));

      indices[target * count + tap] = Math.min(Math.max(source, 0), sourceSize - 1);
      weights[target * count + tap] = weight;
      sum += weight;
    }

    for (let tap = 0; tap < count; tap++) {
      weights[target * count + tap] /= sum;
    }
  }

  return { indices, weights, count };
};

// NOTE One separable pass on one axis. Yields after each row of the output.
// NOTE x: taps inside each row. y and z: each output row is a weighted sum of whole source rows.
function* filterAxis(source, sourceSize, targetSize, channels, axis, taps) {
  const [width, height, depth] = sourceSize;
  const outWidth = axis === 0 ? targetSize : width;
  const outHeight = axis === 1 ? targetSize : height;
  const outDepth = axis === 2 ? targetSize : depth;
  const target = new Float32Array(outWidth * outHeight * outDepth * channels);
  const { indices, weights, count } = taps;

  if (axis === 0) {
    const offsets = indices.map((index) => index * channels);

    for (let row = 0; row < height * depth; row++) {
      const sourceRow = row * width * channels;
      const targetRow = row * outWidth * channels;

      for (let x = 0; x < outWidth; x++) {
        for (let channel = 0; channel < channels; channel++) {
          let value = 0.0;

          for (let tap = x * count; tap < (x + 1) * count; tap++) {
            value += source[sourceRow + offsets[tap] + channel] * weights[tap];
          }

          target[targetRow + x * channels + channel] = value;
        }
      }

      yield;
    }

    return target;
  }

  const rowLength = width * channels;

  for (let z = 0; z < outDepth; z++) {
    for (let y = 0; y < outHeight; y++) {
      const targetRow = (y + z * outHeight) * rowLength;
      const t = axis === 1 ? y : z;

      for (let tap = t * count; tap < (t + 1) * count; tap++) {
        const index = indices[tap];
        const weight = weights[tap];
        const sourceRow = (axis === 1 ? index + z * height : y + index * height) * rowLength;

        for (let i = 0; i < rowLength; i++) {
          target[targetRow + i] += source[sourceRow + i] * weight;
        }
      }

      yield;
    }
  }

  return target;
}

// NOTE Levels 1 to levelCount as { data (Uint8Array), width, height, depth }
export function* buildGaussianLevels(data, width, height, depth, channels, levelCount, sizeMode) {
  const levels = [];
  let current = data;
  let size = [width, height, depth];

  for (let level = 1; level <= levelCount; level++) {
    const next = [0, 1, 2].map((axis) => getLevelSize([width, height, depth][axis], level, sizeMode));

    const filteredX = yield* filterAxis(current, size, next[0], channels, 0, createAxisTaps(size[0], next[0]));
    const filteredY = yield* filterAxis(
      filteredX,
      [next[0], size[1], size[2]],
      next[1],
      channels,
      1,
      createAxisTaps(size[1], next[1]),
    );
    const filtered = yield* filterAxis(
      filteredY,
      [next[0], next[1], size[2]],
      next[2],
      channels,
      2,
      createAxisTaps(size[2], next[2]),
    );

    const bytes = new Uint8Array(filtered.length);

    for (let i = 0; i < filtered.length; i++) {
      bytes[i] = Math.min(255, Math.max(0, Math.round(filtered[i])));
    }

    levels.push({ data: bytes, width: next[0], height: next[1], depth: next[2] });

    // NOTE The next level filters the float values. Rounding errors do not add up.
    current = filtered;
    size = next;
  }

  return levels;
}

// NOTE Results for each data array: Map of key -> { levels } (null while the build runs)
const cache = new WeakMap();
const queue = [];
let process = null;

const runQueue = () => {
  const startTime = globalThis.performance.now();

  while (queue.length > 0 && globalThis.performance.now() - startTime < 12) {
    const job = queue[0];
    const { value, done } = job.task.next();

    if (done) {
      job.entry.levels = value;
      queue.shift();
    }
  }

  process = queue.length > 0 ? setTimeout(runQueue, 0) : null;
};

// NOTE Gaussian levels 1 to levelCount of the data. null while the build runs: the first call starts it.
export const requestGaussianLevels = (data, width, height, depth, channels, levelCount, sizeMode) => {
  const key = `${width}x${height}x${depth}x${channels}:${levelCount}:${sizeMode}`;
  let entries = cache.get(data);

  if (!entries) {
    entries = new Map();
    cache.set(data, entries);
  }

  let entry = entries.get(key);

  if (!entry) {
    entry = { levels: null };
    entries.set(key, entry);
    queue.push({
      entry,
      task: buildGaussianLevels(data, width, height, depth, channels, levelCount, sizeMode),
    });

    if (!process) {
      process = setTimeout(runQueue, 0);
    }
  }

  return entry.levels;
};

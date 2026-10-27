import {
  brickVoxels,
  decodeWVDBMask,
  decodeWVDBPage,
  getBrickTotal,
  getWVDBChunks,
  isWVDBBrickStored,
  readWVDBHeader,
  wvdbLayouts,
} from 'openvdb';
import { wvdbKernel } from './wvdbKernel';

const { writeBricks, fillTexels } = wvdbKernel(decodeWVDBPage, decodeWVDBMask);

const workerSource = `
const kernel = (${wvdbKernel.toString()})(
  (${decodeWVDBPage.toString()}),
  (${decodeWVDBMask.toString()})
);
let queue = Promise.resolve();

self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      const result = await kernel[data.type](data.payload);
      const transfer = result
        ? [result.data, result.indices, result.texels, result.words]
            .filter(Boolean)
            .map((array) => array.buffer)
        : [];

      self.postMessage({ result }, transfer);
    } catch (error) {
      self.postMessage({ error: String((error && error.message) || error) });
    }
  });
};
`;

const createWorkerBackend = () => {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
    return null;
  }

  const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
  const worker = new Worker(url);
  const pending = [];

  const request = (type, payload, transfer = []) =>
    new Promise((resolve, reject) => {
      pending.push({ resolve, reject });
      worker.postMessage({ type, payload }, transfer);
    });

  worker.onmessage = ({ data }) => {
    const next = pending.shift();

    if (data.error) {
      next?.reject(data.error);
    } else {
      next?.resolve(data.result);
    }
  };

  worker.onerror = (event) => {
    event.preventDefault();
    pending.splice(0).forEach(({ reject }) => reject(event.message || 'Worker error'));
  };

  return {
    // NOTE The worker answers each message in order. Create waits in the queue too.
    create: (config) => request('create', config),
    chunk: (chunk) => request('chunk', chunk, [chunk.bytes.buffer]),
    // NOTE Release requests that wait for the stopped worker
    dispose: () => {
      worker.terminate();
      URL.revokeObjectURL(url);
      pending.splice(0).forEach(({ resolve }) => resolve(null));
    },
  };
};

const createLocalBackend = () => {
  const kernel = wvdbKernel(decodeWVDBPage, decodeWVDBMask);
  let queue = Promise.resolve();
  let disposed = false;

  return {
    create: (config) => kernel.create(config),
    chunk: (chunk) => {
      const result = queue.then(() => (disposed ? null : kernel.chunk(chunk)));
      queue = result.catch(() => null);

      return result;
    },
    dispose: () => {
      disposed = true;
    },
  };
};

const toByte = (value) => (Math.min(Math.max(value, 0.0), 1.0) * 255.0) | 0;

// NOTE One texel of background: density for scalar grids, RGBA for vector grids
const getBackgroundTexel = ({ class: gridClass, background, channels = 1 }, scale) => {
  if (channels === 3) {
    return [...background.map(toByte), 255];
  }

  return [gridClass === 'level set' ? 0 : toByte(background / scale)];
};

// NOTE Reads a .wvdb stream. Each grid gets one texture (Uint8Array) at the size of the final LOD:
// density for scalar grids, RGBA for vector grids. Coarse LODs fill it first.
// Each next LOD replaces them while the download continues.
export class WVDBReader {
  header = null;
  grids = {};
  finalLod = 0;
  bytesLoaded = 0;
  bytesTotal = 0;
  done = false;

  cancelled = false;
  backend = null;
  streamReader = null;

  // NOTE scales: { gridName: scale }. Density is value / scale, same as emissiveScale of three-openvdb.
  constructor({ maxLod = Infinity, scales = {} } = {}) {
    this.maxLod = maxLod;
    this.scales = scales;
  }

  // NOTE onHeader(reader) runs when the header is read. onUpdate(event) runs after each change to grid data.
  async load(url, { onHeader, onUpdate } = {}) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Could not load ${url} (${response.status}).`);
    }

    if (!response.body) {
      throw new Error('Streams are not supported.');
    }

    this.streamReader = response.body.getReader();

    let pending = new Uint8Array(0);
    let buffer = null;
    let chunks = null;
    let nextChunk = 0;
    let dataStart = 0;

    const tasks = [];

    const dispatchChunks = () => {
      while (nextChunk < chunks.length) {
        const chunk = chunks[nextChunk];
        const start = dataStart + chunk.offset;

        if (start + chunk.length > this.bytesLoaded) {
          break;
        }

        nextChunk++;

        // NOTE The copy goes to the worker. The file buffer stays complete.
        const task = this.backend.chunk({
          gridIndex: chunk.gridIndex,
          lod: chunk.lod,
          kind: chunk.kind,
          firstIndex: chunk.firstIndex,
          bytes: buffer.slice(start, start + chunk.length),
        });

        tasks.push(
          task.then((result) => {
            if (!this.cancelled) {
              this.apply(chunk, result, onUpdate);
            }
          })
        );
      }
    };

    try {
      while (!this.cancelled) {
        const { done, value } = await this.streamReader.read();

        if (done || this.cancelled) {
          break;
        }

        if (!buffer) {
          const joined = new Uint8Array(pending.length + value.length);
          joined.set(pending);
          joined.set(value, pending.length);
          pending = joined;
          this.bytesLoaded = pending.length;

          const result = readWVDBHeader(pending);

          if (!result) {
            continue;
          }

          this.header = result.header;
          dataStart = result.dataStart;
          chunks = this.prepare();

          const end = chunks.reduce((max, { offset, length }) => Math.max(max, offset + length), 0);
          this.bytesTotal = dataStart + end;

          buffer = new Uint8Array(this.bytesTotal);
          buffer.set(pending.subarray(0, Math.min(pending.length, this.bytesTotal)));
          pending = null;

          if (onHeader) {
            onHeader(this);
          }

          // NOTE A file with no grids has no chunks. It is done at once.
          if (!chunks.length) {
            this.done = true;

            if (onUpdate) {
              onUpdate({ reader: this, grid: null, lod: -1, lodComplete: true, done: true });
            }
          }
        } else {
          const length = Math.min(value.length, this.bytesTotal - this.bytesLoaded);

          buffer.set(value.subarray(0, length), this.bytesLoaded);
          this.bytesLoaded += length;
        }

        this.bytesLoaded = Math.min(this.bytesLoaded, this.bytesTotal);
        dispatchChunks();

        // NOTE All chunks up to maxLod are here. Stop the download.
        if (nextChunk === chunks.length) {
          this.streamReader.cancel().catch(() => {});
          break;
        }
      }

      if (!this.cancelled && (!chunks || nextChunk < chunks.length)) {
        throw new Error('The WVDB file is incomplete.');
      }

      await Promise.all(tasks);
    } finally {
      this.backend?.dispose();
    }

    return this;
  }

  // NOTE Makes the grid textures and the chunk list from the header
  prepare() {
    const { grids, bake } = this.header;

    this.finalLod = Math.min(Math.max(Math.floor(this.maxLod), 0), bake.lods - 1);

    const getScale = ({ name }) => this.scales[name] || 1.0;

    grids.forEach((grid) => {
      const dimensions = grid.lods[this.finalLod].dimensions;
      const backgroundTexel = getBackgroundTexel(grid, getScale(grid));
      const texelSize = backgroundTexel.length;

      this.grids[grid.name] = {
        name: grid.name,
        class: grid.class,
        channels: grid.channels || 1,
        bbox: grid.bbox,
        dimensions,
        texelSize,
        backgroundTexel,
        data: fillTexels(
          new Uint8Array(dimensions[0] * dimensions[1] * dimensions[2] * texelSize),
          backgroundTexel
        ),
        // NOTE Last LOD written to data. -1 before the first one.
        lod: -1,
        chunksLeft: grid.lods.map(({ mask, pages }) => pages.length + (mask ? 1 : 0)),
        hasTexture: grid.lods.map(() => false),
      };
    });

    this.backend = createWorkerBackend() || createLocalBackend();
    this.backend.create({
      bits: bake.bits,
      finalLod: this.finalLod,
      grids: grids.map((grid) => ({
        class: grid.class,
        background: grid.background,
        channels: grid.channels || 1,
        scale: getScale(grid),
        backgroundTexel: getBackgroundTexel(grid, getScale(grid)),
        lods: grid.lods.map(({ dimensions, mask, pages }) => ({
          dimensions,
          layout: mask ? wvdbLayouts.sparse : wvdbLayouts.dense,
          pages: pages.length,
        })),
      })),
    });

    return getWVDBChunks(this.header, this.finalLod);
  }

  apply(chunk, result, onUpdate) {
    const headerGrid = this.header.grids[chunk.gridIndex];
    const grid = this.grids[headerGrid.name];
    const { lod } = chunk;

    if (result?.type === 'texture') {
      grid.data.set(result.data);
      grid.hasTexture[lod] = true;
    } else if (result?.type === 'mask') {
      this.clearMissingBricks(grid, result.words);
    } else if (result?.type === 'bricks') {
      writeBricks(grid.data, grid.dimensions, result.indices, result.texels, grid.texelSize);
    }

    grid.chunksLeft[lod]--;

    const lodComplete = grid.chunksLeft[lod] === 0;

    // NOTE A coarse sparse LOD with no bricks is all background
    if (lodComplete && lod !== this.finalLod && !grid.hasTexture[lod]) {
      fillTexels(grid.data, grid.backgroundTexel);
    }

    if (result || lodComplete) {
      grid.lod = Math.max(grid.lod, lod);
    }

    this.done = Object.values(this.grids).every(({ chunksLeft }) =>
      chunksLeft.slice(0, this.finalLod + 1).every((left) => left === 0)
    );

    if (onUpdate && (result || lodComplete)) {
      onUpdate({ reader: this, grid, lod, lodComplete, done: this.done });
    }
  }

  // NOTE Bricks of the final LOD that the file does not store are background
  clearMissingBricks(grid, words) {
    const background = fillTexels(
      new Uint8Array(brickVoxels * grid.texelSize),
      grid.backgroundTexel
    );
    const total = getBrickTotal(grid.dimensions);

    for (let index = 0; index < total; index++) {
      if (!isWVDBBrickStored(words, index)) {
        writeBricks(grid.data, grid.dimensions, [index], background, grid.texelSize);
      }
    }
  }

  cancel() {
    this.cancelled = true;
    this.streamReader?.cancel().catch(() => {});
    this.backend?.dispose();
  }
}

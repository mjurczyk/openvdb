import { decodeWVDBMask, decodeWVDBPage, getWVDBChunks, readWVDBHeader, wvdbLayouts } from 'openvdb';
import { wvdbKernel } from './wvdbKernel';

const { fillTexels } = wvdbKernel(decodeWVDBPage, decodeWVDBMask);

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

      self.postMessage({ result }, result && result.data ? [result.data.buffer] : []);
    } catch (error) {
      self.postMessage({ error: String((error && error.message) || error) });
    }
  });
};
`;

// NOTE Each worker answers its messages in order
const createWorkerBackend = (url) => {
  const worker = new Worker(url);
  const pending = [];

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
    request: (type, payload, transfer = []) =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
        worker.postMessage({ type, payload }, transfer);
      }),
  };
};

const createLocalBackend = () => {
  const kernel = wvdbKernel(decodeWVDBPage, decodeWVDBMask);
  let queue = Promise.resolve();

  return {
    request: (type, payload) => {
      const result = queue.then(() => kernel[type](payload));
      queue = result.catch(() => null);

      return result;
    },
  };
};

// NOTE All readers share a few workers. A sequence can have hundreds of files.
let backends = null;
let nextReaderId = 0;

const getBackend = (readerId) => {
  if (!backends) {
    if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
      const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2;

      backends = Array.from({ length: Math.min(Math.max(cores - 1, 1), 4) }, () =>
        createWorkerBackend(url)
      );
    } else {
      backends = [createLocalBackend()];
    }
  }

  return backends[readerId % backends.length];
};

const toByte = (value) => (Math.min(Math.max(value, 0.0), 1.0) * 255.0) | 0;

// NOTE One texel of background: density for scalar grids, RGBA for vector grids
const getBackgroundTexel = ({ class: gridClass, background, channels = 1 }, scale) => {
  if (channels === 3) {
    return [...background.map(toByte), 255];
  }

  return [gridClass === 'level set' ? 0 : toByte(background / scale)];
};

// NOTE Reads a .wvdb file. Each grid has one texture (Uint8Array): density for scalar grids, RGBA for vector grids.
// Each LOD gives a new texture at its own size. LOD 0 first, then each next LOD replaces it.
// load() reads the file as a stream. loadMore() reads more LODs later with a Range request.
export class WVDBReader {
  url = null;
  header = null;
  grids = {};
  finalLod = 0;
  // NOTE Last LOD whose chunks were read. -1 before the first one.
  loadedLod = -1;
  bytesLoaded = 0;
  bytesTotal = 0;
  done = false;
  cancelled = false;

  dataStart = 0;
  streamReader = null;

  // NOTE scales: { gridName: scale }. Density is value / scale, same as emissiveScale of FrameVolume.
  constructor({ maxLod = Infinity, scales = {} } = {}) {
    this.maxLod = maxLod;
    this.scales = scales;
    this.readerId = nextReaderId++;
    this.backend = getBackend(this.readerId);
  }

  // NOTE Reads the header and LOD 0 to untilLod in one stream.
  // onHeader(reader) runs when the header is read. onUpdate(event) runs after each texture change.
  async load(url, { onHeader, onUpdate, untilLod = Infinity } = {}) {
    this.url = url;

    await this.read(untilLod, { onHeader, onUpdate });

    return this;
  }

  // NOTE Reads the next LODs, up to untilLod. Only their bytes are requested.
  async loadMore(untilLod, { onUpdate } = {}) {
    if (!this.header) {
      throw new Error('Call load() first.');
    }

    await this.read(untilLod, { onUpdate });

    return this;
  }

  async read(untilLod, { onHeader, onUpdate }) {
    if (this.cancelled || (this.header && this.loadedLod >= Math.min(untilLod, this.finalLod))) {
      return;
    }

    // NOTE Bytes of the request. Without a header, the request starts at byte 0.
    let chunks = null;
    let rangeStart = 0;
    let headers = {};

    if (this.header) {
      chunks = this.getChunks(untilLod);
      rangeStart = this.dataStart + chunks[0].offset;

      const rangeEnd = this.dataStart + Math.max(...chunks.map(({ offset, length }) => offset + length));
      headers = { Range: `bytes=${rangeStart}-${rangeEnd - 1}` };
    }

    const response = await fetch(this.url, { headers }).catch((error) => {
      // NOTE Some URLs (for example blob: URLs in some browsers) do not take a Range header
      if (headers.Range) {
        return fetch(this.url);
      }

      throw error;
    });

    if (!response.ok) {
      throw new Error(`Could not load ${this.url} (${response.status}).`);
    }

    if (!response.body) {
      throw new Error('Streams are not supported.');
    }

    // NOTE Servers without Range support send the full file (status 200). Then bytes start at 0.
    const responseStart = response.status === 206 ? rangeStart : 0;

    this.streamReader = response.body.getReader();

    let buffer = new Uint8Array(0);
    let received = 0;
    let nextChunk = 0;

    const tasks = [];

    const append = (value) => {
      if (received + value.length > buffer.length) {
        const grown = new Uint8Array(Math.max(buffer.length * 2, received + value.length));
        grown.set(buffer.subarray(0, received));
        buffer = grown;
      }

      buffer.set(value, received);
      received += value.length;
    };

    const dispatchChunks = () => {
      while (nextChunk < chunks.length) {
        const chunk = chunks[nextChunk];
        const start = this.dataStart + chunk.offset - responseStart;

        if (start + chunk.length > received) {
          break;
        }

        nextChunk++;

        const bytes = buffer.slice(start, start + chunk.length);
        const task = this.backend.request(
          'chunk',
          {
            readerId: this.readerId,
            gridIndex: chunk.gridIndex,
            lod: chunk.lod,
            kind: chunk.kind,
            firstIndex: chunk.firstIndex,
            bytes,
          },
          [bytes.buffer]
        );

        tasks.push(
          task.then((result) => {
            if (!this.cancelled) {
              this.apply(chunk, result, onUpdate);
            }
          })
        );
      }
    };

    while (!this.cancelled) {
      const { done, value } = await this.streamReader.read();

      if (done || this.cancelled) {
        break;
      }

      append(value);
      this.bytesLoaded += value.length;

      if (!this.header) {
        const result = readWVDBHeader(buffer.subarray(0, received));

        if (!result) {
          continue;
        }

        this.header = result.header;
        this.dataStart = result.dataStart;
        this.prepare();

        chunks = this.getChunks(untilLod);

        if (onHeader) {
          onHeader(this);
        }

        // NOTE A file with no grids has no chunks. It is done at once.
        if (!chunks.length) {
          this.done = true;
          this.loadedLod = this.finalLod;

          if (onUpdate) {
            onUpdate({ reader: this, grid: null, lod: -1, lodComplete: true, done: true });
          }
        }
      }

      dispatchChunks();

      // NOTE All chunks of this request are here. Stop the download.
      if (nextChunk === chunks.length) {
        this.streamReader.cancel().catch(() => {});
        break;
      }
    }

    if (!this.cancelled && (!chunks || nextChunk < chunks.length)) {
      throw new Error('The WVDB file is incomplete.');
    }

    await Promise.all(tasks);

    if (chunks.length) {
      this.loadedLod = Math.max(...chunks.map(({ lod }) => lod));
    }

    this.done = this.loadedLod >= this.finalLod;

    if (this.done) {
      this.release();
    }
  }

  // NOTE Chunks after loadedLod, up to untilLod and finalLod
  getChunks(untilLod) {
    return getWVDBChunks(this.header, Math.min(untilLod, this.finalLod)).filter(
      ({ lod }) => lod > this.loadedLod
    );
  }

  // NOTE Makes the grids and sends the header data to the worker
  prepare() {
    const { grids, bake } = this.header;
    const getScale = ({ name }) => this.scales[name] || 1.0;

    this.finalLod = Math.min(Math.max(Math.floor(this.maxLod), 0), bake.lods - 1);
    this.bytesTotal =
      this.dataStart +
      getWVDBChunks(this.header, this.finalLod).reduce(
        (end, { offset, length }) => Math.max(end, offset + length),
        0
      );

    grids.forEach((grid) => {
      const backgroundTexel = getBackgroundTexel(grid, getScale(grid));

      this.grids[grid.name] = {
        name: grid.name,
        class: grid.class,
        channels: grid.channels || 1,
        bbox: grid.bbox,
        texelSize: backgroundTexel.length,
        // NOTE One background texel until LOD 0 arrives
        dimensions: [1, 1, 1],
        data: fillTexels(new Uint8Array(backgroundTexel.length), backgroundTexel),
        // NOTE LOD of data. -1 before LOD 0.
        lod: -1,
        chunksLeft: grid.lods.map(({ mask, pages }) => pages.length + (mask ? 1 : 0)),
      };
    });

    this.backend.request('create', {
      readerId: this.readerId,
      config: {
        bits: bake.bits,
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
      },
    });
  }

  apply(chunk, result, onUpdate) {
    const grid = this.grids[this.header.grids[chunk.gridIndex].name];
    const { lod } = chunk;

    grid.chunksLeft[lod]--;

    if (result) {
      grid.data = result.data;
      grid.dimensions = this.header.grids[chunk.gridIndex].lods[lod].dimensions;
      grid.lod = lod;
    }

    const lodComplete = grid.chunksLeft[lod] === 0;

    if (onUpdate && (result || lodComplete)) {
      onUpdate({
        reader: this,
        grid,
        lod,
        lodComplete,
        done: this.isComplete(),
      });
    }
  }

  isComplete() {
    return Object.values(this.grids).every(({ chunksLeft }) =>
      chunksLeft.slice(0, this.finalLod + 1).every((left) => left === 0)
    );
  }

  release() {
    this.backend.request('release', { readerId: this.readerId }).catch(() => {});
  }

  cancel() {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;
    this.streamReader?.cancel().catch(() => {});
    this.release();
  }
}

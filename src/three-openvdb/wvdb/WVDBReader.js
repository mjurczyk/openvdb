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
// The file is one request without a Range header. Hosts can compress responses, and then byte ranges
// do not match the file. The reader keeps the bytes as they arrive and decodes LODs from them.
export class WVDBReader {
  url = null;
  header = null;
  grids = {};
  finalLod = 0;
  // NOTE Last LOD that decode() has started. -1 before the first one.
  loadedLod = -1;
  bytesLoaded = 0;
  bytesTotal = 0;
  done = false;
  cancelled = false;

  dataStart = 0;
  chunks = [];
  streamReader = null;

  // NOTE File bytes, kept until all LODs are decoded
  buffer = new Uint8Array(0);
  received = 0;
  // NOTE Promises that wait for a number of received bytes
  waiters = [];
  streamError = null;
  streamEnded = false;

  // NOTE scales: { gridName: scale }. Density is value / scale, same as emissiveScale of FrameVolume.
  constructor({ maxLod = Infinity, scales = {} } = {}) {
    this.maxLod = maxLod;
    this.scales = scales;
    this.readerId = nextReaderId++;
    this.backend = getBackend(this.readerId);

    this.headerReady = new Promise((resolve, reject) => {
      this.resolveHeader = resolve;
      this.rejectHeader = reject;
    });
    this.headerReady.catch(() => {});
  }

  // NOTE Reads the header and decodes LOD 0 to untilLod. The download continues to the last LOD,
  // so loadMore() can decode the next LODs later.
  // onHeader(reader) runs when the header is read. onUpdate(event) runs after each texture change.
  async load(url, { onHeader, onUpdate, untilLod = Infinity } = {}) {
    this.start(url, { onHeader });

    await this.decode(untilLod, { onUpdate });

    return this;
  }

  // NOTE Decodes the next LODs, up to untilLod, from the same download
  async loadMore(untilLod, { onUpdate } = {}) {
    await this.decode(untilLod, { onUpdate });

    return this;
  }

  // NOTE Starts the download. Returns the stream promise. It ends when the bytes of the last LOD are in.
  start(url, { onHeader } = {}) {
    if (!this.streaming) {
      this.url = url;
      this.streaming = this.stream(onHeader).catch((error) => {
        this.streamError = error;
        this.rejectHeader(error);
        this.wakeWaiters();
      });
    }

    return this.streaming;
  }

  async stream(onHeader) {
    const response = await fetch(this.url);

    if (!response.ok) {
      throw new Error(`Could not load ${this.url} (${response.status}).`);
    }

    if (!response.body) {
      throw new Error('Streams are not supported.');
    }

    this.streamReader = response.body.getReader();

    while (!this.cancelled) {
      const { done, value } = await this.streamReader.read();

      if (done || this.cancelled) {
        break;
      }

      this.receive(value, onHeader);

      // NOTE All bytes up to the last LOD are here. Stop the download.
      if (this.received >= this.bytesTotal) {
        this.streamReader.cancel().catch(() => {});
        break;
      }
    }

    this.streamEnded = true;

    if (!this.header && !this.cancelled) {
      throw new Error('Not a complete WVDB file.');
    }

    this.wakeWaiters();
  }

  // NOTE Keeps the bytes, reads the header when it is complete and wakes the waiting chunks
  receive(value, onHeader) {
    this.append(value);

    if (!this.header) {
      const result = readWVDBHeader(this.buffer.subarray(0, this.received));

      if (result) {
        this.header = result.header;
        this.dataStart = result.dataStart;
        this.prepare();
        this.chunks = getWVDBChunks(this.header, this.finalLod);

        if (onHeader) {
          onHeader(this);
        }

        this.resolveHeader();
      }
    }

    this.wakeWaiters();
  }

  // NOTE Reads the header and decodes LOD 0 to untilLod with requests for the first bytes of the file only.
  // Each LOD is after the LODs before it, so the bytes of LOD 0 to untilLod are one prefix of the file.
  // A prefix request also works when the host compresses the response: a prefix of the compressed
  // stream decodes to a prefix of the file. The cost is that each request reads the earlier LODs again.
  async loadLods(url, untilLod, { onHeader, onUpdate } = {}) {
    this.url = url;

    const fetching = this.fetchPrefix(untilLod, onHeader).catch((error) => {
      this.streamError = error;
      this.rejectHeader(error);
      this.wakeWaiters();
    });

    await this.decode(untilLod, { onUpdate });
    await fetching;

    return this;
  }

  // NOTE Byte position after the last chunk of LOD 0 to lod
  getLodEnd(lod) {
    return this.chunks
      .filter((chunk) => chunk.lod <= lod)
      .reduce((end, { offset, length }) => Math.max(end, this.dataStart + offset + length), this.dataStart);
  }

  async fetchPrefix(untilLod, onHeader) {
    // NOTE Before the header is known, the first request reads this many bytes
    const firstRequest = 16 * 1024;
    const getEnd = () =>
      this.header ? this.getLodEnd(Math.min(untilLod, this.finalLod)) : firstRequest;

    // NOTE The header gives the real end. A file shorter than the first request is complete after it.
    while (!this.cancelled && this.received < getEnd()) {
      const received = this.received;

      await this.fetchRange(getEnd, onHeader);

      if (this.received === received && !this.cancelled) {
        throw new Error('The WVDB file is incomplete.');
      }
    }
  }

  async fetchRange(getEnd, onHeader) {
    // NOTE Compressed responses can be a little longer than the file bytes
    const requested = getEnd();
    const last = requested + Math.ceil(requested / 1000) + 1024 - 1;
    const response = await fetch(this.url, { headers: { Range: `bytes=0-${last}` } });

    if (!response.ok) {
      throw new Error(`Could not load ${this.url} (${response.status}).`);
    }

    this.streamReader = response.body.getReader();

    // NOTE File position of the next response byte. Prefix and full responses start at byte 0.
    let position = 0;

    try {
      while (!this.cancelled) {
        const { done, value } = await this.streamReader.read();

        if (done) {
          break;
        }

        const skip = Math.min(Math.max(this.received - position, 0), value.length);

        position += value.length;
        this.bytesLoaded += skip;

        if (skip < value.length) {
          this.receive(value.subarray(skip), onHeader);
        }

        if (this.header && this.received >= getEnd()) {
          this.streamReader.cancel().catch(() => {});
          break;
        }
      }
    } catch (error) {
      // NOTE A compressed prefix ends without the compression footer. Some browsers report an error then.
      if (!this.header || this.received < getEnd()) {
        throw error;
      }
    }
  }

  append(value) {
    // NOTE All LODs are decoded. The bytes are not needed.
    if (!this.buffer) {
      return;
    }

    // NOTE Bytes after the last LOD are not needed
    const limit = this.header ? this.bytesTotal : Infinity;
    const length = Math.max(0, Math.min(value.length, limit - this.received));

    if (this.received + length > this.buffer.length) {
      const size = this.header
        ? this.bytesTotal
        : Math.max(this.buffer.length * 2, this.received + length);
      const grown = new Uint8Array(size);

      grown.set(this.buffer.subarray(0, this.received));
      this.buffer = grown;
    }

    this.buffer.set(value.subarray(0, length), this.received);
    this.received += length;
    this.bytesLoaded += value.length;
  }

  wakeWaiters() {
    this.waiters = this.waiters.filter(({ end, resolve, reject }) => {
      if (this.received >= end) {
        resolve();
      } else if (this.streamError || this.cancelled || this.streamEnded) {
        reject(this.streamError || new Error('The WVDB file is incomplete.'));
      } else {
        return true;
      }

      return false;
    });
  }

  waitForBytes(end) {
    return new Promise((resolve, reject) => {
      this.waiters.push({ end, resolve, reject });
      this.wakeWaiters();
    });
  }

  // NOTE Decodes the chunks after loadedLod, up to untilLod. Each chunk goes to the worker when its bytes are in.
  async decode(untilLod, { onUpdate } = {}) {
    await this.headerReady;

    const lod = Math.min(untilLod, this.finalLod);

    if (this.cancelled || lod <= this.loadedLod) {
      return;
    }

    const chunks = this.chunks.filter((chunk) => chunk.lod > this.loadedLod && chunk.lod <= lod);
    const tasks = [];

    this.loadedLod = lod;

    // NOTE A file with no grids has no chunks. It is done at once.
    if (!this.chunks.length && onUpdate) {
      onUpdate({ reader: this, grid: null, lod: -1, lodComplete: true, done: true });
    }

    for (const chunk of chunks) {
      const start = this.dataStart + chunk.offset;

      await this.waitForBytes(start + chunk.length);

      if (this.cancelled) {
        return;
      }

      const bytes = this.buffer.slice(start, start + chunk.length);
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

    await Promise.all(tasks);

    this.done = this.loadedLod >= this.finalLod;

    if (this.done) {
      this.buffer = null;
      this.release();
    }
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
    this.rejectHeader(new Error('Cancelled.'));
    this.wakeWaiters();
    this.release();
  }
}

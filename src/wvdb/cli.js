// NOTE Node CLI. Converts .vdb files into .wvdb files. Uses only openvdb and Node built-in modules.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import * as os from 'node:os';
import { basename, dirname, extname, join } from 'node:path';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { constants, deflateSync } from 'node:zlib';
import { OpenVDBReader } from 'openvdb';
import { bakeDefaults, bakeWVDB, getWVDBBox, mergeWVDBBoxes } from './bake';
import { openZip } from './zip';

const usage = `Usage: wvdb <input>... [options]

Each input is a .vdb file, a folder of .vdb files, or a .zip of .vdb files.
Each .vdb file gives one .wvdb file. The files of a folder or ZIP are one sequence:
all frames use one box, so voxels do not move between frames.

Options:
  -o, --output <path>     One .vdb input: output file. Folder or ZIP input: output folder.
                          Default: next to the input (<folder>_wvdb/ for folders and ZIP files)
  --grids <a,b>           Grid names to keep. Default: all scalar grids
  --resolution <n>        Texels per side of the finest LOD. Default: ${bakeDefaults.resolution}
  --lods <n>              LOD count. Default: ${bakeDefaults.lods}
  --bits <8|16>           Quantization bits. Default: ${bakeDefaults.bits}
  --layout <sparse|dense> Brick layout. Default: ${bakeDefaults.layout}
  --page-bricks <n>       Bricks per page chunk. Default: ${bakeDefaults.pageBricks}
  -j, --jobs <n>          Files converted at the same time. Each job needs memory for one VDB.
                          Default: CPU core count
  -h, --help              Show this text
`;

const parseArgs = (args) => {
  const inputs = [];
  const options = {};
  let output = null;
  let jobs = os.availableParallelism?.() || os.cpus().length;

  const readValue = (index) => {
    if (index >= args.length) {
      throw new Error(`Missing value for ${args[index - 1]}`);
    }

    return args[index];
  };

  const readInteger = (index) => {
    const value = Number(readValue(index));

    if (!Number.isInteger(value)) {
      throw new Error(`${args[index - 1]} needs an integer`);
    }

    return value;
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    switch (arg) {
      case '-h':
      case '--help':
        return { help: true };
      case '-o':
      case '--output':
        output = readValue(++index);
        break;
      case '--grids':
        options.grids = readValue(++index).split(',').filter(Boolean);
        break;
      case '--resolution':
        options.resolution = readInteger(++index);
        break;
      case '--lods':
        options.lods = readInteger(++index);
        break;
      case '--bits':
        options.bits = readInteger(++index);
        break;
      case '--layout':
        options.layout = readValue(++index);
        break;
      case '--page-bricks':
        options.pageBricks = readInteger(++index);
        break;
      case '-j':
      case '--jobs':
        jobs = readInteger(++index);

        if (jobs < 1) {
          throw new Error('--jobs needs 1 or more');
        }
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`);
        }

        inputs.push(arg);
    }
  }

  if (!inputs.length) {
    throw new Error('No input files.');
  }

  if (output && inputs.length > 1) {
    throw new Error('--output needs one input.');
  }

  return { inputs, options, output, jobs };
};

const formatBytes = (bytes) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

// NOTE macOS writes "._" files and "__MACOSX" folders into folders and ZIP files
const isVDBName = (name) =>
  extname(name).toLowerCase() === '.vdb' &&
  !basename(name).startsWith('._') &&
  !name.split('/').includes('__MACOSX');

const toWVDBName = (name) => `${basename(name, extname(name))}.wvdb`;

// NOTE Returns [{ name, path, entry?, target }] for one input. ZIP sources have the entry name.
// Sources are plain data, so they can go to worker threads.
const listSources = (input, output) => {
  const stats = statSync(input);
  const outputFolder = output || join(dirname(input), `${basename(input, extname(input))}_wvdb`);

  if (stats.isDirectory()) {
    return {
      sources: readdirSync(input)
        .filter(isVDBName)
        .sort()
        .map((name) => ({
          name,
          path: join(input, name),
          target: join(outputFolder, toWVDBName(name)),
        })),
      outputFolder,
    };
  }

  if (extname(input).toLowerCase() === '.zip') {
    const zip = openZip(input);
    const names = zip.entries.map(({ name }) => name);

    zip.close();

    return {
      sources: names
        .filter(isVDBName)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map((entry) => ({
          name: basename(entry),
          path: input,
          entry,
          target: join(outputFolder, toWVDBName(entry)),
        })),
      outputFolder,
    };
  }

  return {
    sources: [
      {
        name: basename(input),
        path: input,
        target: output || join(dirname(input), toWVDBName(input)),
      },
    ],
  };
};

// NOTE Each thread opens each ZIP file one time
const zipFiles = {};

const readSource = ({ path, entry }) => {
  if (!entry) {
    return readFileSync(path);
  }

  if (!zipFiles[path]) {
    const zip = openZip(path);

    zipFiles[path] = Object.fromEntries(zip.entries.map((zipEntry) => [zipEntry.name, zipEntry]));
  }

  return zipFiles[path][entry].read();
};

const printLods = (fileSize, header) => {
  if (!header.grids.length) {
    return;
  }

  // NOTE Bytes needed to show each LOD, counted from the file start
  const chunkBytes = header.grids
    .flatMap(({ lods }) => lods.flatMap(({ mask, pages }) => [mask, ...pages].filter(Boolean)))
    .reduce((sum, { length }) => sum + length, 0);
  const headerEnd = fileSize - chunkBytes;

  for (let lod = 0; lod < header.bake.lods; lod++) {
    const chunks = header.grids.flatMap(({ lods }) =>
      [lods[lod].mask, ...lods[lod].pages].filter(Boolean)
    );
    const end = Math.max(...chunks.map(({ offset, length }) => offset + length));
    const lodBytes = chunks.reduce((sum, { length }) => sum + length, 0);
    const dimensions = header.grids[0].lods[lod].dimensions.join('x');
    const bricks = header.grids.reduce((sum, { lods }) => sum + lods[lod].bricks, 0);

    console.info(
      `  LOD ${lod}: ${dimensions}, ${bricks} bricks, ${formatBytes(lodBytes)}, ` +
        `loaded after ${formatBytes(headerEnd + end)}`
    );
  }
};

const readVDB = async (source, readOptions) => {
  const vdb = new OpenVDBReader();

  await vdb.read(new Uint8Array(source.buffer, source.byteOffset, source.length), readOptions);

  return vdb;
};

// NOTE The box needs the tree topology (active voxels). Leaf values are not read.
const getSourceBox = async ({ source, options }) =>
  getWVDBBox(await readVDB(readSource(source), { topologyOnly: true }), options.grids);

const convert = async ({ source, options }) => {
  const sourceBytes = readSource(source);
  const vdb = await readVDB(sourceBytes);

  const { bytes, header } = bakeWVDB(vdb, options, {
    compress: (data) => deflateSync(data, { level: constants.Z_BEST_COMPRESSION }),
    source: {
      file: source.name,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    },
  });

  writeFileSync(source.target, bytes);

  return { sourceSize: sourceBytes.length, fileSize: bytes.length, header };
};

const runJob = async (job) => {
  try {
    return { result: await (job.type === 'box' ? getSourceBox(job) : convert(job)) };
  } catch (error) {
    return { error: String(error.message || error) };
  }
};

// NOTE Runs jobs on worker threads, one job per thread at a time. onDone(job, { result, error }) runs when a job is done.
const runJobs = async (jobs, threadCount, onDone) => {
  const count = Math.min(threadCount, jobs.length);

  if (count <= 1) {
    for (const job of jobs) {
      onDone(job, await runJob(job));
    }

    return;
  }

  let next = 0;

  await Promise.all(
    Array.from(
      { length: count },
      () =>
        new Promise((resolve, reject) => {
          const worker = new Worker(new URL(import.meta.url));
          let current = null;

          const take = () => {
            if (next >= jobs.length) {
              worker.terminate().then(resolve);

              return;
            }

            current = jobs[next++];
            worker.postMessage(current);
          };

          worker.on('message', (message) => {
            onDone(current, message);
            take();
          });

          worker.on('error', reject);

          take();
        })
    )
  );
};

const main = async () => {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage);
    process.exit(1);
  }

  if (args.help) {
    console.info(usage);

    return;
  }

  const { inputs, options, output, jobs } = args;

  for (const input of inputs) {
    let listing;

    try {
      listing = listSources(input, output);
    } catch (error) {
      console.error(`${input}: ${error.message || error}`);
      process.exitCode = 1;
      continue;
    }

    const { sources, outputFolder } = listing;

    if (!sources.length) {
      console.error(`${input}: no .vdb files.`);
      process.exitCode = 1;
    }

    if (outputFolder && sources.length) {
      mkdirSync(outputFolder, { recursive: true });
    }

    const onError = (source, error) => {
      console.error(`${source.name}: ${error}`);
      process.exitCode = 1;
    };

    // NOTE First pass over a sequence: the box of all frames
    let bbox = null;

    if (sources.length > 1) {
      await runJobs(
        sources.map((source) => ({ type: 'box', source, options })),
        jobs,
        ({ source }, { result, error }) => {
          if (error) {
            onError(source, error);
          } else {
            bbox = mergeWVDBBoxes(bbox, result);
          }
        }
      );
    }

    const convertOptions = sources.length > 1 ? { ...options, bbox } : options;

    let totalSource = 0;
    let totalOutput = 0;

    await runJobs(
      sources.map((source) => ({ type: 'convert', source, options: convertOptions })),
      jobs,
      ({ source }, { result, error }) => {
        if (error) {
          onError(source, error);

          return;
        }

        const { sourceSize, fileSize, header } = result;

        totalSource += sourceSize;
        totalOutput += fileSize;

        console.info(
          `${source.name} (${formatBytes(sourceSize)}) -> ${source.target} (${formatBytes(fileSize)})`
        );

        if (sources.length === 1) {
          printLods(fileSize, header);
        }
      }
    );

    if (sources.length > 1) {
      console.info(
        `${input}: ${sources.length} files, ${formatBytes(totalSource)} -> ${formatBytes(totalOutput)}`
      );
    }
  }
};

// NOTE Worker threads run the same file. They take jobs from the main thread.
if (isMainThread) {
  main();
} else {
  parentPort.on('message', async (job) => {
    parentPort.postMessage(await runJob(job));
  });
}

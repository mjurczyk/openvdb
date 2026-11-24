# webvdb

The `wvdb` CLI. Converts `.vdb` files into `.wvdb` files: small files that stream in LODs. Needs only Node.js 18 or newer. No three.js, no browser.

```sh
npm install -g webvdb                # or run once: npx webvdb <input>

wvdb bunny_cloud.vdb                 # bunny_cloud.vdb (80.17 MB) -> bunny_cloud.wvdb (405.1 KB)
wvdb ./explosion_VDB                 # folder of .vdb files -> ./explosion_VDB_wvdb/
wvdb ./explosion_VDB.zip             # ZIP of .vdb files -> ./explosion_VDB_wvdb/
wvdb explosion.vdb --resolution 256 --lods 4
```

## Options

- `-o, --output <path>` - one `.vdb` input: output file. Folder or ZIP input: output folder. Default: next to the input.
- `--grids <a,b>` - grid names to keep. Default: all scalar, vector and point data grids.
- `--resolution <n>` - (default: `128`) texels on the longest box side of the finest LOD.
- `--lods <n>` - (default: `3`) LOD count.
- `--bits <8|16>` - (default: `8`) quantization bits.
- `--layout <sparse|dense>` - (default: `sparse`) brick layout.
- `--page-bricks <n>` - (default: `1024`) bricks per page chunk.
- `--max-points <n>` - (default: `4000000`) points kept of each point data grid. Above it, every n-th point is kept.
- `-j, --jobs <n>` - (default: CPU core count) files converted at the same time. Each job needs memory for one VDB.

## Output

Each `.vdb` file gives one `.wvdb` file, also empty frames, so a sequence keeps its frame numbers. All grids of a file use one box. All frames of a folder or ZIP use one box, so voxels do not move between frames.

Scalar and vector grids become voxel LODs. Point data grids become points grids: positions (16-bit in the box of each chunk) and colors (`Cd`, 8-bit). Each LOD adds approximately 8 times the points of the LOD before it. Files with points grids are format version 2, other files version 1.

Format: [WebVDB format specification](https://github.com/mjurczyk/openvdb/blob/main/src/docs/wvdb/README.md).

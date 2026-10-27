# WVDB

## a) Purpose

VDB files are the source of truth for volumes (smoke, fire, clouds, level sets). They are made for offline tools: full float precision, full resolution, all grids, all metadata. One frame is 10-500 MB. That is too large to download on a web page, and the browser uses only a small part of it: renderers resample each grid into one 3D texture of approximately 100-256 texels per side.

WVDB (`.wvdb`) is a delivery format made from a VDB file. It keeps only what a web renderer uses, in an order that lets the renderer show the volume before the download is complete.

- The VDB file stays the source of truth. A `.wvdb` file is made again from it at any time. Its header stores the SHA-256 of the source VDB and the bake options. The same input and options give the same bytes.
- The artist uses the `wvdb` CLI (npm package `webvdb`): `wvdb explosion.vdb`, a folder, or a ZIP of a sequence. It needs only Node.js. No three.js, no browser.
- The web developer loads `.wvdb` files with `WVDBLoader` / `WVDBAnimationLoader` of `three-openvdb` (or reads them with the `openvdb` format helpers in other engines).

Results with the default options (128³, 3 LODs, 8 bits, sparse):

| Source | `.vdb` | LOD 0 shows after | LOD 1 shows after | Full `.wvdb` |
| --- | --- | --- | --- | --- |
| bunny_cloud | 80.17 MB | 9.8 KB | 66.1 KB | 405.1 KB |
| venusstatue (level set) | 26.21 MB | 8.4 KB | 41.1 KB | 181.1 KB |
| utahteapot (level set) | 18.52 MB | 4.7 KB | 21.3 KB | 89.7 KB |
| smoke | 2.40 MB | 14.7 KB | 116.7 KB | 789.7 KB |
| ground_explosion, 200 frames (EmberGen, one box for all frames) | 1273.40 MB | | | 57.31 MB |

## b) Proposal: the format

### Data model

- A `.wvdb` file has the scalar grids (1 channel, for example `density`, `flames`, `temperature`) and vector grids (3 channels, for example colour) of the VDB file. Empty grids are kept, with only background values. Then all frames of a sequence have the same grids.
- All grids of a file use one world box: the box of all its non-empty grids. Emission and colour grids then line up with density. A sequence (folder or ZIP) uses one box for all frames, so voxels do not move between frames. The box is in `bake.bbox`.
- Each grid has LODs. The finest LOD is `resolution`³ point samples at texel centres over the box. Each coarser LOD is a 2× box filter of the next finer LOD. Vector grids are filtered one channel at a time.
- Each LOD is cut into bricks of 8³ voxels. Bricks are numbered x first, then y, then z. Voxels outside the LOD copy the nearest edge voxel.
- Each channel of each brick is quantized with its own min and max (8 or 16 bits). A brick channel with min = max stores no codes. The file stores the real values, so emission grids keep values above 1.
- Level sets store only the narrow band: values clamp to ±background, inactive voxels are ±background. Active values stay one quantization step inside the band, so they never decode as inactive.
- Sparse layout: bricks with only background values are not stored, and a mask tells which bricks are stored. Stored bricks are sorted by importance (sum of |value - background|, then index). Dense layout: all bricks, in index order, no mask.

### Byte layout

All numbers are little-endian.

```
"WVDB"                 4 bytes
version                uint32 (1)
header length          uint32
header                 JSON, UTF-8
chunks                 zlib streams, one per chunk
```

Header:

```json
{
  "version": 1,
  "source": { "file": "explosion_0060.vdb", "sha256": "..." },
  "bake": { "grids": null, "resolution": 128, "lods": 3, "bits": 8, "layout": "sparse", "pageBricks": 1024, "bbox": null },
  "brickDim": 8,
  "grids": [
    {
      "name": "density",
      "class": "fog volume",
      "channels": 1,
      "background": 0,
      "bbox": [[minX, minY, minZ], [maxX, maxY, maxZ]],
      "lods": [
        {
          "dimensions": [32, 32, 32],
          "bricks": 50,
          "mask": { "offset": 0, "length": 21 },
          "pages": [{ "offset": 21, "length": 11000, "bricks": 50 }]
        }
      ]
    }
  ]
}
```

- `background` is a number for 1 channel, `[x, y, z]` for 3 channels. `bbox` is null for files with only empty grids.
- Chunk offsets start at the first byte after the header.
- Chunk order is coarse to fine: LOD 0 of all grids, then LOD 1 of all grids, and so on. In each LOD of a grid: the mask (sparse only), then the pages.
- A page has up to `pageBricks` bricks. Each chunk is compressed alone, so offsets stay valid for Range requests and on any static host or CDN.

Page chunk, after inflate:

```
uint32   brick count
uint32   brick index[count]              (sparse layout only)
float32  min[count × channels]           (brick 0 channel 0, brick 0 channel 1, ...)
float32  max[count × channels]
codes    512 × uint8 or uint16 for each brick channel with min != max, in the same order
```

Value of a code: `code == maxCode ? max : min + code * (max - min) / maxCode`.

Mask chunk, after inflate: `uint32 words[ceil(brickTotal / 32)]`. Bit `index` set = brick is stored.

### Streaming

A reader needs only the header to allocate memory and to know where each chunk ends. It reads the response as a stream and decodes each chunk when its last byte arrives. A reader can stop after any LOD and never download the rest.

### Code

- `src/openvdb/wvdb/format.js` - format only, no dependencies: constants, `writeWVDBFile`, `readWVDBHeader`, `getWVDBChunks`, `encodeWVDBPage`, `decodeWVDBPage`, `encodeWVDBMask`, `decodeWVDBMask`.
- `src/wvdb` - the CLI: VDB input (file, folder, ZIP), sampling, LODs, bricks. Files convert in parallel on worker threads (`--jobs`). The sequence box comes from grid metadata only (`OpenVDBReader.read( source, { metadataOnly: true } )`). The ground_explosion sequence converts in about 45 seconds on 10 cores.
- `src/three-openvdb/wvdb` - the three.js loaders and reader.

## c) The three.js kernel

`WVDBLoader` gives each grid one `Uint8Array` texture: density for scalar grids, RGBA for vector grids. Each LOD gives a new texture at its own size (32³, then 64³, then 128³). `FrameVolume` and `FogVolume` use it as raw data (`emissiveGrid`, `baseColorGrid` and `maskGrid` too). `volumeData.attach( volume )` connects the textures of the volume to their grids. When a LOD arrives, each texture gets the new data. When the size changes, the texture is disposed first, so three.js allocates GPU memory of the new size.

Single file (`WVDBLoader`):

1. `WVDBReader.load( url )` reads `response.body` as a stream. When the header is complete, it makes the chunk list (`getWVDBChunks`) and sends the grid data to a worker.
2. When the last byte of a chunk arrives, a copy of the chunk goes to the worker. Each worker answers in order.
3. The worker (`wvdbKernel`) inflates the chunk with `DecompressionStream('deflate')` and decodes it with `decodeWVDBPage` / `decodeWVDBMask` from `openvdb`. Values become texels with the same rules as `three-openvdb`: level sets give 1 inside the band (`|value| < background`), other scalar grids give `value / scale` clamped to 0-1, vector grids give RGBA. `scale` comes from `setGridScales({ flames: 6.0 })` and is the `emissiveScale` of the volume (default 1).
4. A LOD with one page gives its texture after that page. A LOD with more pages starts from the previous LOD (trilinear upsample, bricks that the file does not store are background) and gives a texture after each page. Important bricks come first, so it gets sharper page by page.
5. After all chunks up to `maxLod` are in, the reader stops the download. A file with no grids is done at once.

Sequence (`WVDBAnimationLoader`):

1. Pass 1: header and LOD 0 of each file, in file order, a few files at a time (`setConcurrency`, default 6). Each frame is added to the `FrameVolumeAnimation` in file order. After this pass all frames are in, so the animation can play. For the ground_explosion sequence this is 1.5 MB.
2. Pass 2, 3, ...: `WVDBReader.loadMore( lod )` reads the next LOD of each file. The header gives the byte range of each LOD, so the request has a Range header and downloads only that LOD. Servers without Range support send the full file. Then the reader uses only the bytes it needs.
3. `animation.dispose()` stops all downloads.

All readers share a few workers (up to 4). The workers run from a Blob URL. Their source is `wvdbKernel`, `decodeWVDBPage` and `decodeWVDBMask` as text, so these functions must not use names from outside themselves. Without `Worker`, the same kernel runs on the main thread.

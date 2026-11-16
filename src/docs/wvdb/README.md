# WebVDB File Format (.wvdb)

```
Category:  File Format Spec
Version:   0.5.x
Extension: .wvdb
```

## Abstract

This document specifies WebVDB, a file format for web-optimised sparse volumetric grids. A WebVDB file contains scalar and vector grids, and points grids (version 2). Each grid has a sequence of levels of detail (LODs), from coarse to fine. Each LOD is divided into bricks of 8 x 8 x 8 voxels. Each brick is quantized and stored in compressed chunks. The chunks are in coarse-to-fine order. Thus a reader can decode a coarse LOD before it reads the finer LODs. A points grid stores points. Each LOD of a points grid adds points to the points of the LODs before it.

## Table of contents

1. Introduction
2. Conventions and terminology
3. Data model
4. File structure
5. Header
6. Chunks
7. Quantization
8. Level set grids
9. Chunk order and byte ranges
10. Sequences
11. Versioning and extensions
12. Conformance
13. Media type
14. Security considerations
15. References
- Appendix A. Header example
- Appendix B. Size of a decoded page

## 1. Introduction

### 1.1. Purpose

OpenVDB [OPENVDB] files store volumetric grids with full precision, full resolution and all metadata. These files are large.

WebVDB stores a resampled and quantized copy of the grids of one source file. The format has these properties:

- A file is made from one source file. The header identifies the source file with a SHA-256 digest.
- The file has a known layout. The header gives the position and length of each chunk.
- Each LOD occupies one contiguous byte range. Thus a reader can read one LOD alone.
- Each chunk is compressed alone. Thus a reader can decode a chunk when its last byte is available.

### 1.2. Scope

This document specifies the byte layout, the data model and the rules to encode and decode values. This document does not specify how to make the source data, how to show the data, or how to transfer the file.

## 2. Conventions and terminology

### 2.1. Requirement keywords

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals.

### 2.2. Terms

| Term | Definition |
| --- | --- |
| Writer | A program that makes a WebVDB file. |
| Reader | A program that reads a WebVDB file. |
| Grid | One named volumetric field (volume grid) or one named set of points (points grid). A volume grid has 1 channel (scalar) or 3 channels (vector). |
| Channel | One scalar component of a grid value. |
| Box | An axis-aligned box in world space: `[[minX, minY, minZ], [maxX, maxY, maxZ]]`. |
| LOD | One level of detail of a grid: a regular 3D array of voxels. LOD 0 is the coarsest LOD. |
| Voxel | One value of a LOD (one value for each channel). |
| Brick | A block of 8 x 8 x 8 voxels of one LOD. |
| Brick channel | The 512 values of one channel of one brick. |
| Background | The value of a grid where the grid has no data. |
| Chunk | One compressed unit of data. A chunk is a mask chunk, a page chunk or a points chunk. |
| Point | One position in world space, and optionally one colour. |
| Data section | The bytes after the header. The data section contains all chunks. |

### 2.3. Notation

- `uint32`: unsigned 32-bit integer, little-endian.
- `uint16`: unsigned 16-bit integer, little-endian.
- `uint8`: unsigned 8-bit integer.
- `float32`: IEEE 754 binary32 [IEEE754], little-endian.
- `ceil(x)`: the smallest integer that is not less than `x`.
- `x >>> n`: unsigned right shift of `x` by `n` bits.
- `x & n`: bitwise AND.
- Array indices start at 0.

## 3. Data model

### 3.1. Grids

A file contains zero or more grids. Each grid is a volume grid or a points grid (3.5). A volume grid has:

- a name, which is unique in the file
- a class (see 5.4)
- a channel count: 1 or 3
- a background value: one value for each channel
- a box
- one or more LODs

All grids of a file MUST have the same number of LODs. Sections 3.2 to 3.4 apply to volume grids.

### 3.2. LODs

Each LOD has dimensions `[X, Y, Z]`. Each dimension is a positive integer. LOD `n - 1` is the finest LOD, where `n` is the number of LODs.

Voxel `(x, y, z)` of a LOD with dimensions `[X, Y, Z]` represents the world position:

```
p = boxMin + ((x + 0.5) / X, (y + 0.5) / Y, (z + 0.5) / Z) * (boxMax - boxMin)
```

Thus the voxel centres fill the box. The voxels of one LOD are not cubes if the box is not a cube or if `X`, `Y` and `Z` are not proportional to the box size.

A writer SHOULD make the LODs as follows:

1. The finest LOD has `resolution` voxels on the longest box side. The other dimensions are proportional to the box size, rounded, and 1 or more. Thus the voxels are approximately cubes.
2. The finest LOD contains one sample of the source grid at the world position of each voxel.
3. For each coarser LOD `k`, the dimensions are `ceil(dimensions(k + 1) / 2)` on each axis.
4. Each voxel `(x, y, z)` of LOD `k` is the arithmetic mean of the voxels `(2x + i, 2y + j, 2z + k')` of LOD `k + 1`, for `i, j, k'` in `{0, 1}`. Only the voxels inside LOD `k + 1` are used.
5. Each channel is filtered alone.

### 3.3. Bricks

The bricks of a LOD with dimensions `[X, Y, Z]` form a brick grid with these counts:

```
countX = ceil(X / 8)
countY = ceil(Y / 8)
countZ = ceil(Z / 8)
brickTotal = countX * countY * countZ
```

Brick `(bx, by, bz)` has this index:

```
index = bx + by * countX + bz * countX * countY
```

Brick `index` has its first voxel at:

```
originX = (index % countX) * 8
originY = (floor(index / countX) % countY) * 8
originZ = floor(index / (countX * countY)) * 8
```

The 512 voxels of a brick are in this order: x changes fastest, then y, then z. Voxel `(i, j, k)` of the brick is number `i + 8 * j + 64 * k`.

A brick at the high end of an axis can extend outside the LOD. A writer MUST give each voxel outside the LOD the value of the nearest voxel inside the LOD on the same brick axis. A reader MUST ignore the voxels outside the LOD.

### 3.4. Layouts

Each LOD has one of two layouts:

- Dense: the file stores all bricks of the LOD.
- Sparse: the file stores only some bricks of the LOD. A brick that the file does not store has the background value in all voxels and all channels.

A writer MUST NOT omit a brick that has a value different from the background. A writer MAY store a brick that has only background values.

### 3.5. Points grids

A points grid has a name, a class, a box, a number of stored points `N`, and optionally one colour for each point. The box contains all stored points. Each point has a stored index `i` from `0` to `N - 1`.

Each LOD of a points grid contains some of the stored points. Let `n` be the number of LODs. Point `i` is in LOD `k`, where `k` is the smallest LOD for which `i` is a multiple of `8^(n - 1 - k)`. Thus:

- LOD 0 contains the points `0`, `8^(n - 1)`, `2 * 8^(n - 1)`, and so on.
- Each LOD contains approximately 8 times the points of the LOD before it, the same as the voxels of a volume grid.
- The points of LODs `0` to `k` are all stored points with an index that is a multiple of `8^(n - 1 - k)`.
- The points of LODs `0` to `n - 1` are all stored points.

A reader that shows LOD `k` shows the points of LODs `0` to `k`.

A writer SHOULD give the stored indices in an order where near indices are near in space. Then each LOD is a uniform subset of the points. A writer MAY store fewer points than the source (for example every `m`-th source point).

## 4. File structure

A file has three parts:

| Offset | Size | Field | Value |
| --- | --- | --- | --- |
| 0 | 4 | magic | The ASCII bytes `W`, `V`, `D`, `B` (`0x57 0x56 0x44 0x42`) |
| 4 | 4 | version | `uint32`. This document specifies versions 1 and 2 (section 11). |
| 8 | 4 | headerLength | `uint32`. The length of the header in bytes. |
| 12 | headerLength | header | JSON text [RFC8259], UTF-8 [RFC3629], without a byte order mark |
| 12 + headerLength | rest of file | data section | All chunks |

The data section starts at byte `dataStart = 12 + headerLength`. All chunk offsets in the header are relative to `dataStart`.

## 5. Header

### 5.1. General rules

The header is one JSON object. A reader MUST ignore header members that this document does not specify. JSON numbers that are float32 values in this document MUST be exact float32 values.

### 5.2. Top-level members

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `version` | integer | yes | MUST be equal to the version in the file structure (section 4). |
| `source` | object | yes | The source file (5.3). |
| `bake` | object | yes | The parameters that made the file (5.5). |
| `brickDim` | integer | yes | MUST be 8. |
| `grids` | array of objects | yes | The grids (5.4), in chunk order (section 9). MAY be empty. |

### 5.3. Source object

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | string | yes | The file name of the source file, without directories. |
| `sha256` | string | yes | The SHA-256 digest [FIPS180-4] of all bytes of the source file. 64 lowercase hexadecimal characters. |

### 5.4. Grid object

This section specifies the grid object of a volume grid. Section 5.7 specifies the grid object of a points grid.

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | The grid name. MUST be unique in the file. |
| `type` | string | no | `"volume"` or `"points"`. The default is `"volume"`. Version 2 only. `"points"`: see 5.7. |
| `class` | string | yes | The grid class of the source grid: `"fog volume"`, `"level set"`, `"staggered"` or `"unknown"`. Section 8 specifies `"level set"`. A reader MUST process other values as `"unknown"`. |
| `channels` | integer | no | 1 (scalar grid) or 3 (vector grid). The default is 1. |
| `background` | number or array | yes | A float32 value if `channels` is 1. An array of 3 float32 values if `channels` is 3. |
| `bbox` | box or `null` | yes | The box of the grid (3.2). `null` if no box is known: all grids of the file have no data, and the writer has no sequence box (section 10). Then all LODs contain only background values. |
| `meanDensity` | number | no | Scalar grids only. The mean of the non-zero density values of the finest LOD, `0` to `1` (0 if all are zero). Density values are 8-bit values of `clamp(value, 0, 1)`, or `1` in the active band of a level set (section 8), divided by 255. Readers can use it to normalize density. The value is the same for all LODs. |
| `nonZeroVoxels` | integer | no | Scalar grids only. The number of voxels of the finest LOD with a non-zero density value. Present if, and only if, `meanDensity` is present. |
| `lods` | array of objects | yes | The LODs (5.6), from LOD 0 (coarsest) to the finest LOD. |

### 5.5. Bake object

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `bits` | integer | yes | The quantization bit count: 8 or 16 (section 7). |
| `lods` | integer | yes | The number of LODs. MUST be equal to the length of the `lods` array of each grid. |
| `resolution` | integer | yes | The number of voxels on the longest box side of the finest LOD that the writer requested. |
| `layout` | string | yes | `"dense"` or `"sparse"`. The layout that the writer requested. |
| `pageBricks` | integer | yes | The maximum number of bricks in one page chunk. |
| `grids` | array of strings or `null` | yes | The names of the source grids that the writer selected. `null` selects all supported grids. |
| `bbox` | box or `null` | no | The box that the writer used for all volume grids (section 10). `null` or absent: the writer calculated the box from the volume grids of the source file. |
| `maxPoints` | integer | no | The maximum number of stored points of each points grid that the writer requested. |

A reader MUST use `bits` and `lods` to decode the file. The other members record the parameters of the writer. A reader MUST NOT use them to decode the file.

### 5.6. LOD object

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `dimensions` | array of 3 integers | yes | `[X, Y, Z]`. Each value is 1 or more. |
| `bricks` | integer | yes | The number of bricks that the LOD stores. MUST be equal to the sum of `bricks` of all pages. |
| `mask` | chunk reference | no | The mask chunk (6.3). Present if, and only if, the LOD has the sparse layout. |
| `pages` | array of page references | yes | The page chunks (6.2), in file order. MAY be empty. |

A chunk reference is an object with these members:

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `offset` | integer | yes | The position of the first byte of the chunk, relative to `dataStart`. |
| `length` | integer | yes | The length of the chunk in bytes. |

A page reference is a chunk reference with one more member:

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `bricks` | integer | yes | The number of bricks in the page. 1 or more. |

A LOD with the dense layout MUST store all bricks. Thus `bricks` MUST be equal to `brickTotal` (3.3).

### 5.7. Points grid object

Version 2 only. A grid object with `type` equal to `"points"` has these members:

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | The grid name. MUST be unique in the file. |
| `type` | string | yes | `"points"`. |
| `class` | string | yes | The grid class of the source grid. Same as 5.4. |
| `count` | integer | yes | The number of stored points `N` (3.5). |
| `sourceCount` | integer | no | The number of points of the source grid. |
| `spacing` | number | no | The mean distance between the stored points, in world units. Readers can use it for the size of a point. With the points of LODs `0` to `k` only, the mean distance is approximately `spacing * cbrt(N / pointsOfLods0ToK)`. |
| `colors` | boolean | yes | `true` if each point has a colour. |
| `bbox` | box or `null` | yes | The box of the stored points. `null` if `count` is 0. |
| `lods` | array of objects | yes | The points LODs, from LOD 0 to the finest LOD. |

A points LOD object has these members:

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `points` | integer | yes | The number of points of the LOD (3.5). MUST be equal to the sum of `points` of all pages. |
| `pages` | array of points page references | yes | The points chunks (6.4), in file order. MAY be empty. |

A points page reference is a chunk reference with one more member:

| Member | Type | Required | Description |
| --- | --- | --- | --- |
| `points` | integer | yes | The number of points in the chunk. 1 or more. |

The points of a LOD are in the chunks of that LOD in increasing stored index order. The sum of `points` of all LODs MUST be equal to `count`.

## 6. Chunks

### 6.1. Compression

Each chunk is one complete zlib stream [RFC1950] with the deflate method [RFC1951]. A reader MUST inflate each chunk alone. The specifications in 6.2 and 6.3 apply to the inflated bytes.

### 6.2. Page chunk

A page chunk contains the bricks of one page of one LOD of one grid. Let `count` be the `bricks` value of the page reference and `channels` the channel count of the grid. The inflated page has these fields, in this order, without padding:

| Field | Type | Count | Description |
| --- | --- | --- | --- |
| brickCount | `uint32` | 1 | MUST be equal to `count`. |
| indices | `uint32` | `count` | The brick indices (3.3). Present only in the sparse layout. |
| mins | `float32` | `count * channels` | The minimum of each brick channel. |
| maxs | `float32` | `count * channels` | The maximum of each brick channel. |
| codes | `uint8` or `uint16` | see below | The quantized voxels. `uint8` if `bits` is 8, `uint16` if `bits` is 16. |

The brick channels are in this order: brick 0 channel 0, brick 0 channel 1, ..., brick 1 channel 0, and so on. Thus the range of brick `b` channel `c` is `mins[b * channels + c]` and `maxs[b * channels + c]`.

The codes field contains 512 codes for each brick channel where min is not equal to max. These code blocks are in brick channel order. A brick channel where min is equal to max has no codes. The 512 codes of a block are in voxel order (3.3).

In the sparse layout, the indices of all pages of one LOD MUST be different.

In the dense layout, the brick indices are implicit. The bricks of the first page of the LOD have the indices `0` to `count - 1`. The bricks of each next page continue from the last index of the page before it.

Appendix B gives the size of an inflated page. A reader MUST reject a page with a different size.

### 6.3. Mask chunk

A mask chunk identifies the stored bricks of one sparse LOD. The inflated mask contains `ceil(brickTotal / 32)` values of type `uint32`, without padding.

Brick `index` is stored if, and only if, this value is not zero:

```
words[index >>> 5] & (1 << (index & 31))
```

Thus bit 0 (the least significant bit) of word 0 is brick 0. Bits after bit `brickTotal - 1` MUST be zero.

The set of stored bricks in the mask MUST be equal to the set of indices in the pages of the LOD.

### 6.4. Points chunk

A points chunk contains some points of one LOD of one points grid. Let `count` be the `points` value of the points page reference. The inflated chunk has these fields, in this order, without padding:

| Field | Type | Count | Description |
| --- | --- | --- | --- |
| pointCount | `uint32` | 1 | MUST be equal to `count`. |
| min | `float32` | 3 | The minimum of the x, y and z positions of the points of the chunk. |
| max | `float32` | 3 | The maximum of the x, y and z positions of the points of the chunk. |
| xHigh | `uint8` | `count` | The high bytes of the x codes. |
| xLow | `uint8` | `count` | The low bytes of the x codes. |
| yHigh | `uint8` | `count` | The high bytes of the y codes. |
| yLow | `uint8` | `count` | The low bytes of the y codes. |
| zHigh | `uint8` | `count` | The high bytes of the z codes. |
| zLow | `uint8` | `count` | The low bytes of the z codes. |
| red | `uint8` | `count` | Present only if `colors` of the grid is `true`. |
| green | `uint8` | `count` | Present only if `colors` of the grid is `true`. |
| blue | `uint8` | `count` | Present only if `colors` of the grid is `true`. |

Field `j` of each array is point `j` of the chunk. The code of an axis is `high * 256 + low`, from 0 to 65535. The separate byte planes compress better than interleaved values.

A writer MUST calculate each code with the rules of 7.1, with `bits` equal to 16, and `min` and `max` of that axis of the chunk. If `min` is equal to `max`, all codes of that axis MUST be 0. A reader MUST decode each position with the rules of 7.2, with `bits` equal to 16. These rules do not use the `bits` value of the bake object.

A colour channel value `c` from 0 to 1 is stored as `round(clamp(c, 0, 1) * 255)`. A reader decodes it as `byte / 255`.

## 7. Quantization

### 7.1. Encoding

Let `bits` be the `bits` value of the bake object. Let `maxCode = 2^bits - 1`.

For each brick channel, a writer MUST:

1. Calculate `min` and `max` of the 512 values of the brick channel, including the values outside the LOD (3.3).
2. Convert `min` and `max` to float32.
3. If `min` is equal to `max`, store no codes.
4. If not, calculate the code of each value `v`:

```
scale = maxCode / (max - min)
code = clamp(round((v - min) * scale), 0, maxCode)
```

`round` rounds to the nearest integer. Halves round up (toward positive infinity). A writer MUST calculate `scale` first, with IEEE 754 binary64 arithmetic. Then two writers give the same codes.

### 7.2. Decoding

For each brick channel, a reader MUST calculate each value as follows:

- If `min` is equal to `max`: `v = min`.
- If `code` is equal to `maxCode`: `v = max`.
- In all other cases: `v = min + code * ((max - min) / maxCode)`.

A reader SHOULD calculate with float32 precision or more. The first two rules give `min` and `max` exactly.

## 8. Level set grids

A grid with the class `"level set"` contains signed distances. The background `b` is the half width of the narrow band. It is a positive number.

A writer MUST encode each value of a level set grid as follows:

- A voxel outside the narrow band (an inactive voxel of the source) gets `-b` if its source value is negative, and `b` in all other cases.
- A voxel in the narrow band (an active voxel of the source) gets its source value, clamped to `[-a, a]`, with `a = b - 2 * b / maxCode`.

The limit `a` is one quantization step inside the band. Thus a value in the band never decodes to `-b` or `b`.

A decoded value `v` is in the narrow band if, and only if, `|v| < b`.

## 9. Chunk order and byte ranges

A writer MUST write the chunks in this order:

1. For each LOD `k` from 0 to the finest LOD:
2. For each grid, in the order of the `grids` array:
3. The mask chunk of LOD `k` of the grid, if present.
4. The page chunks or points chunks of LOD `k` of the grid, in the order of the `pages` array.

The data section MUST contain only the chunks, in this order, without gaps. Thus the offset of the first chunk is 0, and the offset of each next chunk is the end of the chunk before it.

This order has these results:

- All chunks of LOD `k` are before all chunks of LOD `k + 1`.
- The chunks of LOD `k` of all grids occupy one contiguous byte range of the file. The range starts at `dataStart` plus the offset of its first chunk.
- A reader can read the header and LODs `0` to `k` from the first bytes of the file. The reader does not need the bytes after LOD `k`.

In the sparse layout, a writer SHOULD put the bricks with the most data first in the pages of a LOD. Data is the sum of `|v - background|` over all values of the brick. Bricks with the same sum SHOULD be in index order.

## 10. Sequences

A sequence is an ordered set of WebVDB files. Each file contains one frame.

- Each source frame MUST give one file, also a frame where all grids have no data. Thus file `i` is frame `i`.
- All files of a sequence SHOULD have the same grids, in the same order.
- All volume grids of all files of a sequence SHOULD have the same box. The writer records this box in `bake.bbox`. Thus a voxel of a frame is at the same world position as the same voxel of each other frame. Points grids have the box of their points (5.7).

## 11. Versioning and extensions

- A reader MUST reject a file with a version that it does not support.
- A writer MUST increase the version for each change that a version 1 reader cannot read correctly when it ignores unknown members.
- A writer MAY add header members without a version change, if a version 1 reader can ignore them and decode the file correctly.
- A writer MUST NOT change the meaning of a specified member without a version change.

Version 2 adds points grids (3.5, 5.7 and 6.4). A version 1 reader cannot read them. A writer MUST write version 2 if the file has a points grid. A writer MUST write version 1 if the file has no points grid. Then version 1 readers can read all files without points grids. A version 2 reader MUST read version 1 files.

## 12. Conformance

### 12.1. Writers

A conforming writer MUST obey all writer requirements of sections 3 to 10. Two runs of a writer with the same source file and the same parameters SHOULD give the same bytes.

### 12.2. Readers

A conforming reader MUST:

1. Validate the magic, the version and `brickDim`.
2. Inflate and decode each chunk as specified in sections 6 and 7. A version 2 reader decodes points chunks as specified in 6.4.
3. Use the background for the bricks that a sparse LOD does not store.
4. Ignore the voxels outside each LOD (3.3).
5. Apply the rules of section 8 to level set grids.

A reader MAY:

- decode only LODs `0` to `k`
- read each LOD as a separate byte range (section 9)
- show a LOD before it has all pages of that LOD

## 13. Media type

This document proposes these identifiers:

- File name extension: `.wvdb`
- Media type: `application/x-wvdb`

The media type is not registered.

## 14. Security considerations

A WebVDB file can come from an untrusted source. A reader MUST validate the file before it allocates memory or reads data:

- `headerLength` MUST NOT be more than the file length minus 12.
- The header MUST be valid JSON with the required members and types.
- Each chunk MUST be inside the data section: `offset + length` MUST NOT be more than the length of the data section.
- Each brick index MUST be less than `brickTotal`.
- The inflated size of each chunk MUST be equal to the size that the header gives (Appendix B, 6.3 and 6.4). A reader MUST stop to inflate a chunk when the output is larger than this size.
- A reader SHOULD set a maximum for `X * Y * Z * channels` of each LOD before it allocates memory.

The header contains a file name and a digest of the source file. It contains no executable data.

## 15. References

### 15.1. Normative references

- [RFC1950] Deutsch, P. and J-L. Gailly, "ZLIB Compressed Data Format Specification version 3.3", RFC 1950, May 1996.
- [RFC1951] Deutsch, P., "DEFLATE Compressed Data Format Specification version 1.3", RFC 1951, May 1996.
- [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997.
- [RFC3629] Yergeau, F., "UTF-8, a transformation format of ISO 10646", STD 63, RFC 3629, November 2003.
- [RFC8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, May 2017.
- [RFC8259] Bray, T., "The JavaScript Object Notation (JSON) Data Interchange Format", STD 90, RFC 8259, December 2017.
- [IEEE754] IEEE, "IEEE Standard for Floating-Point Arithmetic", IEEE 754-2019.
- [FIPS180-4] NIST, "Secure Hash Standard (SHS)", FIPS PUB 180-4, August 2015.

### 15.2. Informative references

- [OPENVDB] Academy Software Foundation, "OpenVDB", https://www.openvdb.org.

## Appendix A. Header example

One fog volume grid, 3 LODs, sparse layout, 8 bits:

```json
{
  "version": 1,
  "source": { "file": "smoke_0060.vdb", "sha256": "9f2c...e41a" },
  "bake": {
    "grids": null,
    "resolution": 128,
    "lods": 3,
    "bits": 8,
    "layout": "sparse",
    "pageBricks": 1024,
    "bbox": null
  },
  "brickDim": 8,
  "grids": [
    {
      "name": "density",
      "class": "fog volume",
      "channels": 1,
      "background": 0,
      "bbox": [[-111.5, -114.5, -159.5], [109.5, 141.5, 122.5]],
      "meanDensity": 0.1145,
      "nonZeroVoxels": 166170,
      "lods": [
        {
          "dimensions": [25, 29, 32],
          "bricks": 49,
          "mask": { "offset": 0, "length": 21 },
          "pages": [{ "offset": 21, "length": 6012, "bricks": 49 }]
        },
        {
          "dimensions": [50, 58, 64],
          "bricks": 295,
          "mask": { "offset": 6033, "length": 52 },
          "pages": [{ "offset": 6085, "length": 41200, "bricks": 295 }]
        },
        {
          "dimensions": [100, 116, 128],
          "bricks": 1799,
          "mask": { "offset": 47285, "length": 260 },
          "pages": [
            { "offset": 47545, "length": 140100, "bricks": 1024 },
            { "offset": 187645, "length": 98300, "bricks": 775 }
          ]
        }
      ]
    }
  ]
}
```

The digest and the chunk lengths in this example are not from a real file.

## Appendix B. Size of a decoded page

Let `count` be the brick count of the page, `channels` the channel count of the grid, `bits` the bit count, and `varying` the number of brick channels where min is not equal to max. The size of the inflated page in bytes is:

```
4                                   brickCount
+ 4 * count                         indices (sparse layout only)
+ 8 * count * channels              mins and maxs
+ varying * 512 * (bits / 8)        codes
```

A reader can calculate `varying` after it reads mins and maxs.

The size of an inflated points chunk (6.4) in bytes, with `count` the point count of the chunk and `c` equal to 3 if the grid has colours and 0 if not:

```
4                                   pointCount
+ 24                                min and max
+ 6 * count                         position codes
+ c * count                         colours
```

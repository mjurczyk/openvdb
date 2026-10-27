# webvdb

The `wvdb` CLI. Converts `.vdb` files into `.wvdb` files: small files that stream in LODs. Needs only Node.js 18 or newer. No three.js, no browser.

```sh
npm install -g webvdb                    # or run once: npx webvdb <input>

wvdb explosion_0001.vdb              # -> explosion_0001.wvdb
wvdb ./explosion_VDB                 # folder of .vdb files -> ./explosion_VDB_wvdb/
wvdb ./explosion_VDB.zip             # ZIP of .vdb files -> ./explosion_VDB_wvdb/
wvdb explosion.vdb --resolution 256 --lods 4
```

Each `.vdb` file gives one `.wvdb` file, also empty frames, so a sequence keeps its frame numbers. All frames of a folder or ZIP use one box, so voxels do not move between frames.

Files convert in parallel, one per CPU core. Use `--jobs <n>` to use less memory.

Run `wvdb --help` for all options. Format: `src/docs/wvdb/README.md` in the repository.

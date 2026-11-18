### Building Examples

Run `npm run build:examples`. The build goes to `dist/`. Git ignores `dist/`, do not commit it.

### Deploy

The site is the `gh-pages` branch. Run `npm run deploy:examples` on a commit without local changes.

The script (`scripts/deploy-examples.mjs`) builds the examples, replaces all files on `gh-pages` but `lantern/` (see `src/docs/lantern/README.md`), and pushes one commit `Rebuild examples for vX.Y.Z (branch commit)`. The push is a fast-forward. Do not use `--force`. If the push is rejected, `gh-pages` changed: run the script again.

## Ground Explosion

`public/assets/ground_explosion` is the Ground Explosion VDB sequence by [JangaFX](https://jangafx.com) (EmberGen), CC0 (see `LICENSE.txt` and `README.txt` in that folder). It was converted from `ground_explosion_VDB.zip` of the [free VDB sets](https://jangafx.com/software/embergen/download/free-vdb-animations/) with default options:

```sh
node ./build/webvdb/cli.mjs ground_explosion_VDB.zip -o src/docs/examples/public/assets/ground_explosion
```

`frames.json` lists the frames in order. The examples have no `.vdb` files of this sequence.

## Cloud Pack

`public/assets/CloudPackVDB_wvdb` is the Cloud Pack VDB set by [JangaFX](https://jangafx.com) (EmberGen), CC0 (see `LICENSE.txt` and `README.txt` in that folder). The Sky demo uses it. The files are Z-up. The examples have no `.vdb` files of this set.

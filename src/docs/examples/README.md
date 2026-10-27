### Building Examples

- run `npm run build:examples`
- Commit the new docs version
- Run `git subtree push --prefix=src/docs/examples/dist/ origin gh-pages`, or:

```bash
git push origin `git subtree split --prefix=src/docs/examples/dist/ main`:gh-pages --force
```

## Ground Explosion

`public/assets/ground_explosion` is the Ground Explosion VDB sequence by [JangaFX](https://jangafx.com) (EmberGen), CC0 (see `LICENSE.txt` and `README.txt` in that folder). It was converted from `ground_explosion_VDB.zip` of the [free VDB sets](https://jangafx.com/software/embergen/download/free-vdb-animations/) with default options:

```sh
node ./build/webvdb/cli.mjs ground_explosion_VDB.zip -o src/docs/examples/public/assets/ground_explosion
```

`frames.json` lists the frames in order. The examples have no `.vdb` files of this sequence.

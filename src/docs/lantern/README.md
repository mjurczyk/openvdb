# Stone Lantern (hidden demo)

A stone lantern with an animated `.wvdb` smoke sequence, lit by an UltraHDR environment map, with `three-environment-shadows`.

Not linked from the docs. Live at https://mjurczyk.github.io/openvdb/lantern/ only.

This folder is a separate project. It shares no code, assets or dependencies with `src/docs/examples` and is not an npm workspace of this repository. It uses the published `three-openvdb` package, not the sources of this repository.

## Run

```sh
cd src/docs/lantern
npm install
npm run dev
```

## Deploy

```sh
npm run build
```

Copy `dist/` to `lantern/` on the `gh-pages` branch. The examples deploy replaces `index.html` and `assets/` only, so `lantern/` stays.

## Notes

- `three-environment-shadows` 2.1.0 or newer: the lightmap follows `scene.environmentIntensity`, so the lantern follows the environment intensity loop.
- `public/xatlas-web.wasm` is a copy from `three-environment-shadows`. Vite pre-bundles the package, which breaks its relative wasm URL, so `xatlasWasmUrl` points here.

## Credits

- "Stone Japanese Lantern" by [magiccc](https://sketchfab.com/magiccc), [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Source: https://sketchfab.com/3d-models/stone-japanese-lantern-6b475ce70edc4399b4364cc36afe3c9a

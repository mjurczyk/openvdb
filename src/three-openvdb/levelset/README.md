# Level sets

A level set grid stores the signed distance to a surface.

Sources of `LevelSetMesh` and `LevelSetSurface`:

- A level set `GridDescriptor`. It is sampled on the CPU.
- A level set grid of `WVDBVolumeData`. It uses the texels of the newest LOD.

Both have `bbox` (world box of the grid), `createInstance()` (same geometry and material, other transform) and `dispose()`.

## LevelSetMesh

- `new LevelSetMesh( grid, { material, resolution }, onConverted: ( mesh ) => void ): Three.Mesh`

The surface as triangles (marching cubes). Works with all three.js materials, lights and shadows.

- `material: Three.Material` - (default: `MeshStandardMaterial`).
- `resolution: number` - (default: `200`) `GridDescriptor` only: texels on the longest box side.

The mesh builds in 12 ms steps, so the page does not freeze. It is hidden until the first build is done. `dispose()` frees the geometry and the default material.

```js
new OpenVDB.WVDBLoader().load('./assets/venusstatue.wvdb', (volumeData) => {
  const mesh = new OpenVDB.LevelSetMesh(Object.values(volumeData.grids)[0]);

  volumeData.attach(mesh);
  scene.add(mesh);
});
```

## LevelSetSurface

- `new LevelSetSurface( grid, { resolution, ...materialProps }, onConverted: ( surface ) => void ): Three.Mesh`

The surface traced on the GPU, in the box of the grid. No triangles are built, so a new LOD costs only a texture upload. Lights, environment, received shadows and depth use the traced point. With `castShadow` it casts traced shadows.

- `resolution: number` - (default: `200`) `GridDescriptor` only: texels on the longest box side.
- `materialProps` - props of the material, for example `color`, `roughness` and `metalness`. The material is `MeshStandardNodeMaterial` (`three-openvdb`) or `MeshStandardMaterial` (`three-openvdb/webgl`).

`dispose()` frees the geometry, the material and the texture.

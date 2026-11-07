import * as Three from 'three';

const bufferSize = new Three.Vector2();
const canvasSize = new Three.Vector2();

// NOTE Tiles of tileWidth x tileHeight in an atlas that is approximately square
export const getAtlasLayout = (tileWidth, tileHeight, tileCount) => {
  const columns = Math.ceil(Math.sqrt((tileCount * tileHeight) / tileWidth));
  const rows = Math.ceil(tileCount / columns);

  return { columns, width: tileWidth * columns, height: tileHeight * rows };
};

// NOTE A canvas that changes by less than this share keeps its froxel cap. The address bar of a mobile browser shows
// and hides while the page scrolls, and a new grid size drops the temporal history and makes new render targets.
const steadyChange = 0.15;

const steadyCap = (cap, previous) =>
  previous > 0 && Math.abs(cap - previous) <= previous * steadyChange ? previous : cap;

// NOTE Froxel grid size: the settings, but not more than the drawing buffer pixels. The canvas, not the render target,
// keeps the size stable. settings.pixelsPerFroxel N above 0: also not more than one froxel for each N x N canvas pixels
// (renderer.getSize, CSS pixels). Each pass costs per froxel, and a small canvas would get many more froxels for each
// pixel than a large one. state ({ x, y }) keeps the cap of the last call, steady through small canvas changes.
export const getFroxelSize = (settings, renderer, target = {}, state = null) => {
  renderer.getDrawingBufferSize(bufferSize);

  let capX = bufferSize.x;
  let capY = bufferSize.y;

  if (settings.pixelsPerFroxel > 0) {
    renderer.getSize(canvasSize);

    capX = Math.ceil(canvasSize.x / settings.pixelsPerFroxel);
    capY = Math.ceil(canvasSize.y / settings.pixelsPerFroxel);

    if (state) {
      capX = state.x = steadyCap(capX, state.x);
      capY = state.y = steadyCap(capY, state.y);
    }
  }

  target.width = Math.max(1, Math.min(Math.round(settings.width), bufferSize.x, capX));
  target.height = Math.max(1, Math.min(Math.round(settings.height), bufferSize.y, capY));

  return target;
};

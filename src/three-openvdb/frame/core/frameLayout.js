import * as Three from 'three';

const bufferSize = new Three.Vector2();
const canvasSize = new Three.Vector2();

// NOTE Tiles of tileWidth x tileHeight in an atlas that is approximately square
export const getAtlasLayout = (tileWidth, tileHeight, tileCount) => {
  const columns = Math.ceil(Math.sqrt((tileCount * tileHeight) / tileWidth));
  const rows = Math.ceil(tileCount / columns);

  return { columns, width: tileWidth * columns, height: tileHeight * rows };
};

// NOTE At most one froxel for each 2 x 2 canvas (CSS) pixels. Each pass costs per froxel, and without this cap a small
// canvas got many more froxels for each pixel than a large one. CSS pixels keep it the same for each pixel ratio.
const pixelsPerFroxel = 2;

// NOTE Size of the canvas on the page, also when the app sets the drawing buffer itself (setSize with updateStyle false).
// A canvas with no page size (an OffscreenCanvas, a hidden canvas) gives the size of the renderer.
const getCanvasSize = (renderer, target) => {
  const { clientWidth, clientHeight } = renderer.domElement;

  return clientWidth > 0 && clientHeight > 0 ? target.set(clientWidth, clientHeight) : renderer.getSize(target);
};

// NOTE Froxel grid size: the settings, but not more than the cap above and the drawing buffer pixels. The canvas, not the
// render target, keeps the size stable.
export const getFroxelSize = (settings, renderer, target = {}) => {
  renderer.getDrawingBufferSize(bufferSize);
  getCanvasSize(renderer, canvasSize);

  target.width = Math.max(
    1,
    Math.min(Math.round(settings.width), bufferSize.x, Math.ceil(canvasSize.x / pixelsPerFroxel)),
  );
  target.height = Math.max(
    1,
    Math.min(Math.round(settings.height), bufferSize.y, Math.ceil(canvasSize.y / pixelsPerFroxel)),
  );

  return target;
};

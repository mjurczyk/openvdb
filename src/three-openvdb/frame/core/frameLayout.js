import * as Three from 'three';

const bufferSize = new Three.Vector2();
const canvasSize = new Three.Vector2();

// NOTE Tiles of tileWidth x tileHeight in an atlas that is approximately square
export const getAtlasLayout = (tileWidth, tileHeight, tileCount) => {
  const columns = Math.ceil(Math.sqrt((tileCount * tileHeight) / tileWidth));
  const rows = Math.ceil(tileCount / columns);

  return { columns, width: tileWidth * columns, height: tileHeight * rows };
};

// NOTE A size that changes by less than this share is kept. The address bar of a mobile browser shows and hides while
// the page scrolls, and a new grid size drops the temporal history and makes new render targets.
const steadyChange = 0.15;

const steady = (size, held) => (held > 0 && Math.abs(size - held) <= held * steadyChange ? held : size);

// NOTE Froxel grid size: the settings, but not more than the drawing buffer pixels. The canvas, not the render target,
// keeps the size stable. settings.pixelsPerFroxel N above 0: also not more than one froxel for each N x N canvas pixels
// (renderer.getSize, CSS pixels). Each pass costs per froxel, and a small canvas would get many more froxels for each
// pixel than a large one. Then state ({ canvasX, canvasY, bufferX, bufferY }) holds the canvas and drawing buffer
// sizes through small changes. The sizes are held, not the caps, so a new N applies at once. After a small shrink the
// grid can be up to 15% over the drawing buffer on that axis, until the next bigger change.
export const getFroxelSize = (settings, renderer, target = {}, state = null) => {
  renderer.getDrawingBufferSize(bufferSize);

  let capX = bufferSize.x;
  let capY = bufferSize.y;

  if (settings.pixelsPerFroxel > 0) {
    renderer.getSize(canvasSize);

    if (state) {
      state.canvasX = steady(canvasSize.x, state.canvasX);
      state.canvasY = steady(canvasSize.y, state.canvasY);
      state.bufferX = steady(bufferSize.x, state.bufferX);
      state.bufferY = steady(bufferSize.y, state.bufferY);
      canvasSize.set(state.canvasX, state.canvasY);
      bufferSize.set(state.bufferX, state.bufferY);
    }

    capX = Math.min(bufferSize.x, Math.ceil(canvasSize.x / settings.pixelsPerFroxel));
    capY = Math.min(bufferSize.y, Math.ceil(canvasSize.y / settings.pixelsPerFroxel));
  } else if (state) {
    // NOTE Turned on again later, it starts from the sizes of that frame
    state.canvasX = state.canvasY = state.bufferX = state.bufferY = 0;
  }

  target.width = Math.max(1, Math.min(Math.round(settings.width), capX));
  target.height = Math.max(1, Math.min(Math.round(settings.height), capY));

  return target;
};

import * as Three from 'three';

const bufferSize = new Three.Vector2();

// NOTE Tiles of tileWidth x tileHeight in an atlas that is approximately square
export const getAtlasLayout = (tileWidth, tileHeight, tileCount) => {
  const columns = Math.ceil(Math.sqrt((tileCount * tileHeight) / tileWidth));
  const rows = Math.ceil(tileCount / columns);

  return { columns, width: tileWidth * columns, height: tileHeight * rows };
};

// NOTE Froxel grid size: the settings, but not more than the canvas pixels. The canvas, not the render target, keeps the size stable.
export const getFroxelSize = (settings, renderer, target = {}) => {
  renderer.getDrawingBufferSize(bufferSize);

  target.width = Math.max(1, Math.min(Math.round(settings.width), bufferSize.x));
  target.height = Math.max(1, Math.min(Math.round(settings.height), bufferSize.y));

  return target;
};

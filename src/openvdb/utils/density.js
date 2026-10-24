import { MathUtils } from 'three';

// NOTE Level sets store signed distance. Converters show their active voxels as density 1.0.
export const getDensity = (grid, position) => {
  if (grid.isLevelSet?.()) {
    return grid.isActive(position) ? 1.0 : 0.0;
  }

  return MathUtils.clamp(grid.getValue(position), 0.0, 1.0);
};

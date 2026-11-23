import { output } from 'three/tsl';

// NOTE Data passes write other values than the scene color, for example the normals of a GTAO pre-pass.
// Their MRT puts another node in the 'output' slot.
export const isDataPass = (renderer) => {
  const mrt = renderer.getMRT();

  return mrt !== null && mrt.get('output') !== output;
};

// NOTE Effect passes (for example pixelationPass) set an MRT on the renderer for the scene render.
// NOTE Frame passes write their own targets, so they draw without it. The MRT of the effect comes back after.
export const withoutMRT = (renderer, callback) => {
  const mrt = renderer.getMRT();

  if (mrt === null) {
    return callback();
  }

  renderer.setMRT(null);

  const result = callback();

  renderer.setMRT(mrt);

  return result;
};

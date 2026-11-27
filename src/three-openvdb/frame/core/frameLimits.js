// NOTE Limits of the frame renderer. Both backends size their uniforms, loops and settings with these values.

// NOTE World shadow grid cascades. Cascade 0 is the finest, near the camera.
export const frameMaxShadowCascades = 4;

// NOTE Light slots of the transmittance pass: sky up, sky down, then these lights.
// NOTE Scene lights take the first slots. The dominant directional environment light takes the next free slot.
export const frameShadowLightSlots = 6;

// NOTE Volume shadow maps on meshes. Directional lights: cascades of the view, all tiles of one atlas.
export const frameMaxShadowMapCascades = 4;

// NOTE Upper limit of the castShadowSteps setting
export const frameMaxShadowSteps = 256;

// NOTE Loop limits of the shader marches: transmittance toward a light, environment grid, froxel slices
export const frameMaxTransmittanceSteps = 1024;
export const frameMaxEnvironmentGridSteps = 1024;
export const frameMaxSlices = 1024;

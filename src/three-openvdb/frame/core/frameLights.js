// NOTE Light types of the FrameVolume lights bitmask. The same for WebGLRenderer and WebGPURenderer.
export const frameLights = {
  useAmbientLights: 0b100000,
  usePointLights: 0b010000,
  useDirectionalLights: 0b001000,
  useSpotLights: 0b000100,
  useHemisphereLights: 0b000010,
  useEnvironment: 0b000001,
};

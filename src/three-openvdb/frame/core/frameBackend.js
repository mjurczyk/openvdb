// NOTE Renderer backend of FrameVolume: the frameRenderer of webgpu/ or webgl/.
// NOTE The package entry point sets it: index.js (WebGPURenderer) or webgl.js (WebGLRenderer). Core code imports no backend.
// NOTE A backend has render(), integrateMaterial, createProxyGeometry(), configureTexture() and disposeVolume().
let frameBackend = null;

export const setFrameBackend = (backend) => {
  frameBackend = backend;
};

export const getFrameBackend = () => {
  if (!frameBackend) {
    throw new Error(
      'FrameVolume: no renderer backend. Import from "three-openvdb" (WebGPURenderer) or "three-openvdb/webgl" (WebGLRenderer).',
    );
  }

  return frameBackend;
};

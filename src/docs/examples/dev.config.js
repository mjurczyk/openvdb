import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE VITE_FRAME_RENDERER=webgl runs the examples with WebGLRenderer and three-openvdb/webgl
const useWebGLRenderer = process.env.VITE_FRAME_RENDERER === 'webgl';

export default defineConfig({
  plugins: [react()],
  // NOTE Own dependency cache. Then both dev servers can run at the same time.
  cacheDir: useWebGLRenderer ? 'node_modules/.vite-webgl' : 'node_modules/.vite',
  resolve: {
    alias: useWebGLRenderer ? [{ find: /^three-openvdb$/, replacement: 'three-openvdb/webgl' }] : [],
  },
});

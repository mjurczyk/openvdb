import { defineConfig } from '@playwright/test';

const port = 5199;

export default defineConfig({
  testDir: '.',
  testMatch: 'validation.spec.js',
  outputDir: './results',
  // NOTE One browser at a time. Scenarios load large assets and share the GPU.
  workers: 1,
  timeout: 180000,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    baseURL: `http://localhost:${port}/`,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    // NOTE Without --enable-gpu, headless Chromium loses the WebGPU device at the first frame
    launchOptions: {
      args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--enable-gpu'],
    },
  },
  webServer: {
    command: `npm run dev -w openvdb-examples -- --port ${port} --strictPort`,
    cwd: '..',
    url: `http://localhost:${port}/`,
    reuseExistingServer: true,
  },
});

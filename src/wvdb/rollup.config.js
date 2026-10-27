import { nodeResolve } from '@rollup/plugin-node-resolve';
import { cleanOutputDir, copyPackageFiles, getOutputDir } from '../../rollup.shared.js';

// NOTE One file with openvdb inside. It needs only Node.
export default {
  input: './cli.js',
  output: {
    file: `${getOutputDir('webvdb')}/cli.mjs`,
    format: 'esm',
    banner: '#!/usr/bin/env node',
  },
  external: [/^node:/],
  plugins: [
    cleanOutputDir('webvdb'),
    nodeResolve(),
    copyPackageFiles('webvdb', { bin: { wvdb: './cli.mjs' }, dependencies: {} }),
  ],
};

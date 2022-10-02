import { nodeResolve } from '@rollup/plugin-node-resolve';
import uglify from '@lopatnov/rollup-plugin-uglify';

export default [
  { // Dist
    input: './src/openvdb/index.js',
    output: {
      file: './build/openvdb.js',
      format: 'esm'
    },
    plugins: [nodeResolve(), uglify()]
  },
  { // NOTE Tools
    input: './src/openvdb/tools/index.js',
    output: {
      file: './build/tools.js',
      format: 'esm'
    },
    plugins: [nodeResolve(), uglify()]
  }
];
import { nodeResolve } from '@rollup/plugin-node-resolve';
import uglify from '@lopatnov/rollup-plugin-uglify';
import copy from 'rollup-plugin-copy';
import externalPeerDependencies from 'rollup-plugin-peer-deps-external';
import cleanUpDir from 'rollup-plugin-delete';

export default [
  {
    // NOTE ESM Core
    input: './src/openvdb/index.js',
    output: {
      file: './build/index.js',
      format: 'esm',
    },
    plugins: [
      cleanUpDir({ targets: './build' }),
      externalPeerDependencies(),
      nodeResolve(),
      uglify(),
      copy({
        targets: [
          {
            src: './package.json',
            dest: './build/',
          },
        ],
      }),
    ],
  },
  {
    // NOTE ESM Three.js
    input: './src/openvdb/three/index.js',
    output: {
      file: './build/three/index.js',
      format: 'esm',
    },
    plugins: [externalPeerDependencies(), nodeResolve(), uglify()],
  },
  {
    // NOTE CJS Core
    input: './src/openvdb/index.js',
    output: {
      file: './build/index.cjs.js',
      format: 'cjs',
    },
    plugins: [externalPeerDependencies(), nodeResolve(), uglify()],
  },
  {
    // NOTE CJS Three.js
    input: './src/openvdb/three/index.js',
    output: {
      file: './build/three/index.cjs.js',
      format: 'cjs',
    },
    plugins: [externalPeerDependencies(), nodeResolve(), uglify()],
  },
];

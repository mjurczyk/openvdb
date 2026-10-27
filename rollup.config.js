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
            // NOTE The published package.json has no scripts, dev dependencies or private flag.
            // Then npm publish in build does not run the scripts of the repo root.
            transform: (contents) => {
              const packageJson = JSON.parse(contents.toString());

              delete packageJson.private;
              delete packageJson.devDependencies;
              packageJson.scripts = {};

              return `${JSON.stringify(packageJson, null, 2)}\n`;
            },
          },
          {
            src: './README.md',
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
    plugins: [
      externalPeerDependencies(),
      nodeResolve(),
      uglify()
    ],
  },
  {
    // NOTE CJS Core
    input: './src/openvdb/index.js',
    output: {
      file: './build/index.cjs.js',
      format: 'cjs',
    },
    plugins: [
      externalPeerDependencies(),
      nodeResolve(),
      uglify()
    ],
  },
  {
    // NOTE CJS Three.js
    input: './src/openvdb/three/index.js',
    output: {
      file: './build/three/index.cjs.js',
      format: 'cjs',
    },
    plugins: [
      externalPeerDependencies(),
      nodeResolve(),
      uglify()
    ],
  },
];

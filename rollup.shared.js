import { nodeResolve } from '@rollup/plugin-node-resolve';
import uglify from '@lopatnov/rollup-plugin-uglify';
import copy from 'rollup-plugin-copy';
import cleanUpDir from 'rollup-plugin-delete';

// NOTE Packages build into build/<name> at the repo root. Rollup runs in the package folder.
export const getOutputDir = (name) => `../../build/${name}`;

// NOTE The published package.json has no scripts, dev dependencies or private flag
const toPublishedPackage = (fields) => (contents) => {
  const packageJson = { ...JSON.parse(contents.toString()), ...fields };

  delete packageJson.private;
  delete packageJson.devDependencies;
  packageJson.scripts = {};

  return `${JSON.stringify(packageJson, null, 2)}\n`;
};

export const copyPackageFiles = (name, fields) =>
  copy({
    targets: [
      { src: './package.json', dest: getOutputDir(name), transform: toPublishedPackage(fields) },
      { src: './README.md', dest: getOutputDir(name) },
    ],
  });

export const cleanOutputDir = (name) => cleanUpDir({ targets: getOutputDir(name), force: true });

// NOTE ESM and CJS builds of a library package
export const createLibraryConfigs = ({ name, external = [] }) => [
  {
    input: './index.js',
    output: { file: `${getOutputDir(name)}/index.js`, format: 'esm' },
    external,
    plugins: [
      cleanOutputDir(name),
      nodeResolve(),
      uglify(),
      copyPackageFiles(name, {
        main: './index.cjs.js',
        module: './index.js',
        exports: { '.': { import: './index.js', require: './index.cjs.js' } },
      }),
    ],
  },
  {
    input: './index.js',
    output: { file: `${getOutputDir(name)}/index.cjs.js`, format: 'cjs' },
    external,
    plugins: [nodeResolve(), uglify()],
  },
];

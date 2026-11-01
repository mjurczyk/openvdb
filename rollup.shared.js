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

// NOTE Package exports of the entry points. 'index' is the main entry ('.').
const getExports = (entries) =>
  Object.fromEntries(
    entries.map((entry) => [
      entry === 'index' ? '.' : `./${entry}`,
      { import: `./${entry}.js`, require: `./${entry}.cjs` },
    ]),
  );

// NOTE ESM and CJS builds of a library package. Each entry point is a separate bundle.
export const createLibraryConfigs = ({ name, external = [], entries = ['index'] }) =>
  entries.flatMap((entry, index) => [
    {
      input: `./${entry}.js`,
      output: { file: `${getOutputDir(name)}/${entry}.js`, format: 'esm' },
      external,
      plugins: [
        ...(index === 0 ? [cleanOutputDir(name)] : []),
        nodeResolve(),
        uglify(),
        ...(index === 0
          ? [
              copyPackageFiles(name, {
                main: './index.cjs',
                module: './index.js',
                exports: getExports(entries),
              }),
            ]
          : []),
      ],
    },
    {
      input: `./${entry}.js`,
      output: { file: `${getOutputDir(name)}/${entry}.cjs`, format: 'cjs' },
      external,
      plugins: [nodeResolve(), uglify()],
    },
  ]);

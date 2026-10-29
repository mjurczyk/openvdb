// NOTE Sets the release versions of all workspace packages. Used by .github/workflows/release.yml.
// A package version that is already on npm gets a minor bump. Other versions are manual bumps.
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// NOTE The release tag uses the version of this package
const corePackage = 'openvdb';
const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies'];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const getPublishedVersions = (name) => {
  try {
    const versions = JSON.parse(
      execFileSync('npm', ['view', name, 'versions', '--json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    );

    // NOTE npm gives a string, not an array, when there is only one version
    return [].concat(versions);
  } catch (error) {
    if (`${error.stdout}${error.stderr}`.includes('E404')) {
      return [];
    }

    throw error;
  }
};

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const getRemoteTagCommit = (tag) =>
  git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`).split('\t')[0];

const bumpMinor = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

  if (!match) {
    throw new Error(`Version ${version} is not x.y.z, cannot bump it`);
  }

  return `${match[1]}.${Number(match[2]) + 1}.0`;
};

// NOTE Dependencies first, so a package is published after the packages it needs
const sortByDependencies = (packages) => {
  const sorted = [];
  const visit = (pkg) => {
    if (sorted.includes(pkg)) {
      return;
    }

    dependencyFields.forEach((field) => {
      Object.keys(pkg.json[field] || {}).forEach((name) => {
        const dependency = packages.find((other) => other.json.name === name);

        if (dependency) {
          visit(dependency);
        }
      });
    });

    sorted.push(pkg);
  };

  packages.forEach(visit);

  return sorted;
};

const rootJson = readJson('package.json');
const lockJson = readJson('package-lock.json');
const packages = rootJson.workspaces.map((dir) => ({
  dir,
  json: readJson(join(dir, 'package.json')),
}));
const published = sortByDependencies(packages.filter((pkg) => !pkg.json.private));
const core = published.find((pkg) => pkg.json.name === corePackage);
const head = git('rev-parse', 'HEAD');

// NOTE The release tag is on HEAD when an earlier run failed after the push. Do not bump again.
const resume = getRemoteTagCommit(`v${core.json.version}`) === head;

if (resume) {
  console.log(`Tag v${core.json.version} is on HEAD. Continue that release, no version bumps`);
}

published.forEach((pkg) => {
  const { name, version } = pkg.json;
  const npmVersions = getPublishedVersions(name);

  pkg.bumped = !resume && npmVersions.includes(version);

  if (pkg.bumped) {
    pkg.json.version = bumpMinor(version);

    if (npmVersions.includes(pkg.json.version)) {
      throw new Error(
        `${name}@${pkg.json.version} is already on npm. Run from the latest main, or set the version manually`
      );
    }
  }

  console.log(
    `${name}: ${version} -> ${pkg.json.version} (${pkg.bumped ? 'minor bump' : 'manual'})`
  );
});

const tag = `v${core.json.version}`;
const tagCommit = getRemoteTagCommit(tag);

if (tagCommit && tagCommit !== head) {
  throw new Error(`Tag ${tag} is on another commit. Set the ${corePackage} version manually`);
}

const versions = Object.fromEntries(packages.map((pkg) => [pkg.json.name, pkg.json.version]));

packages.forEach((pkg) => {
  const lockEntry = lockJson.packages[pkg.dir];
  const legacyLockEntry = lockJson.dependencies?.[pkg.json.name];

  lockEntry.version = pkg.json.version;

  dependencyFields.forEach((field) => {
    Object.keys(pkg.json[field] || {}).forEach((name) => {
      if (!versions[name]) {
        return;
      }

      const range = `^${versions[name]}`;

      pkg.json[field][name] = range;

      if (lockEntry[field]?.[name]) {
        lockEntry[field][name] = range;
      }

      if (legacyLockEntry?.requires?.[name]) {
        legacyLockEntry.requires[name] = range;
      }
    });
  });

  writeJson(join(pkg.dir, 'package.json'), pkg.json);
});

// NOTE The private workspace root has the version of the core package
rootJson.version = core.json.version;
lockJson.version = core.json.version;
lockJson.packages[''].version = core.json.version;
writeJson('package.json', rootJson);
writeJson('package-lock.json', lockJson);

const notes = [
  `\`${corePackage}\` ${core.json.version}`,
  '',
  'Also released:',
  '',
  ...published
    .filter((pkg) => pkg !== core)
    .map((pkg) => `- \`${pkg.json.name}\` ${pkg.json.version}`),
].join('\n');

console.log(`Tag: ${tag}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `tag=${tag}`,
      `packages=${published.map((pkg) => pkg.json.name).join(' ')}`,
      'notes<<RELEASE_NOTES',
      notes,
      'RELEASE_NOTES',
      '',
    ].join('\n')
  );
}

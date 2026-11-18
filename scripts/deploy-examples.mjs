// NOTE Builds the examples and pushes them to gh-pages as a fast-forward commit.
// All files but lantern/ are replaced. See src/docs/lantern/README.md.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const pagesBranch = 'gh-pages';
const distPath = 'src/docs/examples/dist';
const keptPaths = ['lantern'];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const run = (command, args) => execFileSync(command, args, { stdio: 'inherit' });

process.chdir(git('rev-parse', '--show-toplevel'));

// NOTE The commit message names the source commit, so local changes are not allowed.
// Untracked files are checked in src/ only, because the build uses only src/.
if (git('status', '--porcelain', '--untracked-files=no') || git('status', '--porcelain', '--', 'src')) {
  console.error('Commit or stash your changes first. The deploy must match a commit.');
  process.exit(1);
}

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const commit = git('rev-parse', '--short', 'HEAD');
const source = branch === 'HEAD' ? commit : `${branch} ${commit}`;
const message = `Rebuild examples for v${version} (${source})`;

run('npm', ['run', 'build:examples']);
run('git', ['fetch', 'origin', pagesBranch]);

const pagesPath = mkdtempSync(join(tmpdir(), 'openvdb-gh-pages-'));
run('git', ['worktree', 'add', '--detach', pagesPath, `origin/${pagesBranch}`]);

const pagesGit = (...args) => git('-C', pagesPath, ...args);

try {
  pagesGit('rm', '-r', '-q', '--ignore-unmatch', '--', '.',...keptPaths.map((path) => `:!${path}`));
  cpSync(distPath, pagesPath, { recursive: true });
  pagesGit('add', '-A');

  if (!pagesGit('diff', '--cached', '--name-only')) {
    console.log(`${pagesBranch} has this build already. Nothing to deploy.`);
  } else {
    pagesGit('commit', '-q', '-m', message);
    // NOTE A normal push. If gh-pages changed, it is rejected. Run the deploy again.
    run('git', ['-C', pagesPath, 'push', 'origin', `HEAD:${pagesBranch}`]);
    console.log(`Deployed: ${message}`);
  }
} finally {
  // NOTE Removes the temporary worktree also when it has changes after an error
  run('git', ['worktree', 'remove', '--force', pagesPath]);
}

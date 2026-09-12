import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const requireServer = createRequire(new URL('../../apps/server/package.json', import.meta.url));
const execute = promisify(execFile);
const PREVIOUS_TAG = 'v1.0.0';
const NEXT_TAG = 'v1.0.1';

test('release publishes a tag and notes without updating protected main', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ecommerce-release-test-'));
  const remote = join(directory, 'remote.git');
  const checkout = join(directory, 'checkout');
  const env = { PATH: process.env.PATH, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  const git = async (...args) => (await execute('git', args, { cwd: checkout, env })).stdout.trim();
  const output = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  try {
    await execute('git', ['init', '--bare', '--initial-branch=main', remote], { env });
    await execute('git', ['clone', remote, checkout], { env });
    await git('config', 'user.name', 'Release Test');
    await git('config', 'user.email', 'release-test@example.invalid');
    await git('commit', '--allow-empty', '-m', 'chore: initialise repository');
    await git('tag', PREVIOUS_TAG);
    await git('commit', '--allow-empty', '-m', 'fix: preserve protected branch');
    await git('push', 'origin', 'main', '--tags');
    const originalHead = await git('rev-parse', 'HEAD');
    await writeFile(join(remote, 'hooks/pre-receive'), '#!/bin/sh\nwhile read old new ref; do\n  if [ "$ref" = "refs/heads/main" ]; then\n    echo "GH006: Protected branch update failed" >&2\n    exit 1\n  fi\ndone\n', { mode: 0o700 });
    const config = JSON.parse(await readFile(new URL('../../apps/server/.releaserc', import.meta.url), 'utf8'));
    let publishedRelease;
    const plugins = config.plugins.map((entry) => {
      const [name, options] = Array.isArray(entry) ? entry : [entry, {}];
      if (name === '@semantic-release/github') return {
        publish: async (_options, { nextRelease }) => {
          publishedRelease = nextRelease;
          return { name: 'Local release publisher' };
        },
      };
      return [requireServer.resolve(name), options];
    });
    const { default: semanticRelease } = await import(requireServer.resolve('semantic-release'));
    const result = await semanticRelease({ ...config, plugins, repositoryUrl: pathToFileURL(remote).href, ci: false, dryRun: false }, { cwd: checkout, env, stdout: output, stderr: output });
    assert.equal(result.nextRelease.gitTag, NEXT_TAG);
    assert.equal(publishedRelease.gitTag, NEXT_TAG);
    assert.match(publishedRelease.notes, /preserve protected branch/);
    assert.equal(await git('rev-parse', 'HEAD'), originalHead);
    assert.equal(await git('--git-dir', remote, 'rev-parse', 'refs/heads/main'), originalHead);
    assert.equal(await git('--git-dir', remote, 'rev-parse', `refs/tags/${NEXT_TAG}`), originalHead);
  } finally {
    output.destroy();
    await rm(directory, { recursive: true, force: true });
  }
});

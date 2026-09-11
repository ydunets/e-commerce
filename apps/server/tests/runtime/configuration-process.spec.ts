import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { it } from 'node:test';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const PROCESS_TIMEOUT_MS = 10_000;
const ENVIRONMENT = {
  POSTGRES_URL: 'database.example:5432',
  POSTGRES_USER: 'process-user',
  POSTGRES_PASSWORD: 'process-secret',
  POSTGRES_DB: 'store',
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
  OTEL_SDK_DISABLED: 'true',
  OTEL_SERVICE_NAME: 'from-file',
};
const ENVIRONMENT_FILE = Object.entries(ENVIRONMENT)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');
const manifest = JSON.parse(
  await readFile(new URL('../../../package.json', import.meta.url), 'utf8'),
);
const PRELOAD_PROBE = `data:text/javascript,${encodeURIComponent('process.env.PRELOAD_SEEN = process.env.OTEL_SERVICE_NAME ?? "missing";')}`;
const CONFIGURATION_PROBE = `
  import env from ${JSON.stringify(import.meta.resolve('#src/config/env'))};
  process.stdout.write(JSON.stringify({ env, preload: process.env.PRELOAD_SEEN, unrelated: process.env.UNRELATED }));
`;

function runConfiguration(directory: string, environment: NodeJS.ProcessEnv, flags: string[]) {
  return execute(
    process.execPath,
    [
      ...flags,
      '--import',
      import.meta.resolve('reflect-metadata'),
      '--import',
      import.meta.resolve('#src/instrumentation'),
      '--import',
      PRELOAD_PROBE,
      '--input-type=module',
      '-e',
      CONFIGURATION_PROBE,
    ],
    {
      cwd: directory,
      env: { PATH: process.env.PATH, OTEL_SDK_DISABLED: 'true', ...environment },
      timeout: PROCESS_TIMEOUT_MS,
    },
  );
}

it('loads local values before instrumentation and application imports while explicit values win', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'configuration-preload-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, '.env'), ENVIRONMENT_FILE);
  for (const command of ['dev:serve', 'test:unit', 'test:coverage', 'test:characterisation']) {
    const flag = manifest.scripts[command].match(/--env-file-if-exists=\S+/)?.[0];
    assert.ok(flag, `${command} must load the optional environment file at process startup`);
    const { stdout } = await runConfiguration(
      directory,
      { LOG_LEVEL: 'warn', UNRELATED: 'retained' },
      [flag],
    );
    const actual = JSON.parse(stdout);
    assert.equal(actual.env.log.level, 'warn');
    assert.equal(actual.env.server.host, 'localhost');
    assert.equal(actual.preload, 'from-file');
    assert.equal(actual.unrelated, 'retained');
  }
});

it('starts configuration successfully without a local environment file', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'configuration-no-file-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const { stdout } = await runConfiguration(directory, ENVIRONMENT, ['--env-file-if-exists=.env']);
  assert.equal(JSON.parse(stdout).env.nodeEnv, 'test');
});

it('does not read a local environment file inside the validator', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'configuration-no-io-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, '.env'), ENVIRONMENT_FILE);
  await assert.rejects(runConfiguration(directory, {}, []), (error: unknown) => {
    assert.ok(error instanceof Error && 'stderr' in error);
    assert.match(String(error.stderr), /NODE_ENV/);
    assert.doesNotMatch(String(error.stderr), /process-secret|postgres:\/\//);
    return true;
  });
});

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const image = process.argv[2];
assert.ok(image, 'Usage: node apps/server/scripts/smoke-image.mjs <server-image>');

const DATABASE_IMAGE = 'postgres:18';
const MIGRATION_IMAGE = 'ghcr.io/amacneil/dbmate:2.33.0';
const DATABASE_NAME = 'image_smoke';
const DATABASE_PORT = 5432;
const SERVER_PORT = 3000;
const STATUS_OK = 200;
const STARTUP_TIMEOUT_MS = 30_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 250;
const COMMAND_TIMEOUT_MS = 180_000;
const resources = `image-smoke-${randomUUID()}`;
const database = `${resources}-db`;
const server = `${resources}-server`;
const invalidServer = `${resources}-invalid-server`;
const databaseUrl = `postgres://${DATABASE_NAME}:${DATABASE_NAME}@${database}:${DATABASE_PORT}/${DATABASE_NAME}?sslmode=disable`;
const migrations = fileURLToPath(new URL('../db', import.meta.url));
const ownedContainers = [];
let networkCreated = false;

async function docker(...args) {
  const { stdout } = await execute('docker', args, { timeout: COMMAND_TIMEOUT_MS });
  return stdout.trim();
}

async function containerLogs(container) {
  const { stdout, stderr } = await execute('docker', ['logs', container], {
    timeout: COMMAND_TIMEOUT_MS,
  });
  return stdout + stderr;
}

async function waitFor(label, check) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch {
      // Connections and readiness probes can fail while the container starts.
    }
    await setTimeout(POLL_INTERVAL_MS);
  }
  throw new Error(`${label} did not become ready within ${STARTUP_TIMEOUT_MS}ms`);
}

async function readJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(STARTUP_TIMEOUT_MS) });
  assert.equal(response.status, STATUS_OK, url);
  return response.json();
}

try {
  await docker('network', 'create', resources);
  networkCreated = true;
  ownedContainers.push(database);
  await docker(
    'run',
    '-d',
    '--name',
    database,
    '--network',
    resources,
    '-e',
    `POSTGRES_USER=${DATABASE_NAME}`,
    '-e',
    `POSTGRES_PASSWORD=${DATABASE_NAME}`,
    '-e',
    `POSTGRES_DB=${DATABASE_NAME}`,
    DATABASE_IMAGE,
  );
  await waitFor('PostgreSQL', async () => {
    // Initialization briefly exposes a socket-only server; migrations need TCP readiness.
    await docker(
      'exec',
      database,
      'pg_isready',
      '-h',
      '127.0.0.1',
      '-U',
      DATABASE_NAME,
      '-d',
      DATABASE_NAME,
    );
    return true;
  });
  for (const directory of ['migrations', 'seeds']) {
    const migration = `${resources}-${directory}`;
    ownedContainers.push(migration);
    await docker(
      'run',
      '--rm',
      '--name',
      migration,
      '--network',
      resources,
      '-e',
      `DATABASE_URL=${databaseUrl}`,
      '-v',
      `${migrations}:/db:ro`,
      MIGRATION_IMAGE,
      '--migrations-dir',
      `/db/${directory}`,
      '--no-dump-schema',
      'up',
    );
  }

  ownedContainers.push(server);
  await docker(
    'run',
    '-d',
    '--name',
    server,
    '--network',
    resources,
    '-p',
    `127.0.0.1::${SERVER_PORT}`,
    '-e',
    'NODE_ENV=production',
    '-e',
    'HOST=0.0.0.0',
    '-e',
    `PORT=${SERVER_PORT}`,
    '-e',
    'LOG_LEVEL=info',
    '-e',
    'OTEL_SDK_DISABLED=true',
    '-e',
    `POSTGRES_URL=${database}:${DATABASE_PORT}`,
    '-e',
    `POSTGRES_USER=${DATABASE_NAME}`,
    '-e',
    `POSTGRES_PASSWORD=${DATABASE_NAME}`,
    '-e',
    `POSTGRES_DB=${DATABASE_NAME}`,
    '-e',
    'POSTGRES_SSLMODE=disable',
    image,
  );
  const address = await docker('port', server, `${SERVER_PORT}/tcp`);
  const origin = `http://${address}`;
  await waitFor('Server', async () => (await readJson(`${origin}/health`)).status === 'ok');
  const products = await readJson(`${origin}/api/v1/products?limit=1`);
  assert.equal(products.length, 1);
  const detail = await readJson(
    `${origin}/api/v1/products/${encodeURIComponent(products[0].product_id)}`,
  );
  assert.equal(detail.product_id, products[0].product_id);
  assert.ok(detail.inventory.length > 0);

  await docker(
    'exec',
    server,
    'node',
    '--input-type=module',
    '-e',
    `
    import assert from 'node:assert/strict';
    import { existsSync, readdirSync } from 'node:fs';
    assert.notEqual(process.getuid(), 0);
    for (const path of ['.env', 'src', 'tests', 'dist/tests', 'node_modules/@swc/core', 'node_modules/@cucumber/cucumber']) {
      assert.equal(existsSync(path), false, path + ' must not ship');
    }
    assert.ok(existsSync('dist/src/index.js.map'));
    assert.ok(existsSync('dist/src/instrumentation.js'));
    assert.ok(existsSync('node_modules/reflect-metadata'));
    assert.ok(!readdirSync('dist/src', { recursive: true }).some(path => /\\.spec\\.js(?:\\.map)?$/.test(path)));
  `,
  );

  const started = Date.now();
  await execute('docker', ['kill', '--signal=TERM', server], { timeout: SHUTDOWN_TIMEOUT_MS });
  const remaining = SHUTDOWN_TIMEOUT_MS - (Date.now() - started);
  assert.ok(remaining > 0, 'signal delivery exceeded the shutdown deadline');
  const { stdout } = await execute('docker', ['wait', server], { timeout: remaining });
  assert.equal(stdout.trim(), '0', 'server must exit cleanly, not be killed after timeout');
  assert.ok(Date.now() - started < SHUTDOWN_TIMEOUT_MS);

  // Observe attempts to listen, including a brief bind that polling could miss.
  // The production command remains unchanged; this preload exists only in the negative probe.
  const listenMarker = 'IMAGE_SMOKE_UNEXPECTED_LISTEN';
  const listenGuard = `data:text/javascript,${encodeURIComponent(
    `import { Server } from 'node:net'; Server.prototype.listen = function () { throw new Error('${listenMarker}'); };`,
  )}`;
  const invalidLogLevel = 'invalid-smoke-log-level';
  const secret = 'smoke-password-must-not-appear';
  ownedContainers.push(invalidServer);
  await docker(
    'run',
    '-d',
    '--name',
    invalidServer,
    '--network',
    resources,
    '-e',
    'NODE_ENV=production',
    '-e',
    `LOG_LEVEL=${invalidLogLevel}`,
    '-e',
    'OTEL_SDK_DISABLED=true',
    '-e',
    `NODE_OPTIONS=--import=${listenGuard}`,
    '-e',
    `POSTGRES_URL=${database}:${DATABASE_PORT}`,
    '-e',
    `POSTGRES_USER=${DATABASE_NAME}`,
    '-e',
    `POSTGRES_PASSWORD=${secret}`,
    '-e',
    `POSTGRES_DB=${DATABASE_NAME}`,
    image,
  );
  const rejected = await execute('docker', ['wait', invalidServer], {
    timeout: STARTUP_TIMEOUT_MS,
  });
  assert.notEqual(rejected.stdout.trim(), '0', 'invalid configuration must fail startup');
  const diagnostics = await containerLogs(invalidServer);
  assert.match(diagnostics, /Invalid configuration:.*LOG_LEVEL/);
  for (const forbidden of [invalidLogLevel, secret, listenMarker, databaseUrl]) {
    assert.ok(
      !diagnostics.includes(forbidden),
      'startup diagnostics must be redacted and listening must not be attempted',
    );
  }
  process.stdout.write(
    'Production image passed health, product reads, packaging, bounded SIGTERM exit and invalid-configuration rejection before listening.\n',
  );
} catch (error) {
  if (ownedContainers.includes(server)) {
    process.stderr.write(`${await containerLogs(server).catch(() => 'Server logs unavailable')}\n`);
  }
  throw error;
} finally {
  for (const container of ownedContainers.reverse()) {
    await docker('rm', '-f', '-v', container).catch(() => undefined);
  }
  if (networkCreated) await docker('network', 'rm', resources);
}

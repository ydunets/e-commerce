import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const COMMAND_TIMEOUT_MS = 180_000;
const HTTP_TIMEOUT_MS = 20_000;
const POLL_INTERVAL_MS = 15_000;
const POLL_ATTEMPTS = 90;
const API_VERSION = '2025-07-01';
const MIGRATION_JOB = 'ecommerce-db-migrate';
const ENDPOINTS = { health: '/health', products: '/api/v1/products', page: '/' };

async function runCommand(command, args) {
  try {
    const { stdout } = await execute(command, args, { timeout: COMMAND_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 });
    return command === 'az' && stdout.trim() ? JSON.parse(stdout) : stdout;
  } catch (error) {
    // Azure responses and command stderr can contain environment values. Keep them out of receipts.
    throw new Error(`${command} ${args.slice(0, 3).join(' ')} failed (code ${error.code ?? 'unknown'}). Inspect Azure Activity Log or registry access.`);
  }
}

export function azurePlatform(config, { run = runCommand, request = fetch, sleep = setTimeout } = {}) {
  const azure = (args) => run('az', [...args, '--only-show-errors', '--output', 'json']);
  const target = (name) => ['--name', name, '--resource-group', config.group];
  const app = (name) => azure(['containerapp', 'show', ...target(name)]);
  async function read(origin, path, json = true) {
    const url = new URL(path, origin);
    assert.equal(url.protocol, 'https:', 'Deployment probes require HTTPS');
    assert.ok(url.hostname !== 'undefined', 'Deployment probe hostname is missing');
    const response = await request(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(HTTP_TIMEOUT_MS), headers: { 'cache-control': 'no-cache' } });
    assert.ok(response.ok, `Read-only check failed: ${url.pathname} returned ${response.status}`);
    if (json) return response.json();
    assert.ok(response.headers.get('content-type')?.includes('text/html'), 'Client did not deliver HTML');
    assert.match(await response.text(), /<html[\s>]/i, 'Client page is missing HTML');
  }
  return {
    app,
    revision: async (name, revision) => (await azure(['containerapp', 'revision', 'list', ...target(name), '--all'])).find((item) => item.name === revision),
    setSingleRevisionMode: (name) => azure(['containerapp', 'revision', 'set-mode', ...target(name), '--mode', 'single']),
    async patch(name, template) {
      const current = await app(name);
      const directory = await mkdtemp(join(tmpdir(), 'ecommerce-rollout-'));
      try {
        const body = join(directory, 'patch.json');
        await writeFile(body, JSON.stringify({ properties: { template } }), { mode: 0o600 });
        await azure(['rest', '--method', 'patch', '--url', `https://management.azure.com${current.id}?api-version=${API_VERSION}`, '--body', `@${body}`]);
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
    async retain(image, role) {
      const repository = image.split('@')[0];
      await run('docker', ['buildx', 'imagetools', 'create', '--prefer-index=false', '--tag', `${repository}:recovery-${config.run}-${config.attempt}-${role}`, image]);
    },
    async migrate(image) {
      const job = await azure(['containerapp', 'job', 'update', ...target(MIGRATION_JOB), '--image', image]);
      assert.equal(job.properties.template.containers.length, 1, 'Expected one migration container');
      assert.equal(job.properties.template.containers[0].image, image, 'Migration job image mismatch');
      const execution = await azure(['containerapp', 'job', 'start', ...target(MIGRATION_JOB)]);
      assert.ok(execution.name, 'Migration execution identity is missing');
      for (let attempt = 0; attempt < (config.attempts ?? POLL_ATTEMPTS); attempt++) {
        const result = await azure(['containerapp', 'job', 'execution', 'show', ...target(MIGRATION_JOB), '--job-execution-name', execution.name]);
        assert.equal(result.properties.template?.containers?.[0]?.image, image, 'Migration execution image mismatch');
        const status = result.properties.status;
        if (status === 'Succeeded') return execution.name;
        if (['Failed', 'Stopped', 'Degraded'].includes(status)) throw new Error(`Migration ${execution.name} ended as ${status}; inspect ${MIGRATION_JOB} execution history`);
        await sleep(POLL_INTERVAL_MS);
      }
      throw new Error(`Migration ${execution.name} timed out; inspect ${MIGRATION_JOB} execution history before retrying`);
    },
    async check(role, origins) {
      for (const origin of origins) {
        if (role === 'server') assert.equal((await read(origin, ENDPOINTS.health)).status, 'ok', 'Server health check failed');
        else await read(origin, ENDPOINTS.page, false);
        const products = await read(origin, `${ENDPOINTS.products}?limit=1`);
        assert.ok(Array.isArray(products) && typeof products[0]?.product_id === 'string', 'Read-only product check requires a populated catalogue');
        const product = await read(origin, `${ENDPOINTS.products}/${encodeURIComponent(products[0].product_id)}`);
        assert.equal(product.product_id, products[0].product_id, 'Product detail mismatch');
      }
    },
    sleep,
  };
}

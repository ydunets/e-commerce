import assert from 'node:assert/strict';
import test from 'node:test';
import { azurePlatform } from './platform.mjs';

const digest = `ghcr.io/ydunets/e-commerce/migrations@sha256:${'5'.repeat(64)}`;

test('the migration execution must succeed using the recorded immutable image', async () => {
  const calls = [];
  const platform = azurePlatform({ group: 'shop', run: '120', attempt: '2', attempts: 1 }, {
    run: async (_command, args) => {
      calls.push(args);
      if (args.includes('update')) return { properties: { template: { containers: [{ image: digest }] } } };
      if (args.includes('start')) return { name: 'migration-120' };
      return { properties: { status: 'Succeeded', template: { containers: [{ image: digest }] } } };
    },
    sleep: async () => {},
  });
  assert.equal(await platform.migrate(digest), 'migration-120');
  assert.ok(calls[0].includes(digest));
  assert.ok(calls[2].includes('migration-120'));
});

for (const status of ['Failed', 'Stopped', 'Degraded', 'Running']) {
  test(`migration ${status} cannot be reported as a successful deployment`, async () => {
    const platform = azurePlatform({ group: 'shop', attempts: 1 }, {
      run: async (_command, args) => {
        if (args.includes('update')) return { properties: { template: { containers: [{ image: digest }] } } };
        if (args.includes('start')) return { name: 'migration-120' };
        return { properties: { status, template: { containers: [{ image: digest }] } } };
      }, sleep: async () => {},
    });
    await assert.rejects(platform.migrate(digest), /migration-120.*execution history/);
  });
}

test('page and API proxy verification performs only catalogue reads on both intended and public origins', async () => {
  const requests = [];
  const platform = azurePlatform({}, {
    request: async (url, options) => {
      requests.push([url.href, options.method]);
      if (url.pathname === '/') return new Response('<html><body>Shop</body></html>', { headers: { 'content-type': 'text/html' } });
      return Response.json(url.search ? [{ product_id: 'voyager-hoodie' }] : { product_id: 'voyager-hoodie' });
    },
  });
  await platform.check('client', ['https://revision.example', 'https://public.example']);
  assert.deepEqual(requests, [
    ['https://revision.example/', 'GET'], ['https://revision.example/api/v1/products?limit=1', 'GET'],
    ['https://revision.example/api/v1/products/voyager-hoodie', 'GET'],
    ['https://public.example/', 'GET'], ['https://public.example/api/v1/products?limit=1', 'GET'],
    ['https://public.example/api/v1/products/voyager-hoodie', 'GET'],
  ]);
});

test('successful HTTP status with an invalid product response fails the gate', async () => {
  const platform = azurePlatform({}, { request: async (url) => url.pathname === '/health' ? Response.json({ status: 'ok' }) : Response.json({ error: 'database unavailable' }) });
  await assert.rejects(platform.check('server', ['https://server.example']), /product check/);
});

test('Azure updates preserve the existing template and transmit it through a private temporary file', async () => {
  const { readFile, stat } = await import('node:fs/promises');
  let payloadPath;
  const template = { revisionSuffix: 'r120-2', containers: [{ name: 'server', image: digest, env: [{ name: 'DB', secretRef: 'database' }] }], scale: { minReplicas: 0 } };
  const platform = azurePlatform({ group: 'shop' }, {
    run: async (_command, args) => {
      if (args[0] === 'containerapp') return { id: '/subscriptions/sub/resourceGroups/shop/providers/Microsoft.App/containerApps/server' };
      assert.equal(args[2], 'patch');
      assert.ok(args.includes('https://management.azure.com/subscriptions/sub/resourceGroups/shop/providers/Microsoft.App/containerApps/server?api-version=2025-07-01'));
      payloadPath = args[args.indexOf('--body') + 1].slice(1);
      assert.equal((await stat(payloadPath)).mode & 0o777, 0o600);
      assert.deepEqual(JSON.parse(await readFile(payloadPath, 'utf8')), { properties: { template } });
    },
  });
  await platform.patch('server', template);
  await assert.rejects(stat(payloadPath), { code: 'ENOENT' });
});

test('recovery can retrieve a predecessor after Single mode deactivates it', async () => {
  const previous = { name: 'server--old', properties: { active: false } };
  const current = { name: 'server--new', properties: { active: true } };
  const platform = azurePlatform({ group: 'shop' }, {
    run: async (_command, args) => args.includes('--all') ? [previous, current] : [current],
  });
  assert.deepEqual(await platform.revision('server', 'server--old'), previous);
});

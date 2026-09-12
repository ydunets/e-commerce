import assert from 'node:assert/strict';
import test from 'node:test';
import { prepare, deploy } from './rollout.mjs';

const identity = { repository: 'ydunets/e-commerce', commit: 'a'.repeat(40), run: '120', attempt: '2' };
const oldServer = `ghcr.io/ydunets/e-commerce/server@sha256:${'1'.repeat(64)}`;
const oldClient = `ghcr.io/ydunets/e-commerce/client@sha256:${'2'.repeat(64)}`;
const images = {
  server: `ghcr.io/ydunets/e-commerce/server@sha256:${'3'.repeat(64)}`,
  client: `ghcr.io/ydunets/e-commerce/client@sha256:${'4'.repeat(64)}`,
  migrations: `ghcr.io/ydunets/e-commerce/migrations@sha256:${'5'.repeat(64)}`,
};
const config = { ...identity, apps: { server: 'shop-server', client: 'shop-client' }, attempts: 2 };
const bootstrap = { ...config, bootstrap: true, event: 'workflow_dispatch', actor: 'release-operator' };

function environment() {
  const events = [];
  const apps = {};
  const revisions = {};
  for (const [role, image] of [['server', oldServer], ['client', oldClient]]) {
    const name = config.apps[role];
    const revision = `${name}--old`;
    apps[name] = { id: `/apps/${name}`, name, properties: {
      latestRevisionName: revision, latestReadyRevisionName: revision,
      configuration: { activeRevisionsMode: 'Single', ingress: { fqdn: `${name}.example`, targetPort: 3000 } },
    } };
    revisions[revision] = { name: revision, properties: {
      active: true, healthState: 'Healthy', provisioningState: 'Provisioned', fqdn: `${revision}.example`,
      template: { containers: [{ name: role, image, env: [{ name: 'SECRET', secretRef: 'secret' }] }] },
    } };
  }
  const platform = {
    app: async (name) => structuredClone(apps[name]),
    revision: async (_name, revision) => structuredClone(revisions[revision]),
    retain: async (image) => events.push(['retain', image]),
    migrate: async (image) => events.push(['migrate', image]),
    patch: async (name, template) => {
      const revision = `${name}--${template.revisionSuffix}`;
      events.push(['deploy', name, template.containers[0].image]);
      for (const previous of Object.values(revisions)) {
        if (previous.name.startsWith(`${name}--`)) previous.properties.active = false;
      }
      apps[name].properties.latestRevisionName = revision;
      apps[name].properties.latestReadyRevisionName = revision;
      revisions[revision] = { name: revision, properties: {
        active: true, healthState: 'Healthy', provisioningState: 'Provisioned', fqdn: `${revision}.example`, template,
      } };
    },
    setSingleRevisionMode: async (name) => { apps[name].properties.configuration.activeRevisionsMode = 'Single'; },
    check: async (role, origins) => { events.push(['check', role, origins]); },
    sleep: async () => {},
  };
  return { platform, events, apps, revisions };
}

test('records both predecessors, migrates by digest, and verifies server before deploying client', async () => {
  const { platform, events } = environment();
  const receipt = await prepare(config, images, platform);
  assert.equal(receipt.previous.server.image, oldServer);
  assert.equal(receipt.previous.client.revision, 'shop-client--old');
  assert.ok(!JSON.stringify(receipt).includes('SECRET'));
  await deploy(config, receipt, platform);
  assert.deepEqual(events.filter(([event]) => ['migrate', 'deploy', 'check'].includes(event)).map((event) => event.slice(0, 3)), [
    ['migrate', images.migrations],
    ['deploy', 'shop-server', images.server],
    ['check', 'server', ['https://shop-server--r120-2.example', 'https://shop-server.example']],
    ['deploy', 'shop-client', images.client],
    ['check', 'client', ['https://shop-client--r120-2.example', 'https://shop-client.example']],
  ]);
  assert.equal(receipt.status, 'succeeded');
});

test('a failed server read restores the predecessor and never deploys the client', async () => {
  const { platform, events } = environment();
  const receipt = await prepare(config, images, platform);
  const check = platform.check;
  platform.check = async (role, origins) => {
    if (origins[0].includes('--r120-2.')) throw new Error('product check failed');
    return check(role, origins);
  };
  await assert.rejects(deploy(config, receipt, platform), /server.*recovered.*release failed/);
  assert.deepEqual(events.filter(([event]) => event === 'deploy'), [
    ['deploy', 'shop-server', images.server], ['deploy', 'shop-server', oldServer],
  ]);
  assert.equal(receipt.status, 'failed');
  assert.equal(receipt.outcomes.server.recovery.status, 'verified');
});

test('a failed client proxy restores only the client, retaining the verified server', async () => {
  const { platform, events } = environment();
  const receipt = await prepare(config, images, platform);
  platform.check = async (role, origins) => {
    if (role === 'client' && origins[0].includes('--r120-2.')) throw new Error('proxy failed');
  };
  await assert.rejects(deploy(config, receipt, platform), /client.*recovered.*release failed/);
  assert.deepEqual(events.filter(([event]) => event === 'deploy'), [
    ['deploy', 'shop-server', images.server], ['deploy', 'shop-client', images.client], ['deploy', 'shop-client', oldClient],
  ]);
  assert.equal(receipt.outcomes.server.status, 'verified');
});

test('failed recovery reports the affected app and exact predecessor digest', async () => {
  const { platform } = environment();
  const receipt = await prepare(config, images, platform);
  platform.check = async () => { throw new Error('unreachable'); };
  await assert.rejects(deploy(config, receipt, platform), (error) => {
    assert.match(error.message, /recovery failed.*shop-server/);
    assert.ok(error.message.includes(oldServer));
    return true;
  });
  assert.equal(receipt.outcomes.server.recovery.status, 'failed');
});

for (const mismatch of ['old-ready', 'wrong-image', 'wrong-revision']) {
  test(`an older healthy revision cannot pass the server gate: ${mismatch}`, async () => {
    const { platform, apps, revisions, events } = environment();
    const receipt = await prepare(config, images, platform);
    const patch = platform.patch;
    platform.patch = async (name, template) => {
      await patch(name, template);
      if (template.revisionSuffix !== 'r120-2') return;
      if (mismatch === 'old-ready') apps[name].properties.latestReadyRevisionName = `${name}--old`;
      if (mismatch === 'wrong-image') revisions[`${name}--r120-2`].properties.template.containers[0].image = oldServer;
      if (mismatch === 'wrong-revision') revisions[`${name}--r120-2`].name = `${name}--old`;
    };
    await assert.rejects(deploy(config, receipt, platform), /server.*recovered.*release failed/);
    assert.ok(!events.some(([event, name]) => event === 'deploy' && name === 'shop-client'));
  });
}

test('migration failure prevents application updates and never reverses the database', async () => {
  const { platform, events } = environment();
  const receipt = await prepare(config, images, platform);
  platform.migrate = async () => { throw new Error('migration failed'); };
  await assert.rejects(deploy(config, receipt, platform), /migration failed/);
  assert.ok(!events.some(([event]) => event === 'deploy'));
});

test('first latest transition requires evidence bound to the actual running revision', async () => {
  const { platform, revisions } = environment();
  revisions['shop-server--old'].properties.template.containers[0].image = 'ghcr.io/ydunets/e-commerce/server:latest';
  await assert.rejects(prepare(config, images, platform), /predecessor evidence/);
  const evidence = { server: { app: 'shop-server', revision: 'shop-server--old', image: oldServer, evidence: 'historical deployment receipt 119', verifiedBy: 'release operator' } };
  const receipt = await prepare({ ...config, evidence }, images, platform);
  assert.equal(receipt.previous.server.image, oldServer);
  await assert.rejects(prepare({ ...config, evidence: { server: { ...evidence.server, image: null } } }, images, platform), /Invalid immutable server image/);
  evidence.server.revision = 'shop-server--different';
  await assert.rejects(prepare({ ...config, evidence }, images, platform), /predecessor evidence/);
});

test('split traffic is rejected before mutation rather than guessing a predecessor', async () => {
  const { platform, apps, events } = environment();
  apps['shop-server'].properties.configuration.activeRevisionsMode = 'Multiple';
  apps['shop-server'].properties.configuration.ingress.traffic = [{ revisionName: 'shop-server--old', weight: 50 }, { revisionName: 'another', weight: 50 }];
  await assert.rejects(prepare(config, images, platform), /single traffic target/);
  assert.equal(events.length, 0);
});

test('a changed predecessor invalidates the saved receipt before migrations', async () => {
  const { platform, revisions, events } = environment();
  const receipt = await prepare(config, images, platform);
  revisions['shop-client--old'].properties.template.containers[0].image = images.client;
  await assert.rejects(deploy(config, receipt, platform), /predecessor changed/);
  assert.ok(!events.some(([event]) => event === 'migrate'));
});

test('manual bootstrap records unavailable rollback and enables subsequent normal releases', async () => {
  const { platform, revisions, events } = environment();
  for (const role of ['server', 'client']) {
    revisions[`shop-${role}--old`].properties.template.containers[0].image = `ghcr.io/ydunets/e-commerce/${role}:latest`;
  }
  const receipt = await prepare(bootstrap, images, platform);
  assert.deepEqual(receipt.bootstrap, { actor: 'release-operator', withoutRollback: ['server', 'client'] });
  assert.equal(receipt.previous.server.image, null);
  assert.equal(receipt.previous.client.image, null);
  assert.equal(events.length, 0);
  await deploy(bootstrap, receipt, platform);
  assert.equal(receipt.status, 'succeeded');
  const normal = await prepare(config, images, platform);
  assert.equal(normal.previous.server.image, images.server);
  assert.equal(normal.previous.client.image, images.client);
  assert.equal(normal.bootstrap, undefined);
});

test('bootstrap rejects automatic runs, missing actors and unnecessary exceptions before retention', async () => {
  for (const override of [{ event: 'push' }, { actor: '' }, { bootstrap: 'true' }, {}]) {
    const { platform, revisions, events } = environment();
    if (Object.keys(override).length) {
      revisions['shop-server--old'].properties.template.containers[0].image = 'ghcr.io/ydunets/e-commerce/server:latest';
    }
    await assert.rejects(prepare({ ...bootstrap, ...override }, images, platform), /Bootstrap/);
    assert.equal(events.length, 0);
  }
});

test('an unverified receipt cannot be replayed without matching manual approval', async () => {
  const { platform, revisions, events } = environment();
  revisions['shop-server--old'].properties.template.containers[0].image = 'ghcr.io/ydunets/e-commerce/server:latest';
  const receipt = await prepare(bootstrap, images, platform);
  for (const settings of [config, { ...bootstrap, actor: 'another-operator' }, { ...bootstrap, event: 'push' }]) {
    await assert.rejects(deploy(settings, structuredClone(receipt), platform), /Bootstrap/);
  }
  const altered = structuredClone(receipt);
  delete altered.bootstrap;
  await assert.rejects(deploy(bootstrap, altered, platform), /Bootstrap/);
  assert.ok(!events.some(([event]) => event === 'migrate'));
});

test('failed bootstrap never rolls back to a mutable tag or advances past the failed tier', async () => {
  for (const failedRole of ['server', 'client']) {
    const { platform, revisions, events } = environment();
    for (const role of ['server', 'client']) {
      revisions[`shop-${role}--old`].properties.template.containers[0].image = `ghcr.io/ydunets/e-commerce/${role}:latest`;
    }
    const receipt = await prepare(bootstrap, images, platform);
    platform.check = async (role) => { if (role === failedRole) throw new Error('catalogue unavailable'); };
    await assert.rejects(deploy(bootstrap, receipt, platform), /automatic recovery unavailable.*manual intervention required/);
    assert.equal(receipt.status, 'failed');
    assert.equal(receipt.outcomes[failedRole].recovery.status, 'unavailable');
    assert.deepEqual(events.filter(([event]) => event === 'deploy'), failedRole === 'server'
      ? [['deploy', 'shop-server', images.server]]
      : [['deploy', 'shop-server', images.server], ['deploy', 'shop-client', images.client]]);
    if (failedRole === 'client') assert.equal(receipt.outcomes.server.status, 'verified');
  }
});

test('bootstrap still rejects invalid evidence and retains recovery for verified predecessors', async () => {
  const { platform, revisions, events } = environment();
  revisions['shop-client--old'].properties.template.containers[0].image = 'ghcr.io/ydunets/e-commerce/client:latest';
  await assert.rejects(prepare({ ...bootstrap, evidence: { client: { revision: 'wrong' } } }, images, platform), /predecessor evidence/);
  assert.equal(events.length, 0);
  const receipt = await prepare(bootstrap, images, platform);
  assert.deepEqual(receipt.bootstrap.withoutRollback, ['client']);
  assert.deepEqual(events, [['retain', oldServer]]);
  platform.check = async (_role, origins) => {
    if (origins[0].includes('--r120-2.')) throw new Error('catalogue unavailable');
  };
  await assert.rejects(deploy(bootstrap, receipt, platform), /server.*recovered.*release failed/);
  assert.equal(receipt.outcomes.server.recovery.status, 'verified');
  assert.equal(receipt.outcomes.client, undefined);
});

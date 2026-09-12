import assert from 'node:assert/strict';
import { immutableImage } from './images.mjs';

const ROLES = ['server', 'client'];
const POLL_ATTEMPTS = 90;
const POLL_INTERVAL_MS = 15_000;
const PROBE_PATH = { server: '/health', client: '/' };
const PROBE_TYPES = ['Startup', 'Readiness'];
const PROBE_POLICY = { periodSeconds: 5, timeoutSeconds: 3, failureThreshold: 30, successThreshold: 1 };

function container(revision) {
  const containers = revision.properties.template.containers;
  assert.equal(containers.length, 1, 'Deployment requires one application container');
  return containers[0];
}

async function predecessor(config, role, platform) {
  const app = await platform.app(config.apps[role]);
  const revision = await platform.revision(app.name, app.properties.latestReadyRevisionName);
  assert.ok(revision?.properties.active && revision.properties.healthState === 'Healthy', `${role}: predecessor is not healthy`);
  const configuration = app.properties.configuration;
  if (configuration.activeRevisionsMode !== 'Single') {
    const targets = configuration.ingress.traffic?.filter((target) => target.weight > 0) ?? [];
    assert.ok(targets.length === 1 && targets[0].weight === 100 &&
      (targets[0].latestRevision ? app.properties.latestRevisionName : targets[0].revisionName) === revision.name,
    `${role}: a verified single traffic target is required before establishing Single mode`);
  }
  assert.ok(configuration.ingress?.fqdn && configuration.ingress.targetPort, `${role}: HTTP ingress is required`);
  return { app, revision };
}

function authorizeBootstrap(config) {
  assert.equal(config.bootstrap, true, 'Bootstrap requires explicit acknowledgement of unavailable rollback');
  assert.equal(config.event, 'workflow_dispatch', 'Bootstrap requires a manual workflow dispatch');
  assert.ok(config.actor?.trim(), 'Bootstrap requires an identified operator');
}

export async function prepare(config, images, platform) {
  if (config.bootstrap) authorizeBootstrap(config);
  const previous = {};
  for (const role of ROLES) {
    const { app, revision } = await predecessor(config, role, platform);
    const reference = container(revision).image;
    let image = reference;
    let evidence;
    if (!reference.includes('@')) {
      evidence = config.evidence?.[role];
      if (config.bootstrap && evidence === undefined) {
        image = null;
      } else {
        assert.ok(evidence?.app === app.name && evidence?.revision === revision.name &&
          evidence?.evidence?.trim() && evidence?.verifiedBy?.trim(),
        `${role}: verified predecessor evidence is required for this tagged revision; never resolve today's latest`);
        image = immutableImage(evidence.image, config.repository, role);
      }
    }
    if (image !== null) immutableImage(image, config.repository, role);
    previous[role] = { app: app.name, revision: revision.name, reference, image, evidence };
  }
  const bootstrap = config.bootstrap ? { actor: config.actor, withoutRollback: ROLES.filter((role) => previous[role].image === null) } : undefined;
  if (bootstrap) assert.ok(bootstrap.withoutRollback.length, 'Bootstrap is unnecessary; use a normal release');
  for (const role of ROLES) {
    if (previous[role].image !== null) await platform.retain(previous[role].image, role);
  }
  return { identity: { repository: config.repository, commit: config.commit, run: config.run, attempt: config.attempt }, images, previous, bootstrap, status: 'prepared', outcomes: {} };
}

async function updateAndVerify(config, role, previous, image, suffix, platform) {
  const app = await platform.app(previous.app);
  const source = await platform.revision(previous.app, previous.revision);
  const template = structuredClone(source.properties.template);
  const target = container(source);
  const port = app.properties.configuration.ingress.targetPort;
  const probes = PROBE_TYPES.map((type) => ({
    type, httpGet: { path: PROBE_PATH[role], port, scheme: 'HTTP' },
    ...PROBE_POLICY,
  }));
  template.containers[0] = { ...target, image, probes: [...(target.probes ?? []).filter((probe) => !PROBE_TYPES.includes(probe.type)), ...probes] };
  template.revisionSuffix = suffix;
  await platform.setSingleRevisionMode(previous.app);
  await platform.patch(previous.app, template);
  const name = `${previous.app}--${suffix}`;
  const deadline = Date.now() + POLL_ATTEMPTS * POLL_INTERVAL_MS;
  let lastState = 'revision not visible';
  for (let attempt = 0; attempt < (config.attempts ?? POLL_ATTEMPTS) && Date.now() < deadline; attempt++) {
    const current = await platform.app(previous.app);
    const revision = await platform.revision(previous.app, name);
    lastState = revision ? `${revision.properties.provisioningState}/${revision.properties.healthState}; ready=${current.properties.latestReadyRevisionName}` : 'revision not visible';
    const intended = revision?.name === name && container(revision).image === image;
    if (intended && revision.properties.active &&
      revision.properties.provisioningState === 'Provisioned' && revision.properties.healthState === 'Healthy' &&
      current.properties.latestRevisionName === name && current.properties.latestReadyRevisionName === name && current.properties.configuration.activeRevisionsMode === 'Single') {
      for (const expected of probes) {
        const actual = container(revision).probes?.find((probe) => probe.type === expected.type);
        for (const key of ['path', 'port', 'scheme']) {
          assert.equal(actual?.httpGet?.[key], expected.httpGet[key], `${role}: ${expected.type} probe ${key} was not established`);
        }
      }
      await platform.check(role, [`https://${revision.properties.fqdn}`, `https://${current.properties.configuration.ingress.fqdn}`]);
      return { revision: name, image, mode: 'Single', probes, status: 'verified' };
    }
    if (intended && revision.properties.fqdn) {
      // Read-only traffic wakes scale-to-zero revisions; it never substitutes for the readiness gate.
      try { await platform.check(role, [`https://${revision.properties.fqdn}`]); } catch { /* The readiness poll remains authoritative. */ }
    }
    await platform.sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`${role}: intended revision ${name} did not become ready with ${image}; ${lastState}`);
}

export async function deploy(config, receipt, platform) {
  receipt.status = 'failed';
  const withoutRollback = ROLES.filter((role) => receipt.previous[role].image === null);
  if (config.bootstrap || receipt.bootstrap || withoutRollback.length) {
    authorizeBootstrap(config);
    assert.deepEqual(receipt.bootstrap, { actor: config.actor, withoutRollback }, 'Bootstrap receipt does not match manual approval');
  }
  for (const role of ROLES) {
    if (!withoutRollback.includes(role)) immutableImage(receipt.previous[role].image, config.repository, role);
  }
  for (const role of ROLES) {
    const { app, revision } = await predecessor(config, role, platform);
    const saved = receipt.previous[role];
    assert.ok(app.name === saved.app && revision.name === saved.revision && container(revision).image === saved.reference,
      `${role}: predecessor changed after capture; prepare a new deployment`);
  }
  receipt.migrationExecution = await platform.migrate(receipt.images.migrations);
  for (const role of ROLES) {
    try {
      receipt.outcomes[role] = await updateAndVerify(config, role, receipt.previous[role], receipt.images[role], `r${config.run}-${config.attempt}`, platform);
    } catch (error) {
      const outcome = { status: 'failed', error: error.message, recovery: undefined };
      receipt.outcomes[role] = outcome;
      if (receipt.previous[role].image === null) {
        outcome.recovery = { status: 'unavailable', revision: receipt.previous[role].revision };
        throw new Error(`${role}: automatic recovery unavailable after bootstrap; manual intervention required for ${receipt.previous[role].app}. Inspect the saved predecessor revision ${receipt.previous[role].revision} and current traffic. Original failure: ${error.message}`);
      }
      try {
        outcome.recovery = await updateAndVerify(config, role, receipt.previous[role], receipt.previous[role].image, `recover${config.run}-${config.attempt}`, platform);
      } catch (recoveryError) {
        outcome.recovery = { status: 'failed', error: recoveryError.message };
        throw new Error(`${role}: recovery failed; inspect ${receipt.previous[role].app} revisions and logs, restore ${receipt.previous[role].image}. Original failure: ${error.message}. Recovery: ${recoveryError.message}`);
      }
      throw new Error(`${role}: recovered and verified; release failed. ${error.message}`);
    }
  }
  receipt.status = 'succeeded';
}

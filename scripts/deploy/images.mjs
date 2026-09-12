import assert from 'node:assert/strict';

export const IMAGE_APPS = ['client', 'server', 'migrations'];
const DIGEST = /^sha256:[a-f0-9]{64}$/;

export function immutableImage(image, repository, app) {
  const prefix = `ghcr.io/${repository}/${app}@`;
  assert.ok(image?.startsWith(prefix) && DIGEST.test(image.slice(prefix.length)), `Invalid immutable ${app} image`);
  return image;
}

export function imageRecord({ repository, commit, run, attempt, app, digest }) {
  assert.match(repository, /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/);
  assert.match(commit, /^[a-f0-9]{40}$/);
  assert.match(run, /^[1-9][0-9]*$/);
  assert.match(attempt, /^[1-9][0-9]*$/);
  assert.ok(IMAGE_APPS.includes(app), 'Unknown image application');
  const image = immutableImage(`ghcr.io/${repository}/${app}@${digest}`, repository, app);
  return { repository, commit, run, attempt, app, image };
}

export function releaseImages(records, identity) {
  assert.equal(records.length, IMAGE_APPS.length, 'All three build records are required');
  return Object.fromEntries(IMAGE_APPS.map((app) => {
    const matches = records.filter((record) => record.app === app);
    assert.equal(matches.length, 1, `Expected one ${app} build record`);
    const record = matches[0];
    for (const key of ['repository', 'commit', 'run', 'attempt']) {
      assert.equal(record[key], identity[key], `Build record ${key} mismatch`);
    }
    return [app, immutableImage(record.image, identity.repository, app)];
  }));
}

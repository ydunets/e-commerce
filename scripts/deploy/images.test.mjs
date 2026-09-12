import assert from 'node:assert/strict';
import test from 'node:test';
import { imageRecord, releaseImages } from './images.mjs';

const identity = { repository: 'ydunets/e-commerce', commit: 'a'.repeat(40), run: '120', attempt: '2' };
const digest = `sha256:${'b'.repeat(64)}`;

test('built images carry their exact digest, source commit and workflow identity', () => {
  const records = ['client', 'server', 'migrations'].map((app) => imageRecord({ ...identity, app, digest }));
  assert.deepEqual(records[1], { ...identity, app: 'server', image: `ghcr.io/ydunets/e-commerce/server@${digest}` });
  assert.equal(releaseImages(records, identity).migrations, `ghcr.io/ydunets/e-commerce/migrations@${digest}`);
});

for (const problem of ['missing', 'duplicate', 'other-run', 'other-commit', 'other-attempt', 'tag']) {
  test(`release rejects inconsistent build records: ${problem}`, () => {
    const records = ['client', 'server', 'migrations'].map((app) => imageRecord({ ...identity, app, digest }));
    if (problem === 'missing') records.pop();
    if (problem === 'duplicate') records[0] = records[1];
    if (problem === 'other-run') records[0].run = '119';
    if (problem === 'other-commit') records[0].commit = 'c'.repeat(40);
    if (problem === 'other-attempt') records[0].attempt = '1';
    if (problem === 'tag') records[0].image = 'ghcr.io/ydunets/e-commerce/client:latest';
    assert.throws(() => releaseImages(records, identity));
  });
}

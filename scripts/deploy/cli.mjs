import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { IMAGE_APPS, imageRecord, releaseImages } from './images.mjs';
import { azurePlatform } from './platform.mjs';
import { prepare, deploy } from './rollout.mjs';

const OUTPUT = 'deployment';
const PREDECESSORS = `${OUTPUT}/predecessors.json`;
const RESULT = `${OUTPUT}/result.json`;
const env = process.env;
const identity = { repository: env.GITHUB_REPOSITORY?.toLowerCase(), commit: env.GITHUB_SHA, run: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT };
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const save = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });

try {
  await mkdir(`${OUTPUT}/images`, { recursive: true });
  const command = process.argv[2];
  if (command === 'record') {
    const record = imageRecord({ ...identity, app: env.IMAGE_APP, digest: env.IMAGE_DIGEST });
    await save(`${OUTPUT}/images/${record.app}.json`, record);
  } else {
    assert.ok(['prepare', 'deploy'].includes(command), 'Expected record, prepare, or deploy');
    assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Production deployment is restricted to main');
    const records = await Promise.all(IMAGE_APPS.map((app) => readJson(`${OUTPUT}/images/${app}.json`)));
    const images = releaseImages(records, identity);
    const config = { ...identity, group: env.AZURE_RESOURCE_GROUP, apps: { server: env.AZURE_SERVER_APP, client: env.AZURE_CLIENT_APP }, evidence: JSON.parse(env.PREDECESSOR_IMAGES || '{}'), bootstrap: env.BOOTSTRAP_WITHOUT_VERIFIED_ROLLBACK === 'true', event: env.GITHUB_EVENT_NAME, actor: env.GITHUB_ACTOR };
    assert.ok(config.group && config.apps.server && config.apps.client, 'Production Azure variables are required');
    const platform = azurePlatform(config);
    if (command === 'prepare') {
      const receipt = await prepare(config, images, platform);
      await save(PREDECESSORS, receipt);
      if (receipt.bootstrap) console.warn(`Bootstrap acknowledged by ${receipt.bootstrap.actor}: automatic rollback unavailable for ${receipt.bootstrap.withoutRollback.join(', ')}`);
    } else {
      const receipt = await readJson(PREDECESSORS);
      assert.deepEqual(receipt.identity, identity, 'Predecessor receipt belongs to another release');
      assert.deepEqual(receipt.images, images, 'Build records changed after preparation');
      try {
        await deploy(config, receipt, platform);
      } catch (error) {
        receipt.error = error.message;
        throw error;
      } finally {
        await save(RESULT, receipt);
      }
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

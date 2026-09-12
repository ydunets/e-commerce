import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { it } from 'node:test';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { Nest12Instrumentation, VERIFIED_NEST_VERSION } from '#src/shared/nest/instrumentation';

const VERIFIED_INSTRUMENTATION_VERSION = '0.68.0';
const UPGRADE_INSTRUCTIONS =
  'Revalidate with test:characterisation (live tracing and draining) and the production image smoke gate. ' +
  'Remove the compatibility adapter if upstream supports the new Nest version; otherwise update the verified versions after these gates pass.';

it('requires telemetry compatibility revalidation when either pinned dependency changes', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../../../package.json', import.meta.url), 'utf8'),
  );
  for (const [name, version] of [
    ['@nestjs/core', VERIFIED_NEST_VERSION],
    ['@opentelemetry/instrumentation-nestjs-core', VERIFIED_INSTRUMENTATION_VERSION],
  ]) {
    assert.equal(manifest.dependencies[name], version, `${name}: ${UPGRADE_INSTRUCTIONS}`);
    const installed = JSON.parse(
      await readFile(
        new URL(`../../../node_modules/${name}/package.json`, import.meta.url),
        'utf8',
      ),
    );
    assert.equal(installed.version, version, `${name}: ${UPGRADE_INSTRUCTIONS}`);
  }
});

it('preserves upstream instrumentation files while extending only the verified Nest version', () => {
  const upstream = new NestInstrumentation({ enabled: false }).init();
  const adapted = new Nest12Instrumentation({ enabled: false }).init();
  assert.deepEqual(adapted.supportedVersions, [
    ...upstream.supportedVersions,
    VERIFIED_NEST_VERSION,
  ]);
  assert.deepEqual(
    adapted.files.map((file) => file.name),
    upstream.files.map((file) => file.name),
  );
  for (const [index, file] of adapted.files.entries()) {
    assert.deepEqual(file.supportedVersions, [
      ...upstream.files[index].supportedVersions,
      VERIFIED_NEST_VERSION,
    ]);
  }
});

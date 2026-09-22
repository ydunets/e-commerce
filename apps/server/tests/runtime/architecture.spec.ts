import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { isType } from '@e-commerce/contracts';

const execute = promisify(execFile);
const require = createRequire(import.meta.url);
const configuration = require('../../../.dependency-cruiser.cjs');
const executable = fileURLToPath(
  new URL('../../../node_modules/dependency-cruiser/bin/dependency-cruise.mjs', import.meta.url),
);
const RELEVANT_RULES = [
  'no-domain-to-api-deps',
  'no-command-query-to-api-deps',
  'no-handler-to-infrastructure-deps',
];

it('rejects controller and persistence imports across layers while allowing repository ports', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'architecture-rules-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const files = {
    'src/feature/example.controller.ts': 'export const controller = 1;',
    'src/feature/database/example.repository.ts': 'export const repository = 1;',
    'src/feature/database/example.repository.port.ts':
      'export interface Repository { read(): void }',
    'src/shared/db/postgres.ts': 'export const database = 1;',
    'src/feature/domain/example.ts':
      "import { controller } from '../example.controller'; export const value = controller;",
    'src/feature/example.handler.ts':
      "import { controller } from './example.controller'; import { repository } from './database/example.repository'; import { database } from '../shared/db/postgres'; export const value = [controller, repository, database];",
    'src/feature/valid.handler.ts':
      "import type { Repository } from './database/example.repository.port'; export function read(repository: Repository) { repository.read(); }",
  };
  for (const [name, content] of Object.entries(files)) {
    const path = join(directory, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  await writeFile(
    join(directory, 'rules.json'),
    JSON.stringify({
      forbidden: configuration.forbidden.filter((rule: { name: string }) =>
        RELEVANT_RULES.includes(rule.name),
      ),
      options: { tsPreCompilationDeps: true },
    }),
  );
  // JSON reporting returns the violations even when the cruise exits unsuccessfully.
  let output: string;
  try {
    ({ stdout: output } = await execute(
      process.execPath,
      [executable, 'src', '--config', 'rules.json', '--output-type', 'json'],
      { cwd: directory },
    ));
  } catch (error) {
    assert.ok(isType(error, 'error') && 'stdout' in error);
    output = String(error.stdout);
  }
  const violations = JSON.parse(output).summary.violations;
  assert.equal(violations.length, 4);
  for (const name of RELEVANT_RULES) {
    assert.ok(
      violations.some((violation: { rule: { name: string } }) => violation.rule.name === name),
      name,
    );
  }
  assert.ok(
    violations.every((violation: { from: string }) => !violation.from.endsWith('valid.handler.ts')),
  );
});

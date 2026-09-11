import assert from 'node:assert/strict';
import { it } from 'node:test';
import {
  COMPONENT_METADATA,
  CompilerProbe,
  failWithSourceLocation,
} from './fixtures/compiler-probe.js';
import { RuntimeDependency } from './fixtures/runtime-dependency.js';

const PARAMETER_TYPES = 'design:paramtypes';

it('resolves emitted constructor metadata to the imported runtime class', () => {
  assert.ok(import.meta.url.endsWith('/dist/tests/runtime/compiled-runtime.spec.js'));
  assert.equal(Reflect.getMetadata(COMPONENT_METADATA, CompilerProbe), true);
  const parameterTypes = Reflect.getMetadata(PARAMETER_TYPES, CompilerProbe);
  assert.deepEqual(parameterTypes, [RuntimeDependency]);
  const dependency = new parameterTypes[0]();
  const probe = new CompilerProbe(dependency);
  assert.equal(probe.dependency.value, 'compiled dependency');
});

it('resolves application and test aliases to compiled JavaScript', () => {
  assert.ok(import.meta.resolve('#src/server/index').endsWith('/dist/src/server/index.js'));
  assert.ok(import.meta.resolve('#tests/support/server').endsWith('/dist/tests/support/server.js'));
});

it('maps compiled exception stacks back to the TypeScript source', () => {
  assert.throws(failWithSourceLocation, (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.stack ?? '', /tests\/runtime\/fixtures\/compiler-probe\.ts:\d+:\d+/);
    return true;
  });
});

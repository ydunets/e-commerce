import assert from 'node:assert/strict';
import { it } from 'node:test';
import { z } from 'zod';
import { createValidationPipe, ValidationException } from '#src/shared/nest/validation';

it('reports complete escaped JSON Pointer paths separately from domain details', async () => {
  const pipe = createValidationPipe();
  await assert.rejects(
    pipe.transform(
      { 'a/b': [{ '~key': 3 }] },
      {
        type: 'body',
        schema: z.object({ 'a/b': z.array(z.object({ '~key': z.string() })) }),
      },
    ),
    (error: unknown) => {
      assert.ok(error instanceof ValidationException);
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, 'Validation error');
      assert.deepEqual(
        error.subErrors.map((issue) => issue.path),
        ['/a~1b/0/~0key'],
      );
      assert.equal(error.metadata, undefined);
      return true;
    },
  );
});

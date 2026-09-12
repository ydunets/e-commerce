import assert from 'node:assert/strict';
import { it } from 'node:test';
import { type ApiErrorResponse, apiErrorResponseSchema } from '@e-commerce/contracts';
import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { addCartItemBodySchema } from '#src/modules/cart/cart.schema';
import { createValidationPipe } from '#src/shared/nest/validation';

it('keeps request defaults optional while documenting resolved response values', () => {
  const schema = z.object({ quantity: z.int().min(1).default(1) });
  assert.deepEqual(
    schema['~standard'].jsonSchema.input({ target: 'openapi-3.0' }).required ?? [],
    [],
  );
  assert.deepEqual(schema['~standard'].jsonSchema.output({ target: 'openapi-3.0' }).required, [
    'quantity',
  ]);
  assert.deepEqual(schema.parse({}), { quantity: 1 });
});

it('preserves the public error contract identity', () => {
  const error: ApiErrorResponse = {
    statusCode: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    message: 'Validation error',
    correlationId: 'example',
    subErrors: [{ path: '/email', message: 'Invalid email' }],
  };
  assert.equal(apiErrorResponseSchema.meta()?.id, 'ApiErrorResponse');
  assert.deepEqual(apiErrorResponseSchema.parse(error), error);
});

it('normalizes cart scalar values and accepts unknown fields without accepting invalid quantities', async () => {
  const pipe = createValidationPipe();
  const metadata = { type: 'body' as const, metatype: Object, schema: addCartItemBodySchema };
  for (const quantity of ['2', ['2'], 2]) {
    assert.deepEqual(
      await pipe.transform({ sku: ['example-sku'], quantity, extra: 'ignored' }, metadata),
      { sku: 'example-sku', quantity: 2 },
    );
  }
  for (const quantity of [0, undefined, '', 'invalid', ['1', '2']]) {
    await assert.rejects(() => pipe.transform({ sku: 'example-sku', quantity }, metadata));
  }
});

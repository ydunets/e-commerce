import assert from 'node:assert/strict';
import { it } from 'node:test';
import {
  addCartItemBodySchema,
  apiErrorResponseSchema,
  apiErrorSubErrorSchema,
} from '@e-commerce/contracts';
import Fastify from 'fastify';
import { z } from 'zod';
import { toLegacySchema } from '#src/shared/api/legacy-schema';

const STATUS_OK = 200;
const ENDPOINT = '/';

it('keeps request defaults optional while documenting resolved response values', async () => {
  const schema = z.object({ quantity: z.int().min(1).default(1) });
  const requestSchema = toLegacySchema(schema, 'input');
  const responseSchema = toLegacySchema(schema, 'output');
  assert.deepEqual(requestSchema.required ?? [], []);
  assert.deepEqual(responseSchema.required, ['quantity']);
  const app = Fastify();
  try {
    app.post(
      ENDPOINT,
      { schema: { body: requestSchema, response: { [STATUS_OK]: responseSchema } } },
      async (request) => request.body,
    );
    const response = await app.inject({ method: 'POST', url: ENDPOINT, payload: {} });
    assert.equal(response.statusCode, STATUS_OK);
    assert.deepEqual(response.json(), { quantity: 1 });
  } finally {
    await app.close();
  }
});

it('preserves error schema identity, field examples and nested metadata', () => {
  assert.equal(apiErrorResponseSchema.meta()?.id, 'ApiErrorResponse');
  const converted = toLegacySchema(apiErrorResponseSchema, 'output');
  assert.equal(converted.$id, 'ApiErrorResponse');
  assert.equal(converted.id, undefined);
  const statusCode = converted.properties?.statusCode;
  const subErrors = converted.properties?.subErrors;
  const path = toLegacySchema(apiErrorSubErrorSchema, 'output').properties?.path;
  assert.ok(statusCode && typeof statusCode === 'object');
  assert.ok(subErrors && typeof subErrors === 'object');
  assert.ok(path && typeof path === 'object');
  assert.equal(statusCode.example, 400);
  assert.equal(subErrors.description, 'Field-level details for a validation failure');
  assert.equal(path.example, '/email');
});

it('keeps legacy request coercion and unknown-field acceptance without accepting invalid quantities', async () => {
  const app = Fastify({ ajv: { customOptions: { keywords: ['example'] } } });
  try {
    app.post(
      ENDPOINT,
      { schema: { body: toLegacySchema(addCartItemBodySchema, 'input') } },
      async (request) => request.body,
    );
    const response = await app.inject({
      method: 'POST',
      url: ENDPOINT,
      payload: { sku: 'example-sku', quantity: '2', extra: 'retained' },
    });
    assert.equal(response.statusCode, STATUS_OK);
    assert.deepEqual(response.json(), { sku: 'example-sku', quantity: 2, extra: 'retained' });
    const invalid = await app.inject({
      method: 'POST',
      url: ENDPOINT,
      payload: { sku: 'example-sku', quantity: 0 },
    });
    const STATUS_BAD_REQUEST = 400;
    assert.equal(invalid.statusCode, STATUS_BAD_REQUEST);
  } finally {
    await app.close();
  }
});

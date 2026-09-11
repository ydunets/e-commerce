import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';
import env from '#src/config/env';
import { DATABASE } from '#src/shared/db/tokens';
import { CONFIGURATION } from '#src/shared/nest/shared.module';
import { STATUS_OK } from '../shared/http.js';
import type { ICustomWorld } from '../support/custom-world.js';

Then('the legacy error identifies the invalid rating', function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.equal(body.message, 'Validation error');
  assert.equal(body.details, undefined);
  assert.equal(body.subErrors[0].path, '/rating');
  assert.equal(typeof body.subErrors[0].message, 'string');
  assert.ok(body.subErrors[0].message.length > 0);
  assert.equal(typeof body.correlationId, 'string');
  assert.ok(body.correlationId.length > 0);
});

Then('the compiled API documents every existing business endpoint', function (this: ICustomWorld) {
  assert.ok(import.meta.url.endsWith('/dist/tests/runtime/runtime.steps.js'));
  assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
  const document = this.context.latestResponse!.json<{
    paths: Record<string, Record<string, unknown>>;
  }>();
  assert.ok(document.paths['/health']?.get);
  assert.equal(this.server.get(DATABASE), this.db);
  assert.equal(this.server.get(CONFIGURATION), env);
  assert.ok(this.server.getHttpAdapter().getInstance().getSchema('ApiErrorResponse'));
  const endpoints = Object.entries(document.paths)
    .filter(([path]) => path.startsWith('/api/v1/'))
    .flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
    );
  assert.deepEqual(
    endpoints.sort(),
    [
      'GET /api/v1/products',
      'GET /api/v1/products/{id}',
      'GET /api/v1/products/{productId}/reviews',
      'GET /api/v1/products/{productId}/reviews/summary',
      'GET /api/v1/specifications',
      'POST /api/v1/newsletter/subscriptions',
      'POST /api/v1/carts/items',
      'GET /api/v1/carts/{cartId}',
      'PATCH /api/v1/carts/{cartId}/items/{sku}',
      'DELETE /api/v1/carts/{cartId}/items/{sku}',
      'POST /api/v1/carts/{cartId}/coupons',
      'DELETE /api/v1/carts/{cartId}/coupons/{code}',
      'POST /api/v1/carts/{cartId}/validate',
    ].sort(),
  );
});

Then('the compiled API is healthy', function (this: ICustomWorld) {
  assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
  assert.deepEqual(this.context.latestResponse!.json(), { status: 'ok' });
});

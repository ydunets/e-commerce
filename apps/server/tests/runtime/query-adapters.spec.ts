import assert from 'node:assert/strict';
import { it } from 'node:test';
import {
  GetInventoryStockQuery,
  getInventoryStockQuery,
} from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.query';
import {
  GetReviewSummaryQuery,
  getReviewSummaryQuery,
} from '#src/modules/review/queries/get-review-summary/get-review-summary.query';
import { connectInventoryQuery } from '#src/server/migration/inventory-query.adapter';
import { LegacyReviewSummaryHandler } from '#src/server/migration/legacy-review-summary.handler';
import { decorateCommandWithMetadata } from '#src/shared/cqrs/middlewares';
import { createRequestBus } from '#src/shared/cqrs/request-bus';
import { NotFoundException } from '#src/shared/exceptions/index';

it('forwards legacy inventory lookups without losing class identity, metadata, undefined or exceptions', async () => {
  const legacy = createRequestBus('Query');
  legacy.addMiddleware(decorateCommandWithMetadata);
  const metadata = { correlationId: 'inventory-adapter', timestamp: 456 };
  const failure = new Error('inventory unavailable');
  connectInventoryQuery(legacy, {
    async execute(query) {
      assert.ok(query instanceof GetInventoryStockQuery);
      assert.deepEqual(query.meta, metadata);
      if (query.payload.sku === 'failure') throw failure;
      return query.payload.sku === 'missing' ? undefined : { sku: query.payload.sku, stock: 4 };
    },
  });
  assert.deepEqual(await legacy.execute(getInventoryStockQuery({ sku: 'cap-sm' }, metadata)), {
    sku: 'cap-sm',
    stock: 4,
  });
  assert.equal(
    await legacy.execute(getInventoryStockQuery({ sku: 'missing' }, metadata)),
    undefined,
  );
  await assert.rejects(
    legacy.execute(getInventoryStockQuery({ sku: 'failure' }, metadata)),
    (error) => error === failure,
  );
  assert.throws(
    () =>
      connectInventoryQuery(legacy, {
        async execute() {
          return undefined;
        },
      }),
    /already registered/,
  );
});

it('forwards review results, metadata and domain exceptions across the temporary adapter', async () => {
  const handler = new LegacyReviewSummaryHandler();
  await assert.rejects(
    handler.execute(new GetReviewSummaryQuery({ productId: 'cap' })),
    /not connected/,
  );
  const bus = createRequestBus('Query');
  const summary = { total: 2, average: 4.5, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } };
  const metadata = { correlationId: 'review-adapter', timestamp: 123 };
  const missing = new NotFoundException('Product missing not found');
  bus.register<{ productId: string }>(getReviewSummaryQuery.type, async (action) => {
    assert.deepEqual(action.meta, metadata);
    if (action.payload.productId === 'missing') throw missing;
    assert.equal(action.payload.productId, 'cap');
    return summary;
  });
  handler.connect(bus);
  assert.equal(
    await handler.execute(new GetReviewSummaryQuery({ productId: 'cap' }, metadata)),
    summary,
  );
  await assert.rejects(
    handler.execute(new GetReviewSummaryQuery({ productId: 'missing' }, metadata)),
    (error) => error === missing,
  );
});

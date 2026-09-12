import assert from 'node:assert/strict';
import { it } from 'node:test';
import {
  GetInventoryStockQuery,
  getInventoryStockQuery,
} from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.query';
import { connectInventoryQuery } from '#src/server/migration/inventory-query.adapter';
import { decorateCommandWithMetadata } from '#src/shared/cqrs/middlewares';
import { createRequestBus } from '#src/shared/cqrs/request-bus';

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

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProductRepository } from '#src/modules/product/database/product.repository.port';
import { GetReviewSummaryQuery } from '#src/modules/review/queries/get-review-summary/get-review-summary.query';
import { NotFoundException } from '#src/shared/exceptions/index';
import { FindProductHandler } from './find-product.handler.js';
import { FindProductQuery } from './find-product.query.js';

const baseProduct = {
  id: 'test-cap',
  name: 'Test Cap',
  description: 'A cap.',
  collection: 'urban',
  colors: ['brown'],
  sizes: ['sm'],
  variants: [],
  images: [],
  info: [],
};
const repository: ProductRepository = {
  async findOneById(id) {
    return id === 'test-cap' ? baseProduct : undefined;
  },
  async findMany() {
    return [];
  },
  async findStockBySku() {
    return undefined;
  },
};

describe('FindProductHandler', () => {
  it('composes the review summary through the raw query bus', async () => {
    const handler = new FindProductHandler(repository, {
      async execute(query: GetReviewSummaryQuery) {
        assert.ok(query instanceof GetReviewSummaryQuery);
        assert.deepEqual(query.payload, { productId: 'test-cap' });
        return { total: 12, average: 4.25, distribution: { 1: 0, 2: 0, 3: 1, 4: 5, 5: 6 } };
      },
    });
    const result = await handler.execute(new FindProductQuery({ id: 'test-cap' }));
    assert.deepEqual(result.reviews, { count: 12, average: 4.25 });
  });

  it('throws the established domain not-found error when the product does not exist', async () => {
    const handler = new FindProductHandler(repository, {
      async execute() {
        return { total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
      },
    });
    await assert.rejects(handler.execute(new FindProductQuery({ id: 'missing' })), (error) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, 'Product missing not found');
      return true;
    });
  });
});

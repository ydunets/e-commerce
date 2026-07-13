import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getReviewSummaryQuery } from '#src/modules/review/index.ts';
import makeFindProductQuery from './find-product.handler.ts';

const baseProduct = {
  id: 'test-cap',
  name: 'Test Cap',
  description: 'A cap.',
  colors: ['brown'],
  sizes: ['sm'],
  variants: [],
  images: [],
  info: [],
};

describe('findProductQuery handler', () => {
  it('composes the review summary from the review module via the query bus', async () => {
    const queryBus = {
      execute: async (action: ReturnType<typeof getReviewSummaryQuery>) => {
        assert.equal(action.type, 'review/get-summary');
        assert.deepEqual(action.payload, { productId: 'test-cap' });
        return { total: 12, average: 4.25, distribution: { 1: 0, 2: 0, 3: 1, 4: 5, 5: 6 } };
      },
    };
    const productRepository = {
      findOneById: async (id: string) => (id === 'test-cap' ? baseProduct : undefined),
    };

    const { handler } = makeFindProductQuery({ queryBus, productRepository } as never);
    const result = await handler({ payload: { id: 'test-cap' } } as never);

    assert.deepEqual(result.reviews, { count: 12, average: 4.25 });
  });

  it('throws NotFoundException when the product does not exist', async () => {
    const queryBus = { execute: async () => assert.fail('should not be called') };
    const productRepository = { findOneById: async () => undefined };

    const { handler } = makeFindProductQuery({ queryBus, productRepository } as never);

    await assert.rejects(() => handler({ payload: { id: 'missing' } } as never));
  });
});

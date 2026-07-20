import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paginatedQueryBase } from './query.base.ts';

describe('paginatedQueryBase()', () => {
  it('applies defaults when no pagination params are given', () => {
    const payload: { productId: string; page?: number } = { productId: 'test-cap' };
    const query = paginatedQueryBase(payload);
    assert.deepEqual(
      { limit: query.limit, page: query.page, offset: query.offset },
      { limit: 20, page: 0, offset: 0 },
    );
  });

  it('derives offset from page and limit', () => {
    const query = paginatedQueryBase({ page: 2, limit: 10 });
    assert.equal(query.offset, 20);
  });

  it('preserves extra payload props', () => {
    const payload = { productId: 'test-cap', page: 1, limit: 5 };
    const query = paginatedQueryBase(payload);
    assert.equal(query.productId, 'test-cap');
  });

  it('never lets a smuggled offset override the derived one', () => {
    const query = paginatedQueryBase({ page: 2, limit: 10, offset: 999 });
    assert.equal(query.offset, 20);
  });
});

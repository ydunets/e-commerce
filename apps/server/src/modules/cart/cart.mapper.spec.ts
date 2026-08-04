import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import cartMapper from './cart.mapper.ts';

describe('cartMapper.toResponse()', () => {
  it('sums line quantities into totalUnits', () => {
    const response = cartMapper().toResponse({
      id: 'cart-1',
      createdAt: new Date(),
      lines: [
        { sku: 'sku-a', quantity: 2 },
        { sku: 'sku-b', quantity: 3 },
      ],
    });

    assert.deepEqual(response, {
      id: 'cart-1',
      lines: [
        { sku: 'sku-a', quantity: 2 },
        { sku: 'sku-b', quantity: 3 },
      ],
      totalUnits: 5,
    });
  });

  it('maps an empty cart to zero totalUnits', () => {
    const response = cartMapper().toResponse({ id: 'cart-1', createdAt: new Date(), lines: [] });

    assert.deepEqual(response, { id: 'cart-1', lines: [], totalUnits: 0 });
  });
});

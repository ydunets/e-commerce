import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException } from '#src/shared/exceptions/index.ts';
import { assertWithinStock, reconcileCartStock } from './cart.stock.ts';
import type { EnrichedCartLine } from './cart.types.ts';

function enrichedLine(sku: string, quantity: number, stock: number): EnrichedCartLine {
  return {
    sku,
    quantity,
    productId: 'voyager-hoodie',
    name: 'Voyager Hoodie',
    color: 'brown',
    size: 's',
    imageUrl: null,
    listPrice: 95,
    discountPercentage: null,
    salePrice: 95,
    stock,
  };
}

describe('assertWithinStock()', () => {
  it('accepts a quantity equal to the stock', () => {
    assert.doesNotThrow(() => assertWithinStock('sku-a', 3, 3));
  });

  it('rejects a quantity above stock with the structured conflict detail', () => {
    try {
      assertWithinStock('sku-a', 4, 3);
      assert.fail('expected a ConflictException');
    } catch (error) {
      assert.ok(error instanceof ConflictException);
      assert.deepEqual(error.metadata, { sku: 'sku-a', requested: 4, available: 3 });
    }
  });
});

describe('reconcileCartStock()', () => {
  it('reports nothing when every line fits the current stock', () => {
    const changes = reconcileCartStock([enrichedLine('sku-a', 2, 5), enrichedLine('sku-b', 3, 3)]);

    assert.deepEqual(changes, []);
  });

  it('clamps an oversold line to the current stock', () => {
    const changes = reconcileCartStock([enrichedLine('sku-a', 5, 3)]);

    assert.deepEqual(changes, [
      { sku: 'sku-a', name: 'Voyager Hoodie', previousQuantity: 5, quantity: 3, stock: 3 },
    ]);
  });

  it('marks a sold-out line for removal with quantity zero', () => {
    const changes = reconcileCartStock([enrichedLine('sku-a', 2, 0)]);

    assert.deepEqual(changes, [
      { sku: 'sku-a', name: 'Voyager Hoodie', previousQuantity: 2, quantity: 0, stock: 0 },
    ]);
  });
});

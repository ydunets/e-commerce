import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EnrichedCartLine } from '#src/modules/cart/domain/cart.types.ts';
import cartMapper from './cart.mapper.ts';

function enrichedLine(sku: string, quantity: number, stock = 10): EnrichedCartLine {
  return {
    sku,
    quantity,
    productId: 'voyager-hoodie',
    name: 'Voyager Hoodie',
    color: 'brown',
    size: 's',
    imageUrl: 'https://cdn.example.com/voyager-brown.jpg',
    listPrice: 95,
    discountPercentage: 20,
    salePrice: 76,
    stock,
  };
}

describe('cartMapper.toResponse()', () => {
  it('maps enriched lines and coupons to the snake_case contract', () => {
    const response = cartMapper().toResponse({
      id: 'cart-1',
      createdAt: new Date(),
      lines: [enrichedLine('sku-a', 2), enrichedLine('sku-b', 3)],
      coupons: [{ code: 'WELCOME15', discountType: 'percentage', value: 15 }],
    });

    assert.deepEqual(response.lines[0], {
      sku: 'sku-a',
      quantity: 2,
      product_id: 'voyager-hoodie',
      name: 'Voyager Hoodie',
      color: 'brown',
      size: 's',
      image_url: 'https://cdn.example.com/voyager-brown.jpg',
      list_price: 95,
      discount_percentage: 20,
      sale_price: 76,
      stock: 10,
    });
    assert.deepEqual(response.coupons, [
      { code: 'WELCOME15', discount_type: 'percentage', value: 15 },
    ]);
    assert.equal(response.totalUnits, 5);
  });

  it('maps an empty cart to zero totalUnits', () => {
    const response = cartMapper().toResponse({
      id: 'cart-1',
      createdAt: new Date(),
      lines: [],
      coupons: [],
    });

    assert.deepEqual(response, { id: 'cart-1', lines: [], coupons: [], totalUnits: 0 });
  });
});

describe('cartMapper.toValidateResponse()', () => {
  it('maps stock changes to the snake_case contract alongside the cart', () => {
    const response = cartMapper().toValidateResponse(
      { id: 'cart-1', createdAt: new Date(), lines: [enrichedLine('sku-a', 3, 3)], coupons: [] },
      [{ sku: 'sku-b', name: 'Voyager Hoodie', previousQuantity: 4, quantity: 0, stock: 0 }],
    );

    assert.equal(response.cart.id, 'cart-1');
    assert.deepEqual(response.changes, [
      { sku: 'sku-b', name: 'Voyager Hoodie', previous_quantity: 4, quantity: 0, stock: 0 },
    ]);
  });
});

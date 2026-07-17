import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProductEntity, ProductVariant } from './domain/product.types.ts';
import productMapper from './product.mapper.ts';

const variant = (overrides: Partial<ProductVariant>): ProductVariant => ({
  sku: 'sku',
  color: 'green',
  size: 'sm',
  listPrice: 95,
  salePrice: 95,
  discountPercentage: null,
  stock: 1,
  sold: 0,
  ...overrides,
});

const entity: ProductEntity = {
  id: 'test-cap',
  name: 'Test Cap',
  description: 'A cap.',
  colors: ['green'],
  sizes: ['sm', 'md'],
  variants: [
    variant({ sku: 'green-sm', salePrice: 76, discountPercentage: 20 }),
    variant({ sku: 'green-md', size: 'md' }),
  ],
  images: [{ color: 'green', url: 'https://img/green-1' }],
  info: [{ title: 'Features', description: ['Warm'] }],
  reviews: { count: 12, average: 4.25 },
};

describe('productMapper().toResponse()', () => {
  it('derives priceRange from variant sale prices', () => {
    const response = productMapper().toResponse(entity);
    assert.deepEqual(response.priceRange, { highest: 95, lowest: 76 });
  });

  it('returns a zero priceRange when there are no variants', () => {
    const response = productMapper().toResponse({ ...entity, variants: [] });
    assert.deepEqual(response.priceRange, { highest: 0, lowest: 0 });
  });

  it('maps camelCase entity fields to the snake_case DTO shape', () => {
    const response = productMapper().toResponse(entity);
    assert.deepEqual(response.inventory[0], {
      sku: 'green-sm',
      color: 'green',
      size: 'sm',
      list_price: 95,
      discount_percentage: 20,
      sale_price: 76,
      sold: 0,
      stock: 1,
    });
    assert.deepEqual(response.images, [{ color: 'green', image_url: 'https://img/green-1' }]);
    assert.deepEqual(
      { id: response.product_id, rating: response.rating, reviews: response.reviews },
      { id: 'test-cap', rating: 4.25, reviews: 12 },
    );
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProductVariant } from '#src/modules/product/domain/product.types.ts';
import { byColorThenSize, distinctSizes, orderedColors } from './product.ordering.ts';

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

// Deliberately shuffled: images list brown first so the image-derived colour
// order differs from the inventory row order.
const inventory = [
  { color: 'green' },
  { color: 'navy' },
  { color: 'brown' },
  { color: 'green' },
  { color: 'brown' },
];

const images = [{ color: 'brown' }, { color: 'green' }];

describe('orderedColors()', () => {
  it('orders colours by first image appearance, unimaged colours last', () => {
    assert.deepEqual(orderedColors(inventory, images), ['brown', 'green', 'navy']);
  });

  it('breaks ties between unimaged colours alphabetically', () => {
    assert.deepEqual(orderedColors([{ color: 'navy' }, { color: 'beige' }], []), ['beige', 'navy']);
  });
});

describe('byColorThenSize()', () => {
  it('sorts variants by colour order, then by size', () => {
    const variants = [
      variant({ sku: 'green-md', color: 'green', size: 'md' }),
      variant({ sku: 'navy-os', color: 'navy', size: null }),
      variant({ sku: 'brown-md', color: 'brown', size: 'md' }),
      variant({ sku: 'green-sm', color: 'green', size: 'sm' }),
      variant({ sku: 'brown-sm', color: 'brown', size: 'sm' }),
    ];
    const sorted = variants.sort(byColorThenSize(['brown', 'green', 'navy']));
    assert.deepEqual(
      sorted.map((item) => item.sku),
      ['brown-sm', 'brown-md', 'green-sm', 'green-md', 'navy-os'],
    );
  });

  it('ranks colours missing from the order list last', () => {
    const sorted = [
      variant({ sku: 'stray', color: 'stray', size: 'sm' }),
      variant({ sku: 'brown-sm', color: 'brown', size: 'sm' }),
    ].sort(byColorThenSize(['brown']));
    assert.deepEqual(
      sorted.map((item) => item.sku),
      ['brown-sm', 'stray'],
    );
  });
});

describe('distinctSizes()', () => {
  it('derives deduplicated sizes in canonical order, skipping one-size', () => {
    const variants = [
      variant({ size: 'md' }),
      variant({ size: null }),
      variant({ size: 'md' }),
      variant({ size: 'sm' }),
    ];
    assert.deepEqual(distinctSizes(variants), ['sm', 'md']);
  });
});

import { expect, test } from '@rstest/core';
import {
  colorLabel,
  type Product,
  type ProductVariant,
} from '@/entities/product';
import { productFixture } from '@/entities/product/model/product.fixture.ts';
import {
  colorPreviewImages,
  findVariant,
  imagesForColor,
  isColorSoldOut,
  sizeLabel,
  sizesForColor,
  variantStock,
} from '@/widgets/product-details/lib/product-display.ts';

const COLOR_GREEN = 'green';
const COLOR_BROWN = 'brown';
const COLOR_WITHOUT_IMAGES = 'navy';
const SIZE_SM = 'sm';
const SIZE_MD = 'md';
const SIZE_UNKNOWN = 'os';
const ONE_SIZE = null;
const SKU_ONE_SIZE = 'vh-one-size';
const SHARED_FALLBACK_URL = 'https://picsum.photos/seed/vh-shared/800';
const NO_STOCK = 0;

// Expected values are derived from the fixture rather than hard-coded, so the
// tests stay correct if the fixture changes.
const stockFor = (color: string, size: string) =>
  productFixture.variants.find(
    (variant) => variant.color === color && variant.size === size,
  )?.stock ?? 0;

const firstImageFor = (color: string) =>
  productFixture.images.find((image) => image.color === color)?.url;

const makeVariant = (overrides: Partial<ProductVariant>): ProductVariant => ({
  sku: 'sku-test',
  color: COLOR_GREEN,
  size: SIZE_SM,
  price: { sale: 0, list: 0, discountPercentage: null },
  stock: 1,
  sold: 0,
  ...overrides,
});

const makeProduct = (overrides: Partial<Product>): Product => ({
  ...productFixture,
  ...overrides,
});

test('colorLabel capitalises the first letter of the colour name', () => {
  expect(colorLabel(COLOR_GREEN)).toBe('Green');
});

test('sizeLabel maps known clothing sizes to their display form', () => {
  expect(sizeLabel(SIZE_SM)).toBe('S');
  expect(sizeLabel('xxl')).toBe('XXL');
});

test('sizeLabel upper-cases sizes outside the known set', () => {
  expect(sizeLabel(SIZE_UNKNOWN)).toBe('OS');
  expect(sizeLabel('4.5')).toBe('4.5');
});

test('sizesForColor returns unique sizes of the colour in rank order', () => {
  const product = makeProduct({
    variants: [
      makeVariant({ size: SIZE_MD }),
      makeVariant({ size: SIZE_SM }),
      makeVariant({ size: SIZE_SM }),
      makeVariant({ color: COLOR_BROWN, size: 'xl' }),
    ],
  });

  expect(sizesForColor(product, COLOR_GREEN)).toEqual([SIZE_SM, SIZE_MD]);
});

test('sizesForColor drops one-size (null) variants', () => {
  const product = makeProduct({
    variants: [makeVariant({ size: ONE_SIZE })],
  });

  expect(sizesForColor(product, COLOR_GREEN)).toEqual([]);
});

test('sizesForColor orders shoe sizes numerically, not lexically', () => {
  const product = makeProduct({
    variants: ['10', '4.5', '9.5'].map((size) => makeVariant({ size })),
  });

  expect(sizesForColor(product, COLOR_GREEN)).toEqual(['4.5', '9.5', '10']);
});

test('sizesForColor falls back to alphabetical order for unknown sizes', () => {
  const product = makeProduct({
    variants: ['tall', 'petite'].map((size) => makeVariant({ size })),
  });

  expect(sizesForColor(product, COLOR_GREEN)).toEqual(['petite', 'tall']);
});

test('imagesForColor returns the images tagged with the colour', () => {
  const expected = productFixture.images
    .filter((image) => image.color === COLOR_GREEN)
    .map((image) => image.url);

  expect(imagesForColor(productFixture, COLOR_GREEN)).toEqual(expected);
});

test('imagesForColor falls back to all images for an untagged colour', () => {
  expect(imagesForColor(productFixture, COLOR_WITHOUT_IMAGES)).toEqual(
    productFixture.images.map((image) => image.url),
  );
});

test('colorPreviewImages picks the first image of each colour', () => {
  expect(colorPreviewImages(productFixture)).toEqual([
    firstImageFor(COLOR_GREEN),
    firstImageFor(COLOR_BROWN),
  ]);
});

test('colorPreviewImages dedupes colours sharing the fallback image', () => {
  const product = makeProduct({
    images: [{ color: COLOR_WITHOUT_IMAGES, url: SHARED_FALLBACK_URL }],
  });

  expect(colorPreviewImages(product)).toEqual([SHARED_FALLBACK_URL]);
});

test('findVariant matches on both colour and size', () => {
  const expected = productFixture.variants.find(
    (variant) => variant.color === COLOR_GREEN && variant.size === SIZE_SM,
  );

  expect(findVariant(productFixture, COLOR_GREEN, SIZE_SM)).toBe(expected);
  expect(findVariant(productFixture, COLOR_GREEN, SIZE_UNKNOWN)).toBe(
    undefined,
  );
});

test('findVariant matches one-size variants by null size', () => {
  const product = makeProduct({
    variants: [makeVariant({ sku: SKU_ONE_SIZE, size: ONE_SIZE })],
  });

  expect(findVariant(product, COLOR_GREEN, ONE_SIZE)?.sku).toBe(SKU_ONE_SIZE);
});

test('variantStock returns the variant stock, or zero when missing', () => {
  expect(variantStock(productFixture, COLOR_GREEN, SIZE_SM)).toBe(
    stockFor(COLOR_GREEN, SIZE_SM),
  );
  expect(variantStock(productFixture, COLOR_GREEN, SIZE_UNKNOWN)).toBe(
    NO_STOCK,
  );
});

test('isColorSoldOut is true only when every variant of the colour has zero stock', () => {
  const soldOut = makeProduct({
    variants: [
      makeVariant({ size: SIZE_SM, stock: NO_STOCK }),
      makeVariant({ size: SIZE_MD, stock: NO_STOCK }),
    ],
  });

  expect(isColorSoldOut(productFixture, COLOR_GREEN)).toBe(false);
  expect(isColorSoldOut(soldOut, COLOR_GREEN)).toBe(true);
});

test('isColorSoldOut is false for a colour with no variants', () => {
  expect(isColorSoldOut(productFixture, COLOR_WITHOUT_IMAGES)).toBe(false);
});

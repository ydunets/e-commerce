import type { CartLineDto, CartResponseDto } from '@e-commerce/contracts';

/** Discounted line — the sale price shown struck against the list price. */
export const discountedCartLineFixture: CartLineDto = {
  sku: 'voyager-hoodie-brown-s',
  quantity: 2,
  product_id: 'voyager-hoodie',
  name: 'Voyager Hoodie',
  color: 'brown',
  size: 'sm',
  image_url: 'https://picsum.photos/seed/vh-brown/600',
  list_price: 95,
  discount_percentage: 20,
  sale_price: 76,
  stock: 5,
};

/** Full-price line without a size — one-size products render no size part. */
export const fullPriceCartLineFixture: CartLineDto = {
  sku: 'azure-attitude-shades-blue',
  quantity: 1,
  product_id: 'azure-attitude-shades',
  name: 'Azure Attitude Shades',
  color: 'blue',
  size: null,
  image_url: 'https://picsum.photos/seed/aas-blue/600',
  list_price: 45,
  discount_percentage: null,
  sale_price: 45,
  stock: 3,
};

export const cartFixture: CartResponseDto = {
  id: '0f8b2c4e-6a1d-4f3b-9c7e-2d5a8e1b4c6f',
  lines: [discountedCartLineFixture, fullPriceCartLineFixture],
  coupons: [],
  totalUnits: 3,
};

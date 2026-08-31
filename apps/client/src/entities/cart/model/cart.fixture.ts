import type {
  AppliedCouponDto,
  CartLineDto,
  CartResponseDto,
} from '@e-commerce/contracts';

/** Discounted line — the sale price shown struck against the list price. */
export const discountedCartLineFixture: CartLineDto = {
  sku: 'voyager-hoodie-brown-s',
  quantity: 2,
  product_id: 'voyager-hoodie',
  name: 'Voyager Hoodie',
  description:
    'Journey in style and comfort with our Voyager Hoodie, made for every adventure.',
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
  description:
    'Step out in style with our Azure Attitude Shades, featuring a bold blue tint.',
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

/** Percentage coupon — 15% of the subtotal. */
export const percentageCouponFixture: AppliedCouponDto = {
  code: 'WELCOME15',
  discount_type: 'percentage',
  value: 15,
};

/** Fixed coupon — a flat $5 off. */
export const fixedCouponFixture: AppliedCouponDto = {
  code: 'GR8FRNTND24',
  discount_type: 'fixed',
  value: 5,
};

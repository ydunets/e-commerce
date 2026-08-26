import { type Static, Type } from 'typebox';

export const CART_DISCOUNT_TYPES = ['percentage', 'fixed'] as const;

export const cartDiscountTypeSchema = Type.Enum(CART_DISCOUNT_TYPES);

// Joined product fields mirror the inventory item naming (snake_case) so the
// client's price helpers work on either shape.
export const cartLineDtoSchema = Type.Object({
  sku: Type.String({ example: 'voyager-hoodie-brown-s' }),
  quantity: Type.Integer({ minimum: 1, example: 2 }),
  product_id: Type.String({ example: 'voyager-hoodie' }),
  name: Type.String({ example: 'Voyager Hoodie' }),
  color: Type.String({ example: 'brown' }),
  size: Type.Union([Type.String(), Type.Null()]),
  image_url: Type.Union([Type.String(), Type.Null()]),
  list_price: Type.Number(),
  discount_percentage: Type.Union([Type.Number(), Type.Null()]),
  sale_price: Type.Number(),
  stock: Type.Integer({
    minimum: 0,
    description: 'Current stock of the SKU, the quantity stepper maximum',
  }),
});

export const appliedCouponDtoSchema = Type.Object({
  code: Type.String({ example: 'WELCOME15' }),
  discount_type: cartDiscountTypeSchema,
  value: Type.Number({
    description: 'Percent of the subtotal for percentage coupons, currency amount for fixed ones',
  }),
});

export const cartResponseDtoSchema = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Cart identifier issued by the server' }),
  lines: Type.Array(cartLineDtoSchema, { description: 'Latest added first' }),
  coupons: Type.Array(appliedCouponDtoSchema, { description: 'In application order' }),
  totalUnits: Type.Integer({
    minimum: 0,
    description: 'Sum of all line quantities, shown on the navbar badge',
  }),
});

export const stockChangeDtoSchema = Type.Object({
  sku: Type.String(),
  name: Type.String(),
  previous_quantity: Type.Integer({ minimum: 1 }),
  quantity: Type.Integer({ minimum: 0, description: '0 means the line was removed' }),
  stock: Type.Integer({ minimum: 0 }),
});

export const validateCartResponseDtoSchema = Type.Object({
  cart: cartResponseDtoSchema,
  changes: Type.Array(stockChangeDtoSchema, {
    description: 'Empty when every line fits the current stock',
  }),
});

export const addCartItemBodySchema = Type.Object({
  cartId: Type.Optional(
    Type.String({
      format: 'uuid',
      description: 'Existing cart to append to; omit to create a cart implicitly',
    }),
  ),
  sku: Type.String({ example: 'voyager-hoodie-brown-s' }),
  quantity: Type.Integer({ minimum: 1, example: 1 }),
});

export const updateCartItemBodySchema = Type.Object({
  quantity: Type.Integer({ minimum: 1, example: 3 }),
});

export const applyCouponBodySchema = Type.Object({
  code: Type.String({ minLength: 1, example: 'WELCOME15' }),
});

export const cartParamsSchema = Type.Object({
  cartId: Type.String({ format: 'uuid' }),
});

export const cartLineParamsSchema = Type.Object({
  cartId: Type.String({ format: 'uuid' }),
  sku: Type.String({ example: 'voyager-hoodie-brown-s' }),
});

export const cartCouponParamsSchema = Type.Object({
  cartId: Type.String({ format: 'uuid' }),
  code: Type.String({ example: 'WELCOME15' }),
});

export type CartDiscountTypeDto = Static<typeof cartDiscountTypeSchema>;
export type CartLineDto = Static<typeof cartLineDtoSchema>;
export type AppliedCouponDto = Static<typeof appliedCouponDtoSchema>;
export type CartResponseDto = Static<typeof cartResponseDtoSchema>;
export type StockChangeDto = Static<typeof stockChangeDtoSchema>;
export type ValidateCartResponseDto = Static<typeof validateCartResponseDtoSchema>;
export type AddCartItemBodyDto = Static<typeof addCartItemBodySchema>;
export type UpdateCartItemBodyDto = Static<typeof updateCartItemBodySchema>;
export type ApplyCouponBodyDto = Static<typeof applyCouponBodySchema>;

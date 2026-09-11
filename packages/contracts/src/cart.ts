import { z } from 'zod';

export const CART_DISCOUNT_TYPES = ['percentage', 'fixed'] as const;

export const cartDiscountTypeSchema = z.enum(CART_DISCOUNT_TYPES);

// Joined product fields mirror the inventory item naming (snake_case) so the
// client's price helpers work on either shape.
export const cartLineDtoSchema = z.object({
  sku: z.string().meta({ example: 'voyager-hoodie-brown-s' }),
  quantity: z.int().min(1).meta({ example: 2 }),
  product_id: z.string().meta({ example: 'voyager-hoodie' }),
  name: z.string().meta({ example: 'Voyager Hoodie' }),
  description: z.string().meta({ example: 'A hoodie for every journey.' }),
  color: z.string().meta({ example: 'brown' }),
  size: z.union([z.string(), z.null()]),
  image_url: z.union([z.string(), z.null()]),
  list_price: z.number(),
  discount_percentage: z.union([z.number(), z.null()]),
  sale_price: z.number(),
  stock: z.int().min(0).meta({
    description: 'Current stock of the SKU, the quantity stepper maximum',
  }),
});

export const appliedCouponDtoSchema = z.object({
  code: z.string().meta({ example: 'WELCOME15' }),
  discount_type: cartDiscountTypeSchema,
  value: z.number().meta({
    description: 'Percent of the subtotal for percentage coupons, currency amount for fixed ones',
  }),
});

export const cartResponseDtoSchema = z.object({
  id: z.uuid().meta({ description: 'Cart identifier issued by the server' }),
  lines: z.array(cartLineDtoSchema).meta({ description: 'Latest added first' }),
  coupons: z.array(appliedCouponDtoSchema).meta({ description: 'In application order' }),
  totalUnits: z.int().min(0).meta({
    description: 'Sum of all line quantities, shown on the navbar badge',
  }),
});

export const stockChangeDtoSchema = z.object({
  sku: z.string(),
  name: z.string(),
  previous_quantity: z.int().min(1),
  quantity: z.int().min(0).meta({ description: '0 means the line was removed' }),
  stock: z.int().min(0),
});

export const validateCartResponseDtoSchema = z.object({
  cart: cartResponseDtoSchema,
  changes: z.array(stockChangeDtoSchema).meta({
    description: 'Empty when every line fits the current stock',
  }),
});

export const addCartItemBodySchema = z.object({
  cartId: z
    .uuid()
    .meta({
      description: 'Existing cart to append to; omit to create a cart implicitly',
    })
    .optional(),
  sku: z.string().meta({ example: 'voyager-hoodie-brown-s' }),
  quantity: z.int().min(1).meta({ example: 1 }),
});

export const updateCartItemBodySchema = z.object({
  quantity: z.int().min(1).meta({ example: 3 }),
});

export const applyCouponBodySchema = z.object({
  code: z.string().min(1).meta({ example: 'WELCOME15' }),
});

export const cartParamsSchema = z.object({
  cartId: z.uuid(),
});

export const cartLineParamsSchema = z.object({
  cartId: z.uuid(),
  sku: z.string().meta({ example: 'voyager-hoodie-brown-s' }),
});

export const cartCouponParamsSchema = z.object({
  cartId: z.uuid(),
  code: z.string().meta({ example: 'WELCOME15' }),
});

export type CartDiscountTypeDto = z.infer<typeof cartDiscountTypeSchema>;
export type CartLineDto = z.infer<typeof cartLineDtoSchema>;
export type AppliedCouponDto = z.infer<typeof appliedCouponDtoSchema>;
export type CartResponseDto = z.infer<typeof cartResponseDtoSchema>;
export type StockChangeDto = z.infer<typeof stockChangeDtoSchema>;
export type ValidateCartResponseDto = z.infer<typeof validateCartResponseDtoSchema>;
export type AddCartItemBodyDto = z.infer<typeof addCartItemBodySchema>;
export type UpdateCartItemBodyDto = z.infer<typeof updateCartItemBodySchema>;
export type ApplyCouponBodyDto = z.infer<typeof applyCouponBodySchema>;

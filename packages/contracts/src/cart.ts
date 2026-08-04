import { type Static, Type } from 'typebox';

export const cartLineDtoSchema = Type.Object({
  sku: Type.String({ example: 'voyager-hoodie-brown-s' }),
  quantity: Type.Integer({ minimum: 1, example: 2 }),
});

export const cartResponseDtoSchema = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Cart identifier issued by the server' }),
  lines: Type.Array(cartLineDtoSchema),
  totalUnits: Type.Integer({
    minimum: 0,
    description: 'Sum of all line quantities, shown on the navbar badge',
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

export const cartParamsSchema = Type.Object({
  cartId: Type.String({ format: 'uuid' }),
});

export const cartLineParamsSchema = Type.Object({
  cartId: Type.String({ format: 'uuid' }),
  sku: Type.String({ example: 'voyager-hoodie-brown-s' }),
});

export type CartLineDto = Static<typeof cartLineDtoSchema>;
export type CartResponseDto = Static<typeof cartResponseDtoSchema>;
export type AddCartItemBodyDto = Static<typeof addCartItemBodySchema>;
export type UpdateCartItemBodyDto = Static<typeof updateCartItemBodySchema>;

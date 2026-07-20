import { Type } from 'typebox';

export const listProductsQuerystringSchema = Type.Object({
  limit: Type.Optional(
    Type.Integer({
      example: 8,
      description: 'Maximum number of products to return',
      minimum: 1,
      maximum: 100,
    }),
  ),
  offset: Type.Optional(
    Type.Integer({
      example: 0,
      description: 'Number of products to skip from the newest-first order',
      minimum: 0,
    }),
  ),
});

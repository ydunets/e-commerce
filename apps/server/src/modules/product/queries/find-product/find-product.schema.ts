import { Type } from 'typebox';

export const findProductParamsSchema = Type.Object({
  id: Type.String({ example: 'voyager-hoodie', description: 'Product identifier (slug)' }),
});

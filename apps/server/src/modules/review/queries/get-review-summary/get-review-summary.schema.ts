import { Type } from 'typebox';

export const getReviewSummaryParamsSchema = Type.Object({
  productId: Type.String({
    example: 'autumnal-knitwear',
    description: 'Product identifier (slug)',
  }),
});

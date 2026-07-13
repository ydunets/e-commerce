import { Type } from 'typebox';
import { paginatedQueryRequestDtoSchema } from '#src/shared/api/paginated-query.request.dto.ts';

export const findProductReviewsParamsSchema = Type.Object({
  productId: Type.String({
    example: 'autumnal-knitwear',
    description: 'Product identifier (slug)',
  }),
});

export const findProductReviewsQuerySchema = Type.Intersect([
  paginatedQueryRequestDtoSchema,
  Type.Object({
    rating: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 5,
        example: 5,
        description: 'Filter reviews by star rating',
      }),
    ),
  }),
]);

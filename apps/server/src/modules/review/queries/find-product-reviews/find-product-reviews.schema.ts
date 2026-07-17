import { Type } from 'typebox';
import { paginatedQueryRequestProperties } from '#src/shared/api/paginated-query.request.dto.ts';

export const findProductReviewsParamsSchema = Type.Object({
  productId: Type.String({
    example: 'autumnal-knitwear',
    description: 'Product identifier (slug)',
  }),
});

// additionalProperties: false + Fastify's removeAdditional strip unknown query
// keys so they can never reach the action payload (and the SQL) unvalidated.
export const findProductReviewsQuerySchema = Type.Object(
  {
    ...paginatedQueryRequestProperties,
    rating: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 5,
        example: 5,
        description: 'Filter reviews by star rating',
      }),
    ),
  },
  { additionalProperties: false },
);

import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { reviewPaginatedResponseSchema } from '#src/modules/review/dtos/review.paginated.response.dto.ts';
import { findProductReviewsQuery } from './find-product-reviews.handler.ts';
import {
  findProductReviewsParamsSchema,
  findProductReviewsQuerySchema,
} from './find-product-reviews.schema.ts';

export default async function findProductReviews(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/products/:productId/reviews',
    schema: {
      description: 'Find reviews for a product (paginated, optionally filtered by rating)',
      params: findProductReviewsParamsSchema,
      querystring: findProductReviewsQuerySchema,
      response: {
        200: reviewPaginatedResponseSchema,
      },
      tags: ['reviews'],
    },
    handler: async (req, res) => {
      const result = await fastify.queryBus.execute(
        findProductReviewsQuery({
          productId: req.params.productId,
          limit: req.query.limit,
          page: req.query.page,
          rating: req.query.rating,
        }),
      );
      const response = {
        ...result,
        data: result.data.map(fastify.diContainer.cradle.reviewMapper.toResponse),
      };
      return res.status(200).send(response);
    },
  });
}

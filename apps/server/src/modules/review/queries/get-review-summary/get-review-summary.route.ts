import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { reviewSummaryResponseDtoSchema } from '#src/modules/review/dtos/review-summary.response.dto.ts';
import { getReviewSummaryQuery } from './get-review-summary.handler.ts';
import { getReviewSummaryParamsSchema } from './get-review-summary.schema.ts';

export default async function getReviewSummary(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/products/:productId/reviews/summary',
    schema: {
      description: 'Get the rating summary (average + distribution) for a product',
      params: getReviewSummaryParamsSchema,
      response: {
        200: reviewSummaryResponseDtoSchema,
      },
      tags: ['reviews'],
    },
    handler: async (req, res) => {
      const summary = await fastify.queryBus.execute(
        getReviewSummaryQuery({ productId: req.params.productId }),
      );
      return res.status(200).send(summary);
    },
  });
}

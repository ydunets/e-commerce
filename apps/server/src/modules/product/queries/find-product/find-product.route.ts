import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { productResponseDtoSchema } from '#src/modules/product/dtos/product.response.dto.ts';
import { findProductQuery } from './find-product.handler.ts';
import { findProductParamsSchema } from './find-product.schema.ts';

export default async function findProduct(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/products/:id',
    schema: {
      description: 'Get a product by id',
      params: findProductParamsSchema,
      response: {
        200: productResponseDtoSchema,
      },
      tags: ['products'],
    },
    handler: async (req, res) => {
      const product = await fastify.queryBus.execute(findProductQuery({ id: req.params.id }));
      return res.status(200).send(fastify.diContainer.cradle.productMapper.toResponse(product));
    },
  });
}

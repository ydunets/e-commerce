import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';
import { productListItemDtoSchema } from '#src/modules/product/dtos/product.response.dto.ts';
import { listProductsQuery } from './list-products.handler.ts';
import { listProductsQuerystringSchema } from './list-products.schema.ts';

export default async function listProducts(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/products',
    schema: {
      description: 'List products newest-first with per-colour card data',
      querystring: listProductsQuerystringSchema,
      response: {
        200: Type.Array(productListItemDtoSchema),
      },
      tags: ['products'],
    },
    handler: async (req, res) => {
      const products = await fastify.queryBus.execute(
        listProductsQuery({ limit: req.query.limit, offset: req.query.offset }),
      );
      const { productMapper } = fastify.diContainer.cradle;
      return res
        .status(200)
        .send(products.map((product) => productMapper.toListItemResponse(product)));
    },
  });
}

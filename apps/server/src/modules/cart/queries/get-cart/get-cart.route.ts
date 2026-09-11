import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { cartResponseDtoSchema } from '#src/modules/cart/dtos/cart.response.dto';
import { getCartQuery } from './get-cart.handler.js';
import { cartParamsSchema } from './get-cart.schema.js';

export default async function getCart(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/carts/:cartId',
    schema: {
      description: "Get a cart's lines and computed total units",
      params: cartParamsSchema,
      response: {
        200: cartResponseDtoSchema,
      },
      tags: ['cart'],
    },
    handler: async (req, res) => {
      const cart = await fastify.queryBus.execute(getCartQuery({ cartId: req.params.cartId }));
      return res.status(200).send(fastify.diContainer.cradle.cartMapper.toResponse(cart));
    },
  });
}

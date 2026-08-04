import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { cartResponseDtoSchema } from '#src/modules/cart/dtos/cart.response.dto.ts';
import { removeItemCommand } from './remove-item.handler.ts';
import { cartLineParamsSchema } from './remove-item.schema.ts';

export default async function removeItem(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/carts/:cartId/items/:sku',
    schema: {
      description: 'Remove a line from the cart; the cart itself survives empty',
      params: cartLineParamsSchema,
      response: {
        200: cartResponseDtoSchema,
      },
      tags: ['cart'],
    },
    handler: async (req, res) => {
      const cart = await fastify.commandBus.execute(
        removeItemCommand({ cartId: req.params.cartId, sku: req.params.sku }),
      );
      return res.status(200).send(fastify.diContainer.cradle.cartMapper.toResponse(cart));
    },
  });
}

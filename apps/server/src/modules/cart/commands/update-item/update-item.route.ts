import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { cartResponseDtoSchema } from '#src/modules/cart/dtos/cart.response.dto.ts';
import { updateItemCommand } from './update-item.handler.ts';
import { cartLineParamsSchema, updateCartItemBodySchema } from './update-item.schema.ts';

export default async function updateItem(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/carts/:cartId/items/:sku',
    schema: {
      description: "Set a cart line's quantity",
      params: cartLineParamsSchema,
      body: updateCartItemBodySchema,
      response: {
        200: cartResponseDtoSchema,
      },
      tags: ['cart'],
    },
    handler: async (req, res) => {
      const cart = await fastify.commandBus.execute(
        updateItemCommand({
          cartId: req.params.cartId,
          sku: req.params.sku,
          quantity: req.body.quantity,
        }),
      );
      return res.status(200).send(fastify.diContainer.cradle.cartMapper.toResponse(cart));
    },
  });
}

import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { cartResponseDtoSchema } from '#src/modules/cart/dtos/cart.response.dto.ts';
import { addItemCommand } from './add-item.handler.ts';
import { addCartItemBodySchema } from './add-item.schema.ts';

export default async function addItem(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'POST',
    url: '/v1/carts/items',
    schema: {
      description: 'Add an inventory item to a cart; omitting cartId creates the cart implicitly',
      body: addCartItemBodySchema,
      response: {
        200: cartResponseDtoSchema,
      },
      tags: ['cart'],
    },
    handler: async (req, res) => {
      const cart = await fastify.commandBus.execute(addItemCommand(req.body));
      return res.status(200).send(fastify.diContainer.cradle.cartMapper.toResponse(cart));
    },
  });
}

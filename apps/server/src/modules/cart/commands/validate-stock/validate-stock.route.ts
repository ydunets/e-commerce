import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { validateCartResponseDtoSchema } from '#src/modules/cart/dtos/cart.response.dto.ts';
import { validateStockCommand } from './validate-stock.handler.ts';
import { cartParamsSchema } from './validate-stock.schema.ts';

export default async function validateStock(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'POST',
    url: '/v1/carts/:cartId/validate',
    schema: {
      description:
        'Reconcile every cart line against current stock, clamping or removing ' +
        'oversold lines; answers the corrected cart plus the applied changes',
      params: cartParamsSchema,
      response: {
        200: validateCartResponseDtoSchema,
      },
      tags: ['cart'],
    },
    handler: async (req, res) => {
      const result = await fastify.commandBus.execute(
        validateStockCommand({ cartId: req.params.cartId }),
      );
      return res
        .status(200)
        .send(
          fastify.diContainer.cradle.cartMapper.toValidateResponse(result.cart, result.changes),
        );
    },
  });
}

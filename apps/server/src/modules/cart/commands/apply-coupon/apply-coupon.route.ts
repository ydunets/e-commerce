import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { cartResponseDtoSchema } from '#src/modules/cart/dtos/cart.response.dto.ts';
import { applyCouponCommand } from './apply-coupon.handler.ts';
import { applyCouponBodySchema, cartParamsSchema } from './apply-coupon.schema.ts';

export default async function applyCoupon(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'POST',
    url: '/v1/carts/:cartId/coupons',
    schema: {
      description: 'Apply a coupon code to the cart; re-applying an applied code is a no-op',
      params: cartParamsSchema,
      body: applyCouponBodySchema,
      response: {
        200: cartResponseDtoSchema,
      },
      tags: ['cart'],
    },
    handler: async (req, res) => {
      const cart = await fastify.commandBus.execute(
        applyCouponCommand({ cartId: req.params.cartId, code: req.body.code }),
      );
      return res.status(200).send(fastify.diContainer.cradle.cartMapper.toResponse(cart));
    },
  });
}

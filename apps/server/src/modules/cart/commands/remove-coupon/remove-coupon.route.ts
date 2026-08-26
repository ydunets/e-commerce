import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { cartResponseDtoSchema } from '#src/modules/cart/dtos/cart.response.dto.ts';
import { removeCouponCommand } from './remove-coupon.handler.ts';
import { cartCouponParamsSchema } from './remove-coupon.schema.ts';

export default async function removeCoupon(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/carts/:cartId/coupons/:code',
    schema: {
      description: 'Remove an applied coupon from the cart',
      params: cartCouponParamsSchema,
      response: {
        200: cartResponseDtoSchema,
      },
      tags: ['cart'],
    },
    handler: async (req, res) => {
      const cart = await fastify.commandBus.execute(
        removeCouponCommand({ cartId: req.params.cartId, code: req.params.code }),
      );
      return res.status(200).send(fastify.diContainer.cradle.cartMapper.toResponse(cart));
    },
  });
}

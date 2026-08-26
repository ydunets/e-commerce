import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { cartActionCreator } from '#src/modules/cart/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type RemoveCouponResult = CartEntity;

export const removeCouponCommand = cartActionCreator<
  { cartId: string; code: string },
  RemoveCouponResult
>('remove-coupon');

export default function makeRemoveCoupon({ commandBus, cartRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof removeCouponCommand>): Promise<RemoveCouponResult> {
      const cart = await cartRepository.findOneById(payload.cartId);
      if (!cart) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }

      const removed = await cartRepository.removeCoupon(payload.cartId, payload.code);
      if (!removed) {
        throw new NotFoundException(`Coupon ${payload.code} not applied to cart ${payload.cartId}`);
      }

      return { ...cart, coupons: cart.coupons.filter((coupon) => coupon.code !== payload.code) };
    },
    init() {
      commandBus.register(removeCouponCommand.type, this.handler);
    },
  };
}

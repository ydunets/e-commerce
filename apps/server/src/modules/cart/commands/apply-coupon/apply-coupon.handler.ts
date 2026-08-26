import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { cartActionCreator } from '#src/modules/cart/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type ApplyCouponResult = CartEntity;

export const applyCouponCommand = cartActionCreator<
  { cartId: string; code: string },
  ApplyCouponResult
>('apply-coupon');

export default function makeApplyCoupon({ commandBus, cartRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof applyCouponCommand>): Promise<ApplyCouponResult> {
      const cart = await cartRepository.findOneById(payload.cartId);
      if (!cart) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }

      const coupon = await cartRepository.findCouponByCode(payload.code);
      if (!coupon) {
        throw new NotFoundException(`Coupon ${payload.code} not found`);
      }

      await cartRepository.applyCoupon(payload.cartId, payload.code);
      const alreadyApplied = cart.coupons.some((applied) => applied.code === coupon.code);
      return { ...cart, coupons: alreadyApplied ? cart.coupons : [...cart.coupons, coupon] };
    },
    init() {
      commandBus.register(applyCouponCommand.type, this.handler);
    },
  };
}

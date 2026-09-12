import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '#src/modules/cart/database/cart.repository.port';
import { NotFoundException } from '#src/shared/exceptions/index';
import { ApplyCouponCommand, type ApplyCouponResult } from './apply-coupon.command.js';

@CommandHandler(ApplyCouponCommand)
export class ApplyCouponHandler implements ICommandHandler<ApplyCouponCommand> {
  constructor(@Inject(CART_REPOSITORY) private readonly repository: CartRepository) {}
  async execute({ payload }: ApplyCouponCommand): Promise<ApplyCouponResult> {
    const cart = await this.repository.findOneById(payload.cartId);
    if (!cart) {
      throw new NotFoundException(`Cart ${payload.cartId} not found`);
    }

    const coupon = await this.repository.findCouponByCode(payload.code);
    if (!coupon) {
      throw new NotFoundException(`Coupon ${payload.code} not found`);
    }

    await this.repository.applyCoupon(payload.cartId, payload.code);
    const alreadyApplied = cart.coupons.some((applied) => applied.code === coupon.code);
    return { ...cart, coupons: alreadyApplied ? cart.coupons : [...cart.coupons, coupon] };
  }
}

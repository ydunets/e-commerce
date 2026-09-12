import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '#src/modules/cart/database/cart.repository.port';
import { NotFoundException } from '#src/shared/exceptions/index';
import { RemoveCouponCommand, type RemoveCouponResult } from './remove-coupon.command.js';

@CommandHandler(RemoveCouponCommand)
export class RemoveCouponHandler implements ICommandHandler<RemoveCouponCommand> {
  constructor(@Inject(CART_REPOSITORY) private readonly repository: CartRepository) {}
  async execute({ payload }: RemoveCouponCommand): Promise<RemoveCouponResult> {
    const cart = await this.repository.findOneById(payload.cartId);
    if (!cart) {
      throw new NotFoundException(`Cart ${payload.cartId} not found`);
    }

    const removed = await this.repository.removeCoupon(payload.cartId, payload.code);
    if (!removed) {
      throw new NotFoundException(`Coupon ${payload.code} not applied to cart ${payload.cartId}`);
    }

    return { ...cart, coupons: cart.coupons.filter((coupon) => coupon.code !== payload.code) };
  }
}

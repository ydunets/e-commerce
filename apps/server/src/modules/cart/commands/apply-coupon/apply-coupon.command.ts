import { Command } from '@nestjs/cqrs';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type ApplyCouponResult = CartEntity;

export class ApplyCouponCommand extends Command<ApplyCouponResult> {
  static readonly type = 'cart/apply-coupon';
  readonly type = ApplyCouponCommand.type;
  constructor(
    readonly payload: { cartId: string; code: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

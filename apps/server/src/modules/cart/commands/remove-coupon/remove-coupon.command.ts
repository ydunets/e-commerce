import { Command } from '@nestjs/cqrs';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type RemoveCouponResult = CartEntity;

export class RemoveCouponCommand extends Command<RemoveCouponResult> {
  static readonly type = 'cart/remove-coupon';
  readonly type = RemoveCouponCommand.type;
  constructor(
    readonly payload: { cartId: string; code: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

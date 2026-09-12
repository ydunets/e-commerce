import { Query } from '@nestjs/cqrs';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type GetCartResult = CartEntity;

export class GetCartQuery extends Query<GetCartResult> {
  static readonly type = 'cart/get-cart';
  readonly type = GetCartQuery.type;
  constructor(
    readonly payload: { cartId: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

import { Command } from '@nestjs/cqrs';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type RemoveItemResult = CartEntity;

export class RemoveItemCommand extends Command<RemoveItemResult> {
  static readonly type = 'cart/remove-item';
  readonly type = RemoveItemCommand.type;
  constructor(
    readonly payload: { cartId: string; sku: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

import { Command } from '@nestjs/cqrs';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type AddItemResult = CartEntity;

export class AddItemCommand extends Command<AddItemResult> {
  static readonly type = 'cart/add-item';
  readonly type = AddItemCommand.type;
  constructor(
    readonly payload: { cartId?: string; sku: string; quantity: number },
    readonly meta?: Meta,
  ) {
    super();
  }
}

import { Command } from '@nestjs/cqrs';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type UpdateItemResult = CartEntity;

export class UpdateItemCommand extends Command<UpdateItemResult> {
  static readonly type = 'cart/update-item';
  readonly type = UpdateItemCommand.type;
  constructor(
    readonly payload: { cartId: string; sku: string; quantity: number },
    readonly meta?: Meta,
  ) {
    super();
  }
}

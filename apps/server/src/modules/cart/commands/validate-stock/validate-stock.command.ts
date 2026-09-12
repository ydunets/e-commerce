import { Command } from '@nestjs/cqrs';
import type { CartEntity, StockChange } from '#src/modules/cart/domain/cart.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export interface ValidateStockResult {
  cart: CartEntity;
  changes: StockChange[];
}

export class ValidateStockCommand extends Command<ValidateStockResult> {
  static readonly type = 'cart/validate-stock';
  readonly type = ValidateStockCommand.type;
  constructor(
    readonly payload: { cartId: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

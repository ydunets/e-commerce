import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '#src/modules/cart/database/cart.repository.port';
import { reconcileCartStock } from '#src/modules/cart/domain/cart.stock';
import { NotFoundException } from '#src/shared/exceptions/index';
import { ValidateStockCommand, type ValidateStockResult } from './validate-stock.command.js';

@CommandHandler(ValidateStockCommand)
export class ValidateStockHandler implements ICommandHandler<ValidateStockCommand> {
  constructor(@Inject(CART_REPOSITORY) private readonly repository: CartRepository) {}
  async execute({ payload }: ValidateStockCommand): Promise<ValidateStockResult> {
    const cart = await this.repository.findOneById(payload.cartId);
    if (!cart) {
      throw new NotFoundException(`Cart ${payload.cartId} not found`);
    }

    // ponytail: read-then-write reconciliation; lock the inventory rows if
    // a stock change between the read and the clamp ever matters.
    const changes = reconcileCartStock(cart.lines);
    if (changes.length === 0) {
      return { cart, changes };
    }

    await this.repository.applyStockChanges(payload.cartId, changes);
    const corrected = await this.repository.findOneById(payload.cartId);
    if (!corrected) {
      throw new NotFoundException(`Cart ${payload.cartId} not found`);
    }
    return { cart: corrected, changes };
  }
}

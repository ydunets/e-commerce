import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '#src/modules/cart/database/cart.repository.port';
import { NotFoundException } from '#src/shared/exceptions/index';
import { RemoveItemCommand, type RemoveItemResult } from './remove-item.command.js';

@CommandHandler(RemoveItemCommand)
export class RemoveItemHandler implements ICommandHandler<RemoveItemCommand> {
  constructor(@Inject(CART_REPOSITORY) private readonly repository: CartRepository) {}
  async execute({ payload }: RemoveItemCommand): Promise<RemoveItemResult> {
    const cart = await this.repository.findOneById(payload.cartId);
    if (!cart) {
      throw new NotFoundException(`Cart ${payload.cartId} not found`);
    }

    const removed = await this.repository.deleteLine(payload.cartId, payload.sku);
    if (!removed) {
      throw new NotFoundException(`Cart line ${payload.sku} not found`);
    }

    // Removing the last line leaves an empty cart; the cart row survives.
    return { ...cart, lines: cart.lines.filter((line) => line.sku !== payload.sku) };
  }
}

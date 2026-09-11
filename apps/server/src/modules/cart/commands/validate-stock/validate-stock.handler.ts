import { reconcileCartStock } from '#src/modules/cart/domain/cart.stock';
import type { CartEntity, StockChange } from '#src/modules/cart/domain/cart.types';
import { cartActionCreator } from '#src/modules/cart/index';
import type { HandlerAction } from '#src/shared/cqrs/bus.types';
import { NotFoundException } from '#src/shared/exceptions/index';

export interface ValidateStockResult {
  cart: CartEntity;
  changes: StockChange[];
}

export const validateStockCommand = cartActionCreator<{ cartId: string }, ValidateStockResult>(
  'validate-stock',
);

export default function makeValidateStock({ commandBus, cartRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof validateStockCommand>): Promise<ValidateStockResult> {
      const cart = await cartRepository.findOneById(payload.cartId);
      if (!cart) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }

      // ponytail: read-then-write reconciliation; lock the inventory rows if
      // a stock change between the read and the clamp ever matters.
      const changes = reconcileCartStock(cart.lines);
      if (changes.length === 0) {
        return { cart, changes };
      }

      await cartRepository.applyStockChanges(payload.cartId, changes);
      const corrected = await cartRepository.findOneById(payload.cartId);
      if (!corrected) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }
      return { cart: corrected, changes };
    },
    init() {
      commandBus.register(validateStockCommand.type, this.handler);
    },
  };
}

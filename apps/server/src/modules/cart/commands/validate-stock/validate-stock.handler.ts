import { reconcileCartStock } from '#src/modules/cart/domain/cart.stock.ts';
import type { CartEntity, StockChange } from '#src/modules/cart/domain/cart.types.ts';
import { cartActionCreator } from '#src/modules/cart/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

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
      const clamped = new Map(changes.map((change) => [change.sku, change.quantity]));
      return {
        cart: {
          ...cart,
          lines: cart.lines
            .map((line) => {
              const quantity = clamped.get(line.sku);
              return quantity === undefined ? line : { ...line, quantity };
            })
            .filter((line) => line.quantity > 0),
        },
        changes,
      };
    },
    init() {
      commandBus.register(validateStockCommand.type, this.handler);
    },
  };
}

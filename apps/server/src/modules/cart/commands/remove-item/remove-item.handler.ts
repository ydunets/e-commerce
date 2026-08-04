import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { cartActionCreator } from '#src/modules/cart/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type RemoveItemResult = CartEntity;

export const removeItemCommand = cartActionCreator<
  { cartId: string; sku: string },
  RemoveItemResult
>('remove-item');

export default function makeRemoveItem({ commandBus, cartRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof removeItemCommand>): Promise<RemoveItemResult> {
      const cart = await cartRepository.findOneById(payload.cartId);
      if (!cart) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }

      const removed = await cartRepository.deleteLine(payload.cartId, payload.sku);
      if (!removed) {
        throw new NotFoundException(`Cart line ${payload.sku} not found`);
      }

      // Removing the last line leaves an empty cart; the cart row survives.
      return { ...cart, lines: cart.lines.filter((line) => line.sku !== payload.sku) };
    },
    init() {
      commandBus.register(removeItemCommand.type, this.handler);
    },
  };
}

import { createCart } from '#src/modules/cart/domain/cart.factory.ts';
import { assertWithinStock } from '#src/modules/cart/domain/cart.stock.ts';
import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { cartActionCreator } from '#src/modules/cart/index.ts';
import { getInventoryStockQuery } from '#src/modules/product/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type AddItemResult = CartEntity;

export const addItemCommand = cartActionCreator<
  { cartId?: string; sku: string; quantity: number },
  AddItemResult
>('add-item');

export default function makeAddItem({ commandBus, queryBus, cartRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof addItemCommand>): Promise<AddItemResult> {
      const stockLevel = await queryBus.execute(getInventoryStockQuery({ sku: payload.sku }));
      if (!stockLevel) {
        throw new NotFoundException(`Inventory item ${payload.sku} not found`);
      }

      let existingCart: CartEntity | undefined;
      if (payload.cartId !== undefined) {
        existingCart = await cartRepository.findOneById(payload.cartId);
        if (!existingCart) {
          throw new NotFoundException(`Cart ${payload.cartId} not found`);
        }
      }

      const existingLine = existingCart?.lines.find((line) => line.sku === payload.sku);
      const quantity = (existingLine?.quantity ?? 0) + payload.quantity;
      // ponytail: read-then-write stock check; lock the inventory row if
      // concurrent adds to one cart ever matter.
      assertWithinStock(payload.sku, quantity, stockLevel.stock);

      // The implicit mint happens only after all checks pass, so a rejected
      // first add never leaves an orphan empty cart behind (ADR 0002).
      const cart = existingCart ?? createCart();
      if (!existingCart) {
        await cartRepository.insert(cart);
      }

      await cartRepository.upsertLine(cart.id, payload.sku, quantity);

      // Re-read instead of patching in memory: a freshly added line needs the
      // read model's joined product data, which only the repository has.
      const persisted = await cartRepository.findOneById(cart.id);
      if (!persisted) {
        throw new NotFoundException(`Cart ${cart.id} not found`);
      }
      return persisted;
    },
    init() {
      commandBus.register(addItemCommand.type, this.handler);
    },
  };
}

import { createCart } from '#src/modules/cart/domain/cart.factory.ts';
import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { cartActionCreator } from '#src/modules/cart/index.ts';
import { getInventoryStockQuery } from '#src/modules/product/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { ConflictException, NotFoundException } from '#src/shared/exceptions/index.ts';

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
      if (quantity > stockLevel.stock) {
        throw new ConflictException(
          `Requested quantity ${quantity} of ${payload.sku} exceeds the available stock of ${stockLevel.stock}`,
        );
      }

      // The implicit mint happens only after all checks pass, so a rejected
      // first add never leaves an orphan empty cart behind (ADR 0002).
      const cart = existingCart ?? createCart();
      if (!existingCart) {
        await cartRepository.insert(cart);
      }

      await cartRepository.upsertLine(cart.id, payload.sku, quantity);
      const lines = existingLine
        ? cart.lines.map((line) => (line.sku === payload.sku ? { ...line, quantity } : line))
        : [...cart.lines, { sku: payload.sku, quantity }];
      return { ...cart, lines };
    },
    init() {
      commandBus.register(addItemCommand.type, this.handler);
    },
  };
}

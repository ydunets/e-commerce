import { assertWithinStock } from '#src/modules/cart/domain/cart.stock';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import { cartActionCreator } from '#src/modules/cart/index';
import { getInventoryStockQuery } from '#src/modules/product/index';
import type { HandlerAction } from '#src/shared/cqrs/bus.types';
import { NotFoundException } from '#src/shared/exceptions/index';

export type UpdateItemResult = CartEntity;

export const updateItemCommand = cartActionCreator<
  { cartId: string; sku: string; quantity: number },
  UpdateItemResult
>('update-item');

export default function makeUpdateItem({ commandBus, queryBus, cartRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof updateItemCommand>): Promise<UpdateItemResult> {
      const cart = await cartRepository.findOneById(payload.cartId);
      if (!cart) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }
      if (!cart.lines.some((line) => line.sku === payload.sku)) {
        throw new NotFoundException(`Cart line ${payload.sku} not found`);
      }

      const stockLevel = await queryBus.execute(getInventoryStockQuery({ sku: payload.sku }));
      if (!stockLevel) {
        throw new NotFoundException(`Inventory item ${payload.sku} not found`);
      }
      assertWithinStock(payload.sku, payload.quantity, stockLevel.stock);

      await cartRepository.upsertLine(payload.cartId, payload.sku, payload.quantity);
      return {
        ...cart,
        lines: cart.lines.map((line) =>
          line.sku === payload.sku
            ? { ...line, quantity: payload.quantity, stock: stockLevel.stock }
            : line,
        ),
      };
    },
    init() {
      commandBus.register(updateItemCommand.type, this.handler);
    },
  };
}

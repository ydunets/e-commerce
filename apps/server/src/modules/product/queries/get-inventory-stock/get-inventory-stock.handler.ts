import type { InventoryStockLevel } from '#src/modules/product/domain/product.types.ts';
import { productActionCreator } from '#src/modules/product/product.action-creator.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export type GetInventoryStockResult = InventoryStockLevel | undefined;

// Bus-only query (no route): lets other modules read a SKU's stock level
// without importing product internals.
export const getInventoryStockQuery = productActionCreator<
  { sku: string },
  GetInventoryStockResult
>('get-inventory-stock');

export default function makeGetInventoryStockQuery({ queryBus, productRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof getInventoryStockQuery>): Promise<GetInventoryStockResult> {
      return productRepository.findStockBySku(payload.sku);
    },
    init() {
      queryBus.register(getInventoryStockQuery.type, this.handler);
    },
  };
}

import {
  GetInventoryStockQuery,
  type GetInventoryStockResult,
  getInventoryStockQuery,
} from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.query';
import type { QueryBus } from '#src/shared/cqrs/bus.types';

// The cart port removes this registration and uses the normal Nest dispatcher.
export function connectInventoryQuery(
  legacy: Pick<QueryBus, 'register'>,
  nest: { execute(query: GetInventoryStockQuery): Promise<GetInventoryStockResult> },
): void {
  legacy.register<{ sku: string }>(getInventoryStockQuery.type, (action) =>
    nest.execute(new GetInventoryStockQuery(action.payload, action.meta)),
  );
}

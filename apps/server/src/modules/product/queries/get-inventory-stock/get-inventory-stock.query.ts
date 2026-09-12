import { Query } from '@nestjs/cqrs';
import type { InventoryStockLevel } from '#src/modules/product/domain/product.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type GetInventoryStockResult = InventoryStockLevel | undefined;
export class GetInventoryStockQuery extends Query<GetInventoryStockResult> {
  static readonly type = 'product/get-inventory-stock';
  readonly type = GetInventoryStockQuery.type;
  constructor(
    readonly payload: { sku: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

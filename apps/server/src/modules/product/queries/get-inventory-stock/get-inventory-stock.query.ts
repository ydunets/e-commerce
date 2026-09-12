import { Query } from '@nestjs/cqrs';
import type { InventoryStockLevel } from '#src/modules/product/domain/product.types';
import { productActionCreator } from '#src/modules/product/product.action-creator';
import type { Meta } from '#src/shared/cqrs/bus.types';

export type GetInventoryStockResult = InventoryStockLevel | undefined;
// Retained until the cart migration removes the last legacy stock caller.
export const getInventoryStockQuery = productActionCreator<
  { sku: string },
  GetInventoryStockResult
>('get-inventory-stock');

export class GetInventoryStockQuery extends Query<GetInventoryStockResult> {
  static readonly type = getInventoryStockQuery.type;
  readonly type = GetInventoryStockQuery.type;
  constructor(
    readonly payload: { sku: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

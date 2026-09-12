import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '#src/modules/product/database/product.repository.port';
import { GetInventoryStockQuery } from './get-inventory-stock.query.js';

@QueryHandler(GetInventoryStockQuery)
export class GetInventoryStockHandler implements IQueryHandler<GetInventoryStockQuery> {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository) {}
  execute(query: GetInventoryStockQuery) {
    return this.repository.findStockBySku(query.payload.sku);
  }
}

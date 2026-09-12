import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '#src/modules/product/database/product.repository.port';
import { ListProductsQuery } from './list-products.query.js';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository) {}
  execute(query: ListProductsQuery) {
    return this.repository.findMany(query.payload);
  }
}

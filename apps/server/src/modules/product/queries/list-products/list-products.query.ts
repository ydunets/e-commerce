import { Query } from '@nestjs/cqrs';
import type { FindManyProductsOptions } from '#src/modules/product/database/product.repository.port';
import type { ProductListItem } from '#src/modules/product/domain/product.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export class ListProductsQuery extends Query<ProductListItem[]> {
  static readonly type = 'product/list';
  readonly type = ListProductsQuery.type;
  constructor(
    readonly payload: FindManyProductsOptions,
    readonly meta?: Meta,
  ) {
    super();
  }
}

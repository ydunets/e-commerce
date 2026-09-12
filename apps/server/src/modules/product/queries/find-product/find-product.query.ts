import { Query } from '@nestjs/cqrs';
import type { ProductEntity } from '#src/modules/product/domain/product.types';
import type { Meta } from '#src/shared/cqrs/bus.types';

export class FindProductQuery extends Query<ProductEntity> {
  static readonly type = 'product/find-one-by-id';
  readonly type = FindProductQuery.type;
  constructor(
    readonly payload: { id: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

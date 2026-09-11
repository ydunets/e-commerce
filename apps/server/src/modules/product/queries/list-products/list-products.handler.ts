import type { FindManyProductsOptions } from '#src/modules/product/database/product.repository.port';
import type { ProductListItem } from '#src/modules/product/domain/product.types';
import { productActionCreator } from '#src/modules/product/product.action-creator';
import type { HandlerAction } from '#src/shared/cqrs/bus.types';

export type ListProductsResult = ProductListItem[];

export const listProductsQuery = productActionCreator<FindManyProductsOptions, ListProductsResult>(
  'list',
);

export default function makeListProductsQuery({ queryBus, productRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof listProductsQuery>): Promise<ListProductsResult> {
      return productRepository.findMany(payload);
    },
    init() {
      queryBus.register(listProductsQuery.type, this.handler);
    },
  };
}

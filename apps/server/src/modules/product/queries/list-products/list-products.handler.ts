import type { FindManyProductsOptions } from '#src/modules/product/database/product.repository.port.ts';
import type { ProductListItem } from '#src/modules/product/domain/product.types.ts';
import { productActionCreator } from '#src/modules/product/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

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

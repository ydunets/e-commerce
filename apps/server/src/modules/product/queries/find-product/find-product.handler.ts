import type { ProductEntity } from '#src/modules/product/domain/product.types.ts';
import { productActionCreator } from '#src/modules/product/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type FindProductResult = ProductEntity;

export const findProductQuery = productActionCreator<{ id: string }, FindProductResult>(
  'find-one-by-id',
);

export default function makeFindProductQuery({ queryBus, productRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof findProductQuery>): Promise<FindProductResult> {
      const product = await productRepository.findOneById(payload.id);
      if (!product) {
        throw new NotFoundException(`Product ${payload.id} not found`);
      }
      return product;
    },
    init() {
      queryBus.register(findProductQuery.type, this.handler);
    },
  };
}

import type { ProductEntity } from '#src/modules/product/domain/product.types.ts';
import { productActionCreator } from '#src/modules/product/index.ts';
import { getReviewSummaryQuery } from '#src/modules/review/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type FindProductResult = ProductEntity;

export const findProductQuery = productActionCreator<{ id: string }, FindProductResult>(
  'find-one-by-id',
);

export default function makeFindProductQuery({ queryBus, productRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof findProductQuery>): Promise<FindProductResult> {
      const [product, summary] = await Promise.all([
        productRepository.findOneById(payload.id),
        queryBus.execute(getReviewSummaryQuery({ productId: payload.id })),
      ]);
      if (!product) {
        throw new NotFoundException(`Product ${payload.id} not found`);
      }
      return { ...product, reviews: { count: summary.total, average: summary.average } };
    },
    init() {
      queryBus.register(findProductQuery.type, this.handler);
    },
  };
}

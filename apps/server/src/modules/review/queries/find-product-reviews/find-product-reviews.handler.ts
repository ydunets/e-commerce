import type { ReviewFilters } from '#src/modules/review/database/review.repository.port.ts';
import type { ReviewEntity } from '#src/modules/review/domain/review.types.ts';
import { reviewActionCreator } from '#src/modules/review/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';
import { paginatedQueryBase } from '#src/shared/ddd/query.base.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type FindProductReviewsResult = Paginated<ReviewEntity>;

export const findProductReviewsQuery = reviewActionCreator<
  { productId: string } & Partial<PaginatedQueryParams> & ReviewFilters,
  FindProductReviewsResult
>('find-all-paginated-by-product');

export default function makeFindProductReviewsQuery({ queryBus, reviewRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof findProductReviewsQuery>): Promise<FindProductReviewsResult> {
      if (!(await reviewRepository.productExists(payload.productId))) {
        throw new NotFoundException(`Product ${payload.productId} not found`);
      }
      const query = paginatedQueryBase(payload);
      return reviewRepository.findAllPaginatedByProduct(payload.productId, query, {
        rating: payload.rating,
      });
    },
    init() {
      queryBus.register(findProductReviewsQuery.type, this.handler);
    },
  };
}

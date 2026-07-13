import type { ReviewFilters } from '#src/modules/review/database/review.repository.port.ts';
import type { ReviewEntity } from '#src/modules/review/domain/review.types.ts';
import { ensureProductExists } from '#src/modules/review/queries/ensure-product-exists.ts';
import { reviewActionCreator } from '#src/modules/review/review.action-creator.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';
import { paginatedQueryBase } from '#src/shared/ddd/query.base.ts';

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
      await ensureProductExists(reviewRepository, payload.productId);
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

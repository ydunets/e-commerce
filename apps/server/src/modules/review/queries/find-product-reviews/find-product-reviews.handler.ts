import type { ReviewFilters } from '#src/modules/review/database/review.repository.port';
import type { ReviewEntity } from '#src/modules/review/domain/review.types';
import { ensureProductExists } from '#src/modules/review/queries/ensure-product-exists';
import { reviewActionCreator } from '#src/modules/review/review.action-creator';
import type { HandlerAction } from '#src/shared/cqrs/bus.types';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port';
import { paginatedQueryBase } from '#src/shared/ddd/query.base';

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

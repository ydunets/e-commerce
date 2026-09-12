import { Query } from '@nestjs/cqrs';
import type { ReviewFilters } from '#src/modules/review/database/review.repository.port';
import type { ReviewEntity } from '#src/modules/review/domain/review.types';
import type { Meta } from '#src/shared/cqrs/action.types';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port';

export type FindProductReviewsResult = Paginated<ReviewEntity>;

export class FindProductReviewsQuery extends Query<FindProductReviewsResult> {
  static readonly type = 'review/find-all-paginated-by-product';
  readonly type = FindProductReviewsQuery.type;

  constructor(
    readonly payload: { productId: string } & Partial<PaginatedQueryParams> & ReviewFilters,
    readonly meta?: Meta,
  ) {
    super();
  }
}

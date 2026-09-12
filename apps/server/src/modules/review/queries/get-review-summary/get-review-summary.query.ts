import { Query } from '@nestjs/cqrs';
import type { ReviewSummary } from '#src/modules/review/domain/review.types';
import type { Meta } from '#src/shared/cqrs/bus.types';

export type GetReviewSummaryResult = ReviewSummary;

export class GetReviewSummaryQuery extends Query<GetReviewSummaryResult> {
  static readonly type = 'review/get-summary';
  readonly type = GetReviewSummaryQuery.type;
  constructor(
    readonly payload: { productId: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

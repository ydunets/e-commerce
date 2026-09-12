import { Query } from '@nestjs/cqrs';
import type { ReviewSummary } from '#src/modules/review/domain/review.types';
import { reviewActionCreator } from '#src/modules/review/review.action-creator';
import type { Meta } from '#src/shared/cqrs/bus.types';

export type GetReviewSummaryResult = ReviewSummary;

// Retained until the review migration removes its legacy callers and handler.
export const getReviewSummaryQuery = reviewActionCreator<
  { productId: string },
  GetReviewSummaryResult
>('get-summary');

export class GetReviewSummaryQuery extends Query<GetReviewSummaryResult> {
  static readonly type = getReviewSummaryQuery.type;
  readonly type = GetReviewSummaryQuery.type;
  constructor(
    readonly payload: { productId: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

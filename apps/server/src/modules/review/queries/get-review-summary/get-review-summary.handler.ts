import type { ReviewSummary } from '#src/modules/review/domain/review.types.ts';
import { ensureProductExists } from '#src/modules/review/queries/ensure-product-exists.ts';
import { reviewActionCreator } from '#src/modules/review/review.action-creator.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export type GetReviewSummaryResult = ReviewSummary;

export const getReviewSummaryQuery = reviewActionCreator<
  { productId: string },
  GetReviewSummaryResult
>('get-summary');

export default function makeGetReviewSummaryQuery({ queryBus, reviewRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof getReviewSummaryQuery>): Promise<GetReviewSummaryResult> {
      await ensureProductExists(reviewRepository, payload.productId);
      return reviewRepository.getSummary(payload.productId);
    },
    init() {
      queryBus.register(getReviewSummaryQuery.type, this.handler);
    },
  };
}

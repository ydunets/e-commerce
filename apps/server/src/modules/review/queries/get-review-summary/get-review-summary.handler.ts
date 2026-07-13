import type { ReviewSummary } from '#src/modules/review/domain/review.types.ts';
import { reviewActionCreator } from '#src/modules/review/review.action-creator.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

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
      if (!(await reviewRepository.productExists(payload.productId))) {
        throw new NotFoundException(`Product ${payload.productId} not found`);
      }
      return reviewRepository.getSummary(payload.productId);
    },
    init() {
      queryBus.register(getReviewSummaryQuery.type, this.handler);
    },
  };
}

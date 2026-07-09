import type { ReviewRepository } from '#src/modules/review/database/review.repository.port.ts';
import type { ReviewMapper } from '#src/modules/review/review.mapper.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

declare global {
  export interface Dependencies {
    reviewMapper: ReviewMapper;
    reviewRepository: ReviewRepository;
  }
}

export const reviewActionCreator = actionCreatorFactory('review');

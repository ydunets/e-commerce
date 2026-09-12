import { Module } from '@nestjs/common';
import { SharedModule } from '#src/shared/nest/shared.module';
import { PostgresReviewRepository } from './database/review.repository.js';
import { REVIEW_REPOSITORY } from './database/review.repository.port.js';
import { FindProductReviewsHandler } from './queries/find-product-reviews/find-product-reviews.handler.js';
import { GetReviewSummaryHandler } from './queries/get-review-summary/get-review-summary.handler.js';
import { ReviewController } from './review.controller.js';

@Module({
  imports: [SharedModule],
  controllers: [ReviewController],
  providers: [
    FindProductReviewsHandler,
    GetReviewSummaryHandler,
    { provide: REVIEW_REPOSITORY, useClass: PostgresReviewRepository },
  ],
})
export class ReviewModule {}

import { type ReviewsPageResponseDto, reviewsPageResponseDtoSchema } from '@e-commerce/contracts';
import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiContract } from '#src/shared/nest/api-contract';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { reviewSummaryResponseDtoSchema } from './dtos/review-summary.response.dto.js';
import { FindProductReviewsQuery } from './queries/find-product-reviews/find-product-reviews.query.js';
import {
  type FindProductReviewsQuerystring,
  findProductReviewsParamsSchema,
  findProductReviewsQuerySchema,
} from './queries/find-product-reviews/find-product-reviews.schema.js';
import { GetReviewSummaryQuery } from './queries/get-review-summary/get-review-summary.query.js';
import {
  getReviewSummaryParamsSchema,
  type ReviewParams,
} from './queries/get-review-summary/get-review-summary.schema.js';
import { toReviewResponse } from './review.mapper.js';

@Controller('api/v1/products/:productId/reviews')
export class ReviewController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Get()
  @ApiOperation({
    description: 'Find reviews for a product (paginated, optionally filtered by rating)',
    tags: ['reviews'],
  })
  @ApiContract({
    response: reviewsPageResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  async list(
    @Param({ schema: findProductReviewsParamsSchema }) params: ReviewParams,
    @Query({ schema: findProductReviewsQuerySchema }) query: FindProductReviewsQuerystring,
  ): Promise<ReviewsPageResponseDto> {
    const result = await this.dispatcher.query(
      new FindProductReviewsQuery({ ...query, productId: params.productId }),
    );
    return { ...result, data: result.data.map(toReviewResponse) };
  }

  @Get('summary')
  @ApiOperation({
    description: 'Get the rating summary (average + distribution) for a product',
    tags: ['reviews'],
  })
  @ApiContract({
    response: reviewSummaryResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  summary(@Param({ schema: getReviewSummaryParamsSchema }) params: ReviewParams) {
    return this.dispatcher.query(new GetReviewSummaryQuery(params));
  }
}

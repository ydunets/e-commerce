import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { After, Given, Then, When } from '@cucumber/cucumber';
import type {
  ProductListItemDto,
  ReviewResponseDto,
  ReviewsPageResponseDto,
} from '@e-commerce/contracts';
import type { ReviewSummaryResponseDto } from '#src/modules/review/dtos/review-summary.response.dto';
import { assertKeys, assertText, getJson, PRODUCTS_URL, STATUS_OK } from '../shared/http.js';
import type { ICustomWorld } from '../support/custom-world.js';

const MAX_PAGE_SIZE = 100;
const MINIMUM_REVIEW_COUNT = 4;
const RATINGS = [1, 2, 3, 4, 5] as const;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OWNED_PRODUCT_PREFIX = 'char-review-';

interface ReviewContext {
  reviewsUrl: string;
  reviews: ReviewResponseDto[];
  selectedRating: number;
  ownedProductId?: string;
}

function reviewContext(world: ICustomWorld): ReviewContext {
  return world.context as unknown as ReviewContext;
}

Given('an isolated product without reviews', async function (this: ICustomWorld) {
  const productId = `${OWNED_PRODUCT_PREFIX}${randomUUID()}`;
  reviewContext(this).ownedProductId = productId;
  const rows = await this.db`
    INSERT INTO products (product_id, name, description, category, collection)
    SELECT ${productId}, name, description, category, collection FROM products
    ORDER BY product_id LIMIT 1
    RETURNING product_id
  `;
  assert.equal(rows.length, 1);
  Object.assign(reviewContext(this), {
    reviewsUrl: `${PRODUCTS_URL}/${productId}/reviews`,
    reviews: [],
  });
});

After({ tags: '@review' }, async function (this: ICustomWorld) {
  const productId = reviewContext(this).ownedProductId;
  if (!productId) return;
  assert.ok(productId.startsWith(OWNED_PRODUCT_PREFIX));
  await this.db`DELETE FROM products WHERE product_id = ${productId}`;
});

Then(
  'the review page uses limit {int} and page {float} starting at offset {int}',
  function (this: ICustomWorld, limit: number, page: number, offset: number) {
    assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
    assert.deepEqual(this.context.latestResponse!.json(), {
      count: reviewContext(this).reviews.length,
      page,
      limit,
      data: reviewContext(this).reviews.slice(offset, offset + limit),
    });
  },
);

Given(
  'a seeded product with several reviews of different ratings',
  async function (this: ICustomWorld) {
    const products = await getJson<ProductListItemDto[]>(this, PRODUCTS_URL);
    for (const product of products) {
      const reviewsUrl = `${PRODUCTS_URL}/${product.product_id}/reviews`;
      const first = await getJson<ReviewsPageResponseDto>(
        this,
        `${reviewsUrl}?limit=${MAX_PAGE_SIZE}`,
      );
      if (first.count < MINIMUM_REVIEW_COUNT) continue;
      const reviews = [...first.data];
      for (let page = 1; page * MAX_PAGE_SIZE < first.count; page++) {
        const next = await getJson<ReviewsPageResponseDto>(
          this,
          `${reviewsUrl}?limit=${MAX_PAGE_SIZE}&page=${page}`,
        );
        reviews.push(...next.data);
      }
      assert.equal(reviews.length, first.count);
      assert.equal(new Set(reviews.map((review) => review.id)).size, first.count);
      if (new Set(reviews.map((review) => review.rating)).size < 2) continue;
      Object.assign(reviewContext(this), {
        reviewsUrl,
        reviews,
        selectedRating: reviews[0].rating,
      });
      return;
    }
    assert.fail(
      'seeded reviews must include a product with at least four reviews and different ratings',
    );
  },
);

When('I request reviews with query {string}', async function (this: ICustomWorld, query: string) {
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: `${reviewContext(this).reviewsUrl}?${query}`,
  });
});

Then(
  'the review page contains {int} reviews starting at offset {int}',
  function (this: ICustomWorld, limit: number, offset: number) {
    assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
    assert.deepEqual(this.context.latestResponse!.json(), {
      count: reviewContext(this).reviews.length,
      page: offset / limit,
      limit,
      data: reviewContext(this).reviews.slice(offset, offset + limit),
    });
  },
);

Then('review entries carry the public response fields', function (this: ICustomWorld) {
  const { data } = this.context.latestResponse!.json<ReviewsPageResponseDto>();
  assert.ok(data.length > 0);
  for (const review of data) {
    assertKeys(review, ['id', 'user_id', 'name', 'avatar_url', 'rating', 'content', 'created_at']);
    assert.ok(Number.isInteger(review.id));
    assertText(review.user_id);
    assertText(review.name);
    if (review.avatar_url !== null) assertText(review.avatar_url);
    assert.ok(Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5);
    assert.ok(review.content === null || typeof review.content === 'string');
    assert.match(review.created_at, DATE_ONLY_PATTERN);
  }
});

When('I request reviews for one recorded rating', async function (this: ICustomWorld) {
  const { reviewsUrl, selectedRating } = reviewContext(this);
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: `${reviewsUrl}?rating=${selectedRating}&limit=${MAX_PAGE_SIZE}&page=0`,
  });
});

Then('only the reviews with that rating are returned', function (this: ICustomWorld) {
  const { reviews, selectedRating } = reviewContext(this);
  const matching = reviews.filter((review) => review.rating === selectedRating);
  assert.ok(matching.length > 0 && matching.length < reviews.length);
  assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
  assert.deepEqual(this.context.latestResponse!.json(), {
    count: matching.length,
    page: 0,
    limit: MAX_PAGE_SIZE,
    data: matching.slice(0, MAX_PAGE_SIZE),
  });
});

When('I request the review summary', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: `${reviewContext(this).reviewsUrl}/summary`,
  });
});

Then(
  'the summary contains the total, average and all five rating counts',
  function (this: ICustomWorld) {
    assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
    const summary = this.context.latestResponse!.json<ReviewSummaryResponseDto>();
    const { reviews } = reviewContext(this);
    assertKeys(summary, ['total', 'average', 'distribution']);
    assertKeys(summary.distribution, RATINGS.map(String));
    assert.equal(summary.total, reviews.length);
    for (const rating of RATINGS) {
      assert.equal(
        summary.distribution[rating],
        reviews.filter((review) => review.rating === rating).length,
      );
    }
    const publishedRatingTotal = reviews.reduce((total, review) => total + review.rating, 0);
    assert.equal(summary.average, reviews.length === 0 ? 0 : publishedRatingTotal / reviews.length);
  },
);

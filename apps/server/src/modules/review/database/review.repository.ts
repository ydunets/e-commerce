import type {
  ReviewFilters,
  ReviewRepository,
} from '#src/modules/review/database/review.repository.port.ts';
import type { ReviewEntity, ReviewSummary } from '#src/modules/review/domain/review.types.ts';
import { joinConditions } from '#src/shared/db/postgres.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';

// Row shape as returned by json_agg (snake_case, timestamp serialized to string).
interface ReviewRow {
  id: number;
  product_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  content: string | null;
  created_at: string;
}

interface SummaryRow {
  total: number;
  average: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
}

export default function reviewRepository({ db }: Dependencies): ReviewRepository {
  return {
    async productExists(productId: string): Promise<boolean> {
      const [row]: [{ exists: boolean }?] =
        await db`SELECT EXISTS(SELECT 1 FROM products WHERE product_id = ${productId}) AS exists`;
      return row?.exists ?? false;
    },

    async findAllPaginatedByProduct(
      productId: string,
      params: PaginatedQueryParams,
      filters: ReviewFilters,
    ): Promise<Paginated<ReviewEntity>> {
      const conditions = [
        db`product_id = ${productId}`,
        filters.rating != null && db`rating = ${filters.rating}`,
      ];

      // LEFT JOIN + COALESCE keep the rows consistent with the count subquery
      // even if a review has no matching review_authors row (no FK by design).
      const [result]: [{ rows: ReviewRow[] | null; count: number }] = await db`
        SELECT
          (SELECT COUNT(*)::int FROM product_reviews ${joinConditions(conditions)}) AS count,
          (SELECT json_agg(t.*) FROM (
            SELECT
              r.id,
              r.product_id,
              r.user_id,
              COALESCE(a.name, r.user_id) AS name,
              a.avatar_url,
              r.rating,
              r.content,
              r.created_at
            FROM product_reviews r
            LEFT JOIN review_authors a ON a.user_id = r.user_id
            ${joinConditions(conditions)}
            ORDER BY r.created_at DESC, r.id DESC
            LIMIT ${params.limit} OFFSET ${params.offset}
          ) AS t) AS rows
      `;

      const rows = result.rows ?? [];
      return {
        data: rows.map((row) => ({
          id: row.id,
          productId: row.product_id,
          author: { userId: row.user_id, name: row.name, avatarUrl: row.avatar_url },
          rating: row.rating,
          content: row.content,
          createdAt: new Date(row.created_at),
        })),
        count: Number(result.count),
        limit: params.limit,
        page: params.page,
      };
    },

    async getSummary(productId: string): Promise<ReviewSummary> {
      const [row]: [SummaryRow] = await db`
        SELECT
          COUNT(*)::int AS total,
          COALESCE(AVG(rating), 0)::float AS average,
          COALESCE(SUM((rating = 5)::int), 0)::int AS r5,
          COALESCE(SUM((rating = 4)::int), 0)::int AS r4,
          COALESCE(SUM((rating = 3)::int), 0)::int AS r3,
          COALESCE(SUM((rating = 2)::int), 0)::int AS r2,
          COALESCE(SUM((rating = 1)::int), 0)::int AS r1
        FROM product_reviews WHERE product_id = ${productId}
      `;

      return {
        total: Number(row.total),
        average: Number(row.average),
        distribution: {
          5: Number(row.r5),
          4: Number(row.r4),
          3: Number(row.r3),
          2: Number(row.r2),
          1: Number(row.r1),
        },
      };
    },
  };
}

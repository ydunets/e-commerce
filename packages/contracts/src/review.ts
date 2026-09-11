import { z } from 'zod';

// Mirrors the GreatFrontend e-commerce reviews API shape (snake_case).
export const reviewResponseDtoSchema = z.object({
  id: z.int(),
  user_id: z.string().meta({ example: 'natali-craig' }),
  name: z.string().meta({ example: 'Natali Craig' }),
  avatar_url: z.union([z.string(), z.null()]),
  rating: z.int().min(1).max(5),
  content: z.union([z.string(), z.null()]),
  created_at: z.string().meta({ example: '2024-03-11' }),
});

export type ReviewResponseDto = z.infer<typeof reviewResponseDtoSchema>;

/** The paginated envelope `GET /products/:id/reviews` responds with. */
export interface ReviewsPageResponseDto {
  count: number;
  limit: number;
  page: number;
  data: ReviewResponseDto[];
}

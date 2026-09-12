import { z } from 'zod';

export const getReviewSummaryParamsSchema = z.object({
  productId: z.string().meta({
    example: 'autumnal-knitwear',
    description: 'Product identifier (slug)',
  }),
});

export type ReviewParams = z.infer<typeof getReviewSummaryParamsSchema>;

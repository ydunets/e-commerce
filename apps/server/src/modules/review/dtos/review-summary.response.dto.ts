import { z } from 'zod';

export const reviewSummaryResponseDtoSchema = z.object({
  total: z.int().meta({ example: 62, description: 'Total number of reviews' }),
  average: z.number().meta({ example: 4.1, description: 'Average rating (0 when no reviews)' }),
  distribution: z
    .object({
      '5': z.int().meta({ description: 'Number of 5-star (Excellent) reviews' }),
      '4': z.int().meta({ description: 'Number of 4-star (Good) reviews' }),
      '3': z.int().meta({ description: 'Number of 3-star (Average) reviews' }),
      '2': z.int().meta({ description: 'Number of 2-star (Below Average) reviews' }),
      '1': z.int().meta({ description: 'Number of 1-star (Poor) reviews' }),
    })
    .describe('Count of reviews per star rating'),
});

export type ReviewSummaryResponseDto = z.infer<typeof reviewSummaryResponseDtoSchema>;

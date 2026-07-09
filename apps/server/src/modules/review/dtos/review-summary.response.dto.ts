import { type Static, Type } from 'typebox';

export const reviewSummaryResponseDtoSchema = Type.Object({
  total: Type.Integer({ example: 62, description: 'Total number of reviews' }),
  average: Type.Number({ example: 4.1, description: 'Average rating (0 when no reviews)' }),
  distribution: Type.Object(
    {
      '5': Type.Integer({ description: 'Number of 5-star (Excellent) reviews' }),
      '4': Type.Integer({ description: 'Number of 4-star (Good) reviews' }),
      '3': Type.Integer({ description: 'Number of 3-star (Average) reviews' }),
      '2': Type.Integer({ description: 'Number of 2-star (Below Average) reviews' }),
      '1': Type.Integer({ description: 'Number of 1-star (Poor) reviews' }),
    },
    { description: 'Count of reviews per star rating' },
  ),
});

export type ReviewSummaryResponseDto = Static<typeof reviewSummaryResponseDtoSchema>;

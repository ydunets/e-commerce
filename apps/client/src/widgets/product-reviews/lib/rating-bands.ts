import type { RatingValue } from '@/entities/review';

export interface RatingBand {
  value: RatingValue;
  label: string;
}

export const RATING_BANDS: RatingBand[] = [
  { value: 5, label: 'Excellent' },
  { value: 4, label: 'Good' },
  { value: 3, label: 'Average' },
  { value: 2, label: 'Below Average' },
  { value: 1, label: 'Poor' },
];

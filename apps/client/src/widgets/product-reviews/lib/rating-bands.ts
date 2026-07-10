import type { RatingValue } from '@/entities/review';

export interface RatingBand {
  value: RatingValue;
  label: string;
  fillClass: string;
}

export const RATING_BANDS: RatingBand[] = [
  { value: 5, label: 'Excellent', fillClass: 'bg-green-600' },
  { value: 4, label: 'Good', fillClass: 'bg-green-500' },
  { value: 3, label: 'Average', fillClass: 'bg-yellow-300' },
  { value: 2, label: 'Below Average', fillClass: 'bg-yellow-500' },
  { value: 1, label: 'Poor', fillClass: 'bg-red-600' },
];

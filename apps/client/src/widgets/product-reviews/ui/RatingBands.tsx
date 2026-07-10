import type { RatingDistribution } from '@/entities/review';
import { cx } from '@/shared/lib/cx';
import { RATING_BANDS } from '../lib/rating-bands';

export type TRatingBandsProps = {
  distribution: RatingDistribution;
  total: number;
  activeRating: number | null;
  onSelect: (rating: number) => void;
};

export const RatingBands = ({
  distribution,
  total,
  activeRating,
  onSelect,
}: TRatingBandsProps) => (
  <ul className="flex flex-col gap-4 py-4">
    {RATING_BANDS.map((band) => {
      const percent =
        total > 0 ? Math.round((distribution[band.value] / total) * 100) : 0;
      const active = activeRating === band.value;
      return (
        <li key={band.value}>
          <button
            type="button"
            onClick={() => onSelect(band.value)}
            aria-pressed={active}
            className="group flex w-full cursor-pointer items-center gap-2 rounded-sm text-left focus-visible:focus-ring"
          >
            <span
              className={cx(
                'w-[120px] shrink-0 text-base font-medium transition-colors',
                active ? 'text-brand' : 'text-muted group-hover:text-ink',
              )}
            >
              {band.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
              <span
                className={cx('block h-full rounded-full', band.fillClass)}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="w-[42px] shrink-0 text-right text-base text-muted">
              {percent}%
            </span>
          </button>
        </li>
      );
    })}
  </ul>
);

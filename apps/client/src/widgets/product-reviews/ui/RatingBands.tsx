import * as stylex from '@stylexjs/stylex';
import type { RatingDistribution } from '@/entities/review';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import { RATING_BANDS } from '../lib/rating-bands';

export type TRatingBandsProps = {
  distribution: RatingDistribution;
  total: number;
  activeRating: number | null;
  onSelect: (rating: number) => void;
};

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingBlock: '1rem',
  },
  band: {
    display: 'flex',
    width: '100%',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '0.5rem',
    borderRadius: '0.25rem',
    textAlign: 'left',
  },
  label: {
    width: '120px',
    flexShrink: 0,
    fontSize: { default: '0.875rem', [media.lg]: '1rem' },
    lineHeight: { default: '1.25rem', [media.lg]: '1.5rem' },
    fontWeight: 500,
    color: {
      default: colors.muted,
      [media.hover]: {
        default: null,
        [stylex.when.ancestor(':hover')]: colors.ink,
      },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  labelActive: { color: colors.brand },
  track: {
    height: '0.5rem',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    borderRadius: '9999px',
    backgroundColor: colors.line,
  },
  fill: { display: 'block', height: '100%', borderRadius: '9999px' },
  fill5: { backgroundColor: 'oklch(62.7% 0.194 149.214)' },
  fill4: { backgroundColor: 'oklch(72.3% 0.219 149.579)' },
  fill3: { backgroundColor: 'oklch(90.5% 0.182 98.111)' },
  fill2: { backgroundColor: 'oklch(79.5% 0.184 86.047)' },
  fill1: { backgroundColor: 'oklch(57.7% 0.245 27.325)' },
  percent: {
    width: '42px',
    flexShrink: 0,
    textAlign: 'right',
    fontSize: { default: '0.875rem', [media.lg]: '1rem' },
    lineHeight: { default: '1.25rem', [media.lg]: '1.5rem' },
    color: colors.muted,
  },
});

export const RatingBands = ({
  distribution,
  total,
  activeRating,
  onSelect,
}: TRatingBandsProps) => (
  <ul {...stylex.props(styles.root)}>
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
            {...stylex.props(
              styles.band,
              focusRing.ring,
              stylex.defaultMarker(),
            )}
          >
            <span {...stylex.props(styles.label, active && styles.labelActive)}>
              {band.label}
            </span>
            <span {...stylex.props(styles.track)}>
              <span
                {...stylex.props(styles.fill, styles[`fill${band.value}`])}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span {...stylex.props(styles.percent)}>{percent}%</span>
          </button>
        </li>
      );
    })}
  </ul>
);

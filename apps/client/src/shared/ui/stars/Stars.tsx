import * as stylex from '@stylexjs/stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import { Star } from './Star';

export type TStarsProps = {
  rating: number;
  max?: number;
  label?: string;
};

// fit-content: as a flex item the root would stretch to the cross axis (e.g.
// inside a flex-col review card), and the fill overlay's percentage width
// must resolve against the star row, not the stretched box.
const styles = stylex.create({
  root: { position: 'relative', display: 'inline-flex', width: 'fit-content' },
  base: { display: 'flex', color: colors.gray200 },
  fill: {
    position: 'absolute',
    insetBlock: 0,
    left: 0,
    display: 'flex',
    overflow: 'hidden',
    color: colors.star,
  },
  star: { height: '1.25rem', width: '1.25rem', flexShrink: 0 },
});

export const Stars = ({ rating, max = 5, label }: TStarsProps) => {
  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const fill = Math.max(0, Math.min(100, (rating / max) * 100));

  return (
    <span
      {...stylex.props(styles.root)}
      role="img"
      aria-label={label ?? `Rated ${rating.toFixed(1)} out of ${max}`}
    >
      <span {...stylex.props(styles.base)}>
        {stars.map((value) => (
          <Star key={value} {...stylex.props(styles.star)} />
        ))}
      </span>
      <span {...stylex.props(styles.fill)} style={{ width: `${fill}%` }}>
        {stars.map((value) => (
          <Star key={value} {...stylex.props(styles.star)} />
        ))}
      </span>
    </span>
  );
};

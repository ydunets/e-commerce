import { Star } from './Star';
import styles from './Stars.module.css';

export type TStarsProps = {
  rating: number;
  max?: number;
  label?: string;
};

export const Stars = ({ rating, max = 5, label }: TStarsProps) => {
  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const fill = Math.max(0, Math.min(100, (rating / max) * 100));

  return (
    <span
      className={styles.root}
      role="img"
      aria-label={label ?? `Rated ${rating.toFixed(1)} out of ${max}`}
    >
      <span className={styles.base}>
        {stars.map((value) => (
          <Star key={value} className={styles.star} />
        ))}
      </span>
      <span className={styles.fill} style={{ width: `${fill}%` }}>
        {stars.map((value) => (
          <Star key={value} className={styles.star} />
        ))}
      </span>
    </span>
  );
};

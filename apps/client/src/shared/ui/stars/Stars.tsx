import type { SVGProps } from 'react';
import styles from './Stars.module.css';

const Star = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

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

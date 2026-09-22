import * as stylex from '@stylexjs/stylex';
import type { Review } from '@/entities/review';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Avatar } from '@/shared/ui/avatar';
import { Stars } from '@/shared/ui/stars';
import { colors } from '@/shared/ui/tokens.stylex';
import { formatReviewDate } from '../lib/format-date';

export type TReviewItemProps = {
  review: Review;
};

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem' },
  meta: {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  byline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  name: { fontWeight: 600, color: colors.ink },
  date: {
    flexShrink: 0,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: colors.muted,
  },
  content: {
    fontSize: { default: '0.875rem', [media.lg]: '1rem' },
    lineHeight: '1.5rem',
    color: colors.muted,
  },
});

export const ReviewItem = ({ review }: TReviewItemProps) => (
  <article {...stylex.props(styles.root)}>
    <div {...stylex.props(styles.header)}>
      <Avatar name={review.name} src={review.avatarUrl} size={48} />
      <div {...stylex.props(styles.meta)}>
        <div {...stylex.props(styles.byline)}>
          <span {...stylex.props(styles.name)}>{review.name}</span>
          <time {...stylex.props(styles.date)} dateTime={review.createdAt}>
            {formatReviewDate(review.createdAt)}
          </time>
        </div>
        <Stars rating={review.rating} />
      </div>
    </div>
    {review.content && (
      <p {...stylex.props(styles.content)}>{review.content}</p>
    )}
  </article>
);

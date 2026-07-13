import type { Review } from '@/entities/review';
import { Avatar } from '@/shared/ui/avatar';
import { Stars } from '@/shared/ui/stars';
import { formatReviewDate } from '../lib/format-date';

export type TReviewItemProps = {
  review: Review;
};

export const ReviewItem = ({ review }: TReviewItemProps) => (
  <article className="flex flex-col gap-4">
    <div className="flex items-center gap-4">
      <Avatar name={review.name} src={review.avatarUrl} size={48} />
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-ink">{review.name}</span>
          <time
            className="shrink-0 text-xs text-muted"
            dateTime={review.createdAt}
          >
            {formatReviewDate(review.createdAt)}
          </time>
        </div>
        <Stars rating={review.rating} />
      </div>
    </div>
    {review.content && (
      <p className="text-sm leading-6 text-muted lg:text-base">
        {review.content}
      </p>
    )}
  </article>
);

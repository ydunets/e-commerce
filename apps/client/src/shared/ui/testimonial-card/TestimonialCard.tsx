import { useId } from 'react';
import styles from './TestimonialCard.module.css';

export type TTestimonialCardProps = {
  authorName: string;
  authorUsername: string;
  authorImage: string;
  testimonialText: string;
};

export const TestimonialCard = ({
  authorName,
  authorUsername,
  authorImage,
  testimonialText,
}: TTestimonialCardProps) => {
  const cardId = useId();
  const authorId = `${cardId}-author`;
  const testimonialId = `${cardId}-testimonial`;

  return (
    // biome-ignore lint/a11y/useSemanticElements: figure/figcaption pairs the author with the quote; role announces the testimonial as an article.
    <figure
      className={styles.card}
      role="article"
      aria-labelledby={authorId}
      aria-describedby={testimonialId}
    >
      <figcaption className={styles.author} id={authorId}>
        <img
          src={authorImage}
          alt={authorName}
          className={styles.authorImage}
        />
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{authorName}</div>
          <div className={styles.authorUsername}>{authorUsername}</div>
        </div>
      </figcaption>
      <blockquote
        id={testimonialId}
        aria-label={`Testimonial by ${authorName}`}
      >
        <p>{testimonialText}</p>
      </blockquote>
    </figure>
  );
};

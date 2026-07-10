import { type KeyboardEvent, useRef } from 'react';
import { Star } from '@/shared/ui/stars';
import styles from './StarRatingInput.module.css';

export type TStarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  label?: string;
  name?: string;
};

const starLabel = (value: number) => `${value} star${value === 1 ? '' : 's'}`;

export const StarRatingInput = ({
  value,
  onChange,
  max = 5,
  readOnly = false,
  label = 'Rating',
  name,
}: TStarRatingInputProps) => {
  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const selected = Math.round(value);
  const tabStop = selected === 0 ? 1 : selected;
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const selectValue = (next: number) => {
    const clamped = Math.min(max, Math.max(1, next));
    onChange(clamped);
    buttonsRef.current[clamped - 1]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        selectValue(selected + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        selectValue(selected - 1);
        break;
      case 'Home':
        event.preventDefault();
        selectValue(1);
        break;
      case 'End':
        event.preventDefault();
        selectValue(max);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={styles.input}
      role="radiogroup"
      aria-label={label}
      aria-readonly={readOnly || undefined}
      onKeyDown={handleKeyDown}
    >
      {name ? <input type="hidden" name={name} value={selected} /> : null}
      {stars.map((starValue, index) => (
        // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA radio group composite with roving tabindex; native radios cannot be styled as these controls.
        <button
          key={starValue}
          ref={(node) => {
            buttonsRef.current[index] = node;
          }}
          type="button"
          role="radio"
          aria-checked={selected === starValue}
          aria-label={starLabel(starValue)}
          data-active={value >= starValue}
          disabled={readOnly}
          tabIndex={starValue === tabStop ? 0 : -1}
          className={styles.starButton}
          onClick={() => onChange(starValue)}
        >
          <Star className={styles.star} />
        </button>
      ))}
    </div>
  );
};

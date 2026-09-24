import * as stylex from '@stylexjs/stylex';
import { type KeyboardEvent, useRef } from 'react';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { Star } from '@/shared/ui/stars';
import { colors } from '@/shared/ui/tokens.stylex';

export type TStarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  label?: string;
  name?: string;
};

const styles = stylex.create({
  input: { display: 'inline-flex', alignItems: 'center', gap: '0.125rem' },
  star: { height: '1.25rem', width: '1.25rem', flexShrink: 0 },
  starButton: {
    cursor: 'pointer',
    pointerEvents: { default: null, ':disabled': 'none' },
    borderRadius: '0.25rem',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: '0.125rem',
    lineHeight: 1,
    color: {
      default: colors.gray200,
      '[data-active="true"]': colors.star,
      ':hover': { default: null, [media.hover]: colors.star },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
});

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
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- WAI-ARIA radiogroup composite with roving tabindex: focus lives on the radios, not on the group.
    <div
      {...stylex.props(styles.input)}
      role="radiogroup"
      aria-label={label}
      aria-readonly={readOnly || undefined}
      onKeyDown={handleKeyDown}
    >
      {name ? <input type="hidden" name={name} value={selected} /> : null}
      {stars.map((starValue, index) => (
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
          {...stylex.props(styles.starButton, focusRing.ring)}
          onClick={() => onChange(starValue)}
        >
          <Star {...stylex.props(styles.star)} />
        </button>
      ))}
    </div>
  );
};

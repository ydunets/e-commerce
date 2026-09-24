import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { useRadioGroup } from '@/shared/lib/useRadioGroup';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import { resolveSwatchColor } from './swatch-colors';

export type TColorOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Selectable but crossed out; availability details live on the product page. */
  outOfStock?: boolean;
};

export type TColorSwatchesSize = 'sm' | 'md';

export type TColorSwatchesProps = {
  options: TColorOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** 'sm' is the compact density used on product cards (Figma: 16px dot). */
  size?: TColorSwatchesSize;
};

// StyleX evaluates only local constants inside create(), so the ring string
// from focus-ring.ts is repeated here where the selected ring shares boxShadow.
const FOCUS_RING_SHADOW = `0 0 0 1px ${colors.focus}, 0 0 0 4px color-mix(in srgb, ${colors.focus} 12%, transparent)`;

const styles = stylex.create({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '1rem',
  },
  // Compact density for product cards (Figma: 4px padding + 16px dot = 24px).
  smRoot: { gap: '0.25rem' },
  swatch: {
    position: 'relative',
    height: '2.5rem',
    width: '2.5rem',
    cursor: 'pointer',
    borderRadius: '9999px',
    transitionProperty: 'box-shadow',
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
    // --swatch-fill / --swatch-ring are set inline from the swatch-colors catalog.
    // `color` drives the selected ring below via currentColor.
    backgroundColor: 'var(--swatch-fill)',
    color: 'var(--swatch-ring)',
  },
  sm: { height: '1.5rem', width: '1.5rem' },
  selected: {
    zIndex: 10,
    boxShadow: {
      default: '0 0 0 2px #fff, 0 0 0 4px currentColor',
      ':focus-visible': FOCUS_RING_SHADOW,
    },
  },
  smSelected: {
    boxShadow: {
      default: '0 0 0 1px #fff, 0 0 0 2px currentColor',
      ':focus-visible': FOCUS_RING_SHADOW,
    },
  },
  check: {
    position: 'absolute',
    inset: 0,
    margin: 'auto',
    height: '1.25rem',
    width: '1.25rem',
    color: '#fff',
  },
  smCheck: { height: '0.75rem', width: '0.75rem' },
  disabled: { cursor: 'not-allowed', opacity: 0.6 },
  // Out-of-stock stays selectable at full opacity; only the cross marks it
  // (style guide: Out-of-stock / Selected: Out-of-stock).
  cross: {
    '::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      margin: 'auto',
      height: '2px',
      width: '120%',
      transform: 'translateX(-10%) rotate(45deg)',
      backgroundColor: colors.muted,
    },
  },
});

const CheckIcon = ({ size }: { size: TColorSwatchesSize }) => (
  <svg
    viewBox="0 0 24 24"
    {...stylex.props(styles.check, size === 'sm' && styles.smCheck)}
    aria-hidden="true"
  >
    <path
      d="m5 13 4 4L19 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ColorSwatches = ({
  options,
  value,
  onChange,
  label = 'Available colors',
  size = 'md',
}: TColorSwatchesProps) => {
  const { handleKeyDown, optionRef, select, tabIndexFor } = useRadioGroup(
    options,
    value,
    onChange,
  );

  return (
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- WAI-ARIA radiogroup composite with roving tabindex: focus lives on the radios, not on the group.
    <div
      {...stylex.props(styles.root, size === 'sm' && styles.smRoot)}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const { fill, ring } = resolveSwatchColor(option.value);
        return (
          <button
            key={option.value}
            ref={optionRef(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={
              option.outOfStock
                ? `${option.label} (out of stock)`
                : option.label
            }
            disabled={option.disabled}
            tabIndex={tabIndexFor(option.value)}
            data-color={option.value}
            {...stylex.props(
              styles.swatch,
              focusRing.ring,
              size === 'sm' && styles.sm,
              selected && styles.selected,
              selected && size === 'sm' && styles.smSelected,
              option.disabled && styles.disabled,
              (option.disabled || option.outOfStock) && styles.cross,
            )}
            style={
              { '--swatch-fill': fill, '--swatch-ring': ring } as CSSProperties
            }
            onClick={() => select(option.value)}
          >
            {selected && !option.disabled && !option.outOfStock && (
              <CheckIcon size={size} />
            )}
          </button>
        );
      })}
    </div>
  );
};

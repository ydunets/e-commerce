import type { CSSProperties } from 'react';
import { cx } from '@/shared/lib/cx';
import { useRadioGroup } from '@/shared/lib/useRadioGroup';
import styles from './ColorSwatches.module.css';
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

const checkIcon = (
  <svg viewBox="0 0 24 24" className={styles.check} aria-hidden="true">
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
    <div
      className={cx(styles.root, size === 'sm' && styles.smRoot)}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const { fill, ring } = resolveSwatchColor(option.value);
        return (
          // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA radiogroup composite with roving tabindex; native radios cannot be styled as these controls.
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
            style={
              { '--swatch-fill': fill, '--swatch-ring': ring } as CSSProperties
            }
            className={cx(
              styles.swatch,
              size === 'sm' && styles.sm,
              selected && styles.selected,
              option.disabled && styles.disabled,
              option.outOfStock && styles.outOfStock,
            )}
            onClick={() => select(option.value)}
          >
            {selected && !option.disabled && !option.outOfStock && checkIcon}
          </button>
        );
      })}
    </div>
  );
};

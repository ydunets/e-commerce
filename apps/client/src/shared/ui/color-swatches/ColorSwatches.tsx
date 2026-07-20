import { type CSSProperties, type KeyboardEvent, useRef } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './ColorSwatches.module.css';
import { resolveSwatchColor } from './swatch-colors';

export type TColorOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Selectable but crossed out; availability details live on the product page. */
  outOfStock?: boolean;
};

export type TColorSwatchesProps = {
  options: TColorOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
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
}: TColorSwatchesProps) => {
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const selectOption = (option: TColorOption) => {
    onChange(option.value);
    buttons.current.get(option.value)?.focus({ preventScroll: true });
  };

  const moveSelection = (from: number, step: number) => {
    const count = options.length;
    for (let hop = 1; hop <= count; hop += 1) {
      const option = options[(((from + step * hop) % count) + count) % count];
      if (!option.disabled) return selectOption(option);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((option) => option.value === value);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        moveSelection(currentIndex, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        moveSelection(currentIndex, -1);
        break;
      case 'Home':
        moveSelection(options.length - 1, 1);
        break;
      case 'End':
        moveSelection(0, -1);
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  return (
    <div
      className={styles.root}
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
            ref={(node) => {
              if (node) buttons.current.set(option.value, node);
              else buttons.current.delete(option.value);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={
              option.outOfStock
                ? `${option.label} (out of stock)`
                : option.label
            }
            disabled={option.disabled}
            tabIndex={selected ? 0 : -1}
            data-color={option.value}
            style={
              { '--swatch-fill': fill, '--swatch-ring': ring } as CSSProperties
            }
            className={cx(
              styles.swatch,
              selected && styles.selected,
              option.disabled && styles.disabled,
              option.outOfStock && styles.outOfStock,
            )}
            onClick={() => selectOption(option)}
          >
            {selected && !option.disabled && !option.outOfStock && checkIcon}
          </button>
        );
      })}
    </div>
  );
};

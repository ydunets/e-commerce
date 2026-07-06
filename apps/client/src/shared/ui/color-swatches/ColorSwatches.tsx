import { cx } from '@/shared/lib/cx';
import styles from './ColorSwatches.module.css';

export type TColorOption = {
  value: string;
  label: string;
  disabled?: boolean;
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
}: TColorSwatchesProps) => (
  <div className={styles.root} role="radiogroup" aria-label={label}>
    {options.map((option) => {
      const selected = option.value === value;
      return (
        // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA radiogroup composite with roving tabindex; native radios cannot be styled as these controls.
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={option.label}
          disabled={option.disabled}
          data-color={option.value}
          className={cx(
            styles.swatch,
            selected && styles.selected,
            option.disabled && styles.disabled,
          )}
          onClick={() => onChange(option.value)}
        >
          {selected && !option.disabled && checkIcon}
        </button>
      );
    })}
  </div>
);

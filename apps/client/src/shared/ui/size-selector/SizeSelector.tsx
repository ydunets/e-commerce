import { cx } from '@/shared/lib/cx';
import styles from './SizeSelector.module.css';

export type TSizeOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type TSizeSelectorProps = {
  options: TSizeOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
};

export const SizeSelector = ({
  options,
  value,
  onChange,
  label = 'Available sizes',
}: TSizeSelectorProps) => (
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
          disabled={option.disabled}
          className={cx(
            styles.size,
            selected && styles.selected,
            option.disabled && styles.disabled,
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

import { cx } from '@/shared/lib/cx';
import { useRadioGroup } from '@/shared/lib/useRadioGroup';
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
}: TSizeSelectorProps) => {
  const { handleKeyDown, optionRef, select, tabIndexFor } = useRadioGroup(
    options,
    value,
    onChange,
  );

  return (
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- WAI-ARIA radiogroup composite with roving tabindex: focus lives on the radios, not on the group.
    <div
      className={styles.root}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={optionRef(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            tabIndex={tabIndexFor(option.value)}
            className={cx(
              styles.size,
              selected && styles.selected,
              option.disabled && styles.disabled,
            )}
            onClick={() => select(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

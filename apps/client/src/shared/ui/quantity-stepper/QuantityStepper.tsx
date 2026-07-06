import { cx } from '@/shared/lib/cx';
import styles from './QuantityStepper.module.css';

export type TQuantityStepperProps = {
  value: number;
  max: number;
  min?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
};

const minusIcon = (
  <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
    <path
      d="M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const plusIcon = (
  <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const QuantityStepper = ({
  value,
  max,
  min = 1,
  disabled = false,
  onChange,
}: TQuantityStepperProps) => {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className={cx(styles.root, disabled && styles.disabled)}>
      <button
        type="button"
        className={styles.button}
        aria-label="Decrease quantity"
        disabled={disabled || atMin}
        onClick={() => onChange(value - 1)}
      >
        {minusIcon}
      </button>

      <span className={styles.value} aria-live="polite">
        {value}
      </span>

      <span className={styles.plusWrap}>
        <button
          type="button"
          className={styles.button}
          aria-label="Increase quantity"
          aria-describedby={
            atMax && !disabled ? 'quantity-max-hint' : undefined
          }
          disabled={disabled || atMax}
          onClick={() => onChange(value + 1)}
        >
          {plusIcon}
        </button>
        {atMax && !disabled && (
          <span
            id="quantity-max-hint"
            role="tooltip"
            className={styles.tooltip}
          >
            Insufficient stock
          </span>
        )}
      </span>
    </div>
  );
};

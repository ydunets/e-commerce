import * as stylex from '@stylexjs/stylex';
import { media } from '@/shared/lib/breakpoints.stylex';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import { Tooltip } from '@/shared/ui/tooltip';

export type TQuantityStepperProps = {
  value: number;
  max: number;
  min?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
};

const styles = stylex.create({
  root: {
    display: 'flex',
    width: '125px',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: colors.field,
  },
  disabled: { opacity: 0.6 },
  button: {
    display: 'flex',
    height: '2.5rem',
    width: '2.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: { default: null, ':disabled': 'not-allowed' },
    color: {
      default: colors.muted,
      ':hover': { default: null, [media.hover]: colors.ink },
      ':disabled': colors.gray200,
    },
    outline: { default: null, ':focus-visible': 'none' },
    boxShadow: {
      default: null,
      ':focus-visible': `inset 0 0 0 2px ${colors.brand}`,
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  icon: { height: '1.25rem', width: '1.25rem' },
  value: {
    minWidth: '2rem',
    userSelect: 'none',
    textAlign: 'center',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 500,
    color: colors.muted,
  },
});

const minusIcon = (
  <svg viewBox="0 0 24 24" {...stylex.props(styles.icon)} aria-hidden="true">
    <path
      d="M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const plusIcon = (
  <svg viewBox="0 0 24 24" {...stylex.props(styles.icon)} aria-hidden="true">
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
    <fieldset
      aria-label="Quantity"
      {...stylex.props(styles.root, disabled && styles.disabled)}
    >
      <button
        type="button"
        {...stylex.props(styles.button)}
        aria-label="Decrease quantity"
        disabled={disabled || atMin}
        onClick={() => onChange(value - 1)}
      >
        {minusIcon}
      </button>

      <span {...stylex.props(styles.value)} aria-live="polite">
        {value}
      </span>

      <Tooltip content="Insufficient stock" enabled={atMax && !disabled}>
        <button
          type="button"
          {...stylex.props(styles.button)}
          aria-label="Increase quantity"
          disabled={disabled || atMax}
          onClick={() => onChange(value + 1)}
        >
          {plusIcon}
        </button>
      </Tooltip>
    </fieldset>
  );
};

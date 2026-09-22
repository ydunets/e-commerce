import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { useId } from 'react';
import { focusRing } from '@/shared/ui/focus-ring';
import { colors } from '@/shared/ui/tokens.stylex';
import { visuallyHidden } from '@/shared/ui/visually-hidden';

export type TTextInputType = 'text' | 'email';

export type TTextInputProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: TTextInputType;
  name?: string;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
  labelHidden?: boolean;
  /** Focus on mount. Only for a field that replaces the control the visitor just activated. */
  autoFocus?: boolean;
  style?: StyleXStyles;
};

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 500,
    color: colors.ink,
  },
  fieldWrap: { position: 'relative' },
  field: {
    height: '2.5rem',
    width: '100%',
    borderRadius: '0.25rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: { default: colors.field, ':disabled': colors.surface },
    paddingLeft: '0.875rem',
    paddingRight: '0.875rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: { default: colors.ink, ':disabled': colors.disabled },
    cursor: { default: null, ':disabled': 'not-allowed' },
    '::placeholder': {
      color: { default: colors.tertiary, ':disabled': colors.disabled },
    },
  },
  fieldError: { paddingRight: '2.25rem' },
  errorIcon: {
    pointerEvents: 'none',
    position: 'absolute',
    top: '50%',
    right: '0.875rem',
    height: '1rem',
    width: '1rem',
    transform: 'translateY(-50%)',
    color: colors.danger,
  },
  error: { fontSize: '0.875rem', lineHeight: '1.25rem', color: colors.danger },
});

// Figma pairs the error copy with a warning glyph inside the field, so colour
// alone never carries the rejection.
const ErrorIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...stylex.props(styles.errorIcon)}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5" />
    <path d="M12 16.25h.01" />
  </svg>
);

export const TextInput = ({
  label,
  value,
  onChange,
  type = 'text',
  name,
  placeholder,
  errorMessage,
  disabled = false,
  labelHidden = false,
  autoFocus = false,
  style,
}: TTextInputProps) => {
  const fieldId = useId();
  const errorId = useId();
  const hasError = Boolean(errorMessage);

  return (
    <div {...stylex.props(styles.root, style)}>
      <label
        htmlFor={fieldId}
        {...stylex.props(styles.label, labelHidden && visuallyHidden.root)}
      >
        {label}
      </label>

      <div {...stylex.props(styles.fieldWrap)}>
        <input
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- the field replaces the button the visitor just activated, so focus has to follow it
          autoFocus={autoFocus}
          id={fieldId}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          {...stylex.props(
            styles.field,
            focusRing.ring,
            hasError && styles.fieldError,
          )}
          onChange={(event) => onChange(event.target.value)}
        />
        {hasError && <ErrorIcon />}
      </div>

      {hasError ? (
        <p id={errorId} role="alert" {...stylex.props(styles.error)}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

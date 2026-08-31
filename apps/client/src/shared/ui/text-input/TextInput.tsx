import { useId } from 'react';
import { cx } from '@/shared/lib/cx';

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
  className?: string;
};

const fieldClasses = cx(
  'h-10 w-full rounded-sm border border-line bg-field px-3.5 text-sm text-ink',
  'placeholder:text-tertiary',
  'focus-visible:focus-ring',
  'disabled:cursor-not-allowed disabled:bg-surface disabled:text-disabled disabled:placeholder:text-disabled',
);

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
    className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-danger"
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
  className,
}: TTextInputProps) => {
  const fieldId = useId();
  const errorId = useId();
  const hasError = Boolean(errorMessage);

  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label
        htmlFor={fieldId}
        className={cx(
          'text-sm font-medium text-ink',
          labelHidden ? 'sr-only' : undefined,
        )}
      >
        {label}
      </label>

      <div className="relative">
        <input
          // biome-ignore lint/a11y/noAutofocus: the field replaces the button the visitor just activated, so focus has to follow it
          autoFocus={autoFocus}
          id={fieldId}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={cx(fieldClasses, hasError && 'pr-9')}
          onChange={(event) => onChange(event.target.value)}
        />
        {hasError && <ErrorIcon />}
      </div>

      {hasError ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

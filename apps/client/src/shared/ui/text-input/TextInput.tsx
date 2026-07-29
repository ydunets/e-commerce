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
  className?: string;
};

const fieldClasses = cx(
  'h-10 w-full rounded-sm border border-line bg-field px-3.5 text-sm text-ink',
  'placeholder:text-tertiary',
  'focus-visible:focus-ring',
  'disabled:cursor-not-allowed disabled:bg-surface disabled:text-disabled disabled:placeholder:text-disabled',
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

      <input
        id={fieldId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={fieldClasses}
        onChange={(event) => onChange(event.target.value)}
      />

      {hasError ? (
        <p id={errorId} className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

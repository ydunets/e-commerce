import { cx } from '@/shared/lib/cx';

export type TClearFilterButtonProps = {
  onClick: () => void;
  className?: string;
};

export const ClearFilterButton = ({
  onClick,
  className,
}: TClearFilterButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      'rounded-sm text-base font-medium text-brand hover:underline focus-visible:focus-ring',
      className,
    )}
  >
    Clear filter
  </button>
);

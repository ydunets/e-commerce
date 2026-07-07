import type { PropsWithChildren } from 'react';
import { cx } from '@/shared/lib/cx';

export type TBadgeVariant = 'neutral' | 'warning' | 'success' | 'danger';

export type TBadgeProps = PropsWithChildren<{
  variant?: TBadgeVariant;
  className?: string;
}>;

// Figma badge: a pill (rounded-full) with a subtle background, a matching
// 1px border and status-colored text. The discount badge uses `warning`.
const variantClasses: Record<TBadgeVariant, string> = {
  neutral: 'bg-surface border-line text-muted',
  warning: 'bg-warning-soft border-warning-line text-warning',
  success: 'bg-success-soft border-success-line text-success',
  danger: 'bg-danger-soft border-danger-line text-danger',
};

export const Badge = ({
  variant = 'neutral',
  className,
  children,
}: TBadgeProps) => (
  <span
    className={cx(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-sm',
      variantClasses[variant],
      className,
    )}
  >
    {children}
  </span>
);

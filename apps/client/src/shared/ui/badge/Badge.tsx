import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { PropsWithChildren } from 'react';
import { colors } from '@/shared/ui/tokens.stylex';

export type TBadgeVariant =
  | 'neutral'
  | 'brand'
  | 'warning'
  | 'success'
  | 'danger';

export type TBadgeProps = PropsWithChildren<{
  variant?: TBadgeVariant;
  style?: StyleXStyles;
}>;

// Figma badge: a pill (rounded-full) with a subtle background, a matching
// 1px border and status-colored text. The discount badge uses `warning`.
const styles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '9999px',
    borderWidth: '1px',
    borderStyle: 'solid',
    paddingInline: '0.625rem',
    paddingBlock: '0.25rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  neutral: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    color: colors.muted,
  },
  brand: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandLine,
    color: colors.brand,
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningLine,
    color: colors.warning,
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successLine,
    color: colors.success,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerLine,
    color: colors.danger,
  },
});

export const Badge = ({
  variant = 'neutral',
  style,
  children,
}: TBadgeProps) => (
  <span {...stylex.props(styles.root, styles[variant], style)}>{children}</span>
);

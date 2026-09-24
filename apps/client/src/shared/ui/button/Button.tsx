import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors, shadows } from '@/shared/ui/tokens.stylex';

export type TButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type TButtonSize = 'md' | 'lg' | 'xl';
export type TButtonType = 'button' | 'submit';

export type TButtonProps = PropsWithChildren<{
  variant?: TButtonVariant;
  size?: TButtonSize;
  type?: TButtonType;
  disabled?: boolean;
  style?: StyleXStyles;
  onClick?: () => void;
  /** When set, renders a router Link styled as a button. */
  href?: LinkProps['to'];
  params?: LinkProps['params'];
}>;

// Figma button radius is 4px; filled and bordered buttons carry the Figma
// `shadow` token, dropped again while disabled.
const styles = stylex.create({
  root: {
    display: 'inline-flex',
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '0.25rem',
    fontWeight: 500,
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  primary: {
    backgroundColor: {
      default: colors.brand,
      ':hover': { default: null, [media.hover]: colors.brandDark },
      ':disabled': colors.surface,
    },
    color: { default: '#fff', ':disabled': colors.disabled },
    boxShadow: { default: shadows.card, ':disabled': 'none' },
  },
  secondary: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: {
      default: '#fff',
      ':hover': { default: null, [media.hover]: colors.surface },
    },
    color: { default: colors.ink, ':disabled': colors.disabled },
    boxShadow: { default: shadows.card, ':disabled': 'none' },
  },
  tertiary: {
    backgroundColor: {
      default: 'transparent',
      ':hover': { default: null, [media.hover]: colors.surface },
    },
    color: { default: colors.brand, ':disabled': colors.disabled },
  },
  md: {
    paddingInline: '1rem',
    paddingBlock: '0.625rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  lg: {
    paddingInline: '1.5rem',
    paddingBlock: '0.75rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
  },
  xl: {
    paddingInline: '1.5rem',
    paddingBlock: '1rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
  },
});

export const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  style,
  onClick,
  href,
  params,
  children,
}: TButtonProps) => {
  const props = stylex.props(
    styles.root,
    focusRing.ring,
    styles[variant],
    styles[size],
    style,
  );

  if (href) {
    return (
      <Link to={href} params={params} {...props} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} {...props} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};

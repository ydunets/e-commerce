import { Link, type LinkProps } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';
import { cx } from '@/shared/lib/cx';

export type TButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type TButtonSize = 'md' | 'lg' | 'xl';

export type TButtonProps = PropsWithChildren<{
  variant?: TButtonVariant;
  size?: TButtonSize;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  /** When set, renders a router Link styled as a button. */
  href?: LinkProps['to'];
  params?: LinkProps['params'];
}>;

const commonClasses = cx(
  'inline-flex cursor-pointer items-center justify-center gap-2',
  // Figma button radius is 4px (rounded-sm in Tailwind v4).
  'rounded-sm font-medium transition-colors',
  'focus-visible:focus-ring',
);

// Figma `shadow` token: a subtle two-layer drop shadow on filled/bordered buttons.
const shadow =
  'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06),0px_1px_3px_0px_rgba(0,0,0,0.1)]';

const variantClasses: Record<TButtonVariant, string> = {
  primary: cx(
    'bg-brand text-white',
    shadow,
    'hover:bg-brand-dark',
    'disabled:cursor-not-allowed disabled:bg-surface disabled:text-disabled disabled:shadow-none',
  ),
  secondary: cx(
    'border border-line bg-white text-ink',
    shadow,
    'hover:bg-surface',
    'disabled:cursor-not-allowed disabled:border-line disabled:text-disabled disabled:shadow-none',
  ),
  tertiary: cx(
    'text-brand',
    'hover:bg-surface',
    'disabled:cursor-not-allowed disabled:text-disabled',
  ),
};

const sizeClasses: Record<TButtonSize, string> = {
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-6 py-3.5 text-base',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  onClick,
  href,
  params,
  children,
}: TButtonProps) => {
  const classes = cx(
    commonClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link to={href} params={params} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

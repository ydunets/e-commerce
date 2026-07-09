import { type PropsWithChildren, type ReactNode, useId, useState } from 'react';
import { cx } from '@/shared/lib/cx';

export type TTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TTooltipProps = PropsWithChildren<{
  content: ReactNode;
  position?: TTooltipPosition;
  /** When false the trigger renders but the tooltip never appears. */
  enabled?: boolean;
}>;

const panelPosition: Record<TTooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

// A CSS triangle: the solid border faces the panel, the transparent sides
// form the point. Figma arrow is 16px wide × 6px tall (border-x-8 + border-6px).
const arrowPosition: Record<TTooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-ink-strong border-t-[6px] border-x-8 border-x-transparent',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-ink-strong border-b-[6px] border-x-8 border-x-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-ink-strong border-l-[6px] border-y-8 border-y-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-ink-strong border-r-[6px] border-y-8 border-y-transparent',
};

export const Tooltip = ({
  content,
  position = 'top',
  enabled = true,
  children,
}: TTooltipProps) => {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const show = enabled && visible;

  return (
    // Shows on hover and keyboard focus; onFocus/onBlur bubble from the trigger.
    // biome-ignore lint/a11y/noStaticElementInteractions: the wrapper is not itself actionable; the listeners only reveal a descriptive tooltip for the trigger it wraps.
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={show ? tooltipId : undefined}
    >
      {children}
      {show && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cx(
            'pointer-events-none absolute z-10 whitespace-nowrap',
            'rounded-lg bg-ink-strong px-3 py-2',
            'text-xs font-medium text-white',
            'shadow-card-lg',
            panelPosition[position],
          )}
        >
          {content}
          <span
            aria-hidden="true"
            className={cx('absolute h-0 w-0', arrowPosition[position])}
          />
        </span>
      )}
    </span>
  );
};

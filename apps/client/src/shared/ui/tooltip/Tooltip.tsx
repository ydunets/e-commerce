import * as stylex from '@stylexjs/stylex';
import { type PropsWithChildren, type ReactNode, useId, useState } from 'react';
import { colors, shadows } from '@/shared/ui/tokens.stylex';

export type TTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TTooltipProps = PropsWithChildren<{
  content: ReactNode;
  position?: TTooltipPosition;
  /** When false the trigger renders but the tooltip never appears. */
  enabled?: boolean;
}>;

const styles = stylex.create({
  root: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
  panel: {
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 10,
    whiteSpace: 'nowrap',
    borderRadius: '0.5rem',
    backgroundColor: colors.inkStrong,
    paddingInline: '0.75rem',
    paddingBlock: '0.5rem',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    color: '#fff',
    boxShadow: shadows.cardLg,
  },
  // A CSS triangle: the solid border faces the panel, the transparent sides
  // form the point. Figma arrow is 16px wide × 6px tall (8px sides + 6px base).
  arrow: {
    position: 'absolute',
    height: 0,
    width: 0,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
});

const panelPosition = stylex.create({
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '0.5rem',
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '0.5rem',
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginRight: '0.5rem',
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginLeft: '0.5rem',
  },
});

const arrowPosition = stylex.create({
  top: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    borderTopWidth: '6px',
    borderTopColor: colors.inkStrong,
    borderLeftWidth: '8px',
    borderRightWidth: '8px',
  },
  bottom: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    borderBottomWidth: '6px',
    borderBottomColor: colors.inkStrong,
    borderLeftWidth: '8px',
    borderRightWidth: '8px',
  },
  left: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    borderLeftWidth: '6px',
    borderLeftColor: colors.inkStrong,
    borderTopWidth: '8px',
    borderBottomWidth: '8px',
  },
  right: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    borderRightWidth: '6px',
    borderRightColor: colors.inkStrong,
    borderTopWidth: '8px',
    borderBottomWidth: '8px',
  },
});

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
    <span
      {...stylex.props(styles.root)}
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
          {...stylex.props(styles.panel, panelPosition[position])}
        >
          {content}
          <span
            aria-hidden="true"
            {...stylex.props(styles.arrow, arrowPosition[position])}
          />
        </span>
      )}
    </span>
  );
};

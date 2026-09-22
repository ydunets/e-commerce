import * as stylex from '@stylexjs/stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { colors } from '@/shared/ui/tokens.stylex';

export type TAccordionProps = {
  title: string;
  items: string[];
  defaultOpen?: boolean;
};

// Items are laid out with a gap by the parent; every item except the first
// carries a top divider + padding (Figma: 32px gap, then border, then 24px).
const styles = stylex.create({
  root: {
    borderTopWidth: { default: 0, ':not(:first-child)': '1px' },
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    paddingTop: { default: 0, ':not(:first-child)': '1.5rem' },
  },
  summary: {
    display: 'flex',
    cursor: 'pointer',
    listStyle: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 500,
    color: colors.ink,
    borderRadius: '0.25rem',
    // oxlint-disable-next-line @stylexjs/valid-styles -- the compiler emits the vendor pseudo-element, and WebKit still draws the marker without it.
    '::-webkit-details-marker': { display: 'none' },
  },
  icon: {
    height: '1.5rem',
    width: '1.5rem',
    flexShrink: 0,
    color: colors.disabled,
  },
  iconVertical: {
    display: { default: null, [stylex.when.ancestor('[open]')]: 'none' },
  },
  list: {
    marginTop: '0.5rem',
    display: 'flex',
    listStyleType: 'disc',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingLeft: '1.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: colors.muted,
  },
});

export const Accordion = ({
  title,
  items,
  defaultOpen = true,
}: TAccordionProps) => (
  <details
    {...stylex.props(styles.root, stylex.defaultMarker())}
    open={defaultOpen}
  >
    <summary {...stylex.props(styles.summary, focusRing.ring)}>
      <span>{title}</span>
      <svg
        viewBox="0 0 24 24"
        {...stylex.props(styles.icon)}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" />
        <path
          d="M8 12h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          {...stylex.props(styles.iconVertical)}
          d="M12 8v8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </summary>
    <ul {...stylex.props(styles.list)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </details>
);

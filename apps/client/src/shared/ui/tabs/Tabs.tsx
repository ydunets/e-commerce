import * as stylex from '@stylexjs/stylex';
import { type KeyboardEvent, useState } from 'react';
import { media } from '@/shared/lib/breakpoints.stylex';
import { useIntersectionObserver } from '@/shared/lib/useIntersectionObserver';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';

export type TTabItem = {
  id: string;
  label: string;
};

export type TTabsProps = {
  tabs: TTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
  idPrefix: string;
};

const EDGE_SHADOW_TRANSITION_DURATION = '200ms';

const styles = stylex.create({
  root: {
    position: 'relative',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.lineStrong,
  },
  // The -1px margin drops the row onto the root divider so each tab's own
  // bottom border overlaps it: transparent for inactive tabs, brand for the
  // active.
  scroller: {
    marginBottom: '-1px',
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    // oxlint-disable-next-line @stylexjs/valid-styles -- the compiler emits the vendor pseudo-element, and Safari needs it to hide the scrollbar.
    '::-webkit-scrollbar': { display: 'none' },
  },
  tabList: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  tab: {
    display: 'flex',
    height: '2.25rem',
    flexShrink: 0,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    borderRadius: { default: null, ':focus-visible': '0.25rem' },
    paddingInline: '0.5rem',
    paddingBottom: '0.75rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    color: {
      default: colors.muted,
      ':hover': { default: null, [media.hover]: colors.ink },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  tabActive: { borderBottomColor: colors.brandSolid, color: colors.brand },
  // 1px probes at both ends of the scrollable content; an IntersectionObserver
  // watches them to toggle the edge shadows.
  sentinel: {
    width: '1px',
    flexShrink: 0,
    alignSelf: 'stretch',
    marginRight: { default: null, ':first-child': '-1px' },
    marginLeft: { default: null, ':last-child': '-1px' },
  },
  shadow: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '17px',
    opacity: { default: 0, '[data-visible]': 1 },
    transitionProperty: 'opacity',
    transitionDuration: EDGE_SHADOW_TRANSITION_DURATION,
    transitionTimingFunction: transitions.easing,
  },
  shadowStart: {
    left: 0,
    backgroundImage:
      'linear-gradient(to right, #fff 20%, rgba(255, 255, 255, 0)), linear-gradient(to right, rgba(23, 23, 23, 0.12), rgba(23, 23, 23, 0) 75%)',
  },
  shadowEnd: {
    right: 0,
    backgroundImage:
      'linear-gradient(to left, #fff 20%, rgba(255, 255, 255, 0)), linear-gradient(to left, rgba(23, 23, 23, 0.12), rgba(23, 23, 23, 0) 75%)',
  },
});

export const tabButtonId = (idPrefix: string, tabId: string) =>
  `${idPrefix}-tab-${tabId}`;

export const tabPanelId = (idPrefix: string, tabId: string) =>
  `${idPrefix}-panel-${tabId}`;

export const Tabs = ({
  tabs,
  activeId,
  onChange,
  label,
  idPrefix,
}: TTabsProps) => {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const { ref: startSentinelRef, isIntersecting: startVisible } =
    useIntersectionObserver({ root: scroller, initialIsIntersecting: true });
  const { ref: endSentinelRef, isIntersecting: endVisible } =
    useIntersectionObserver({ root: scroller, initialIsIntersecting: true });

  const activateTab = (tab: TTabItem) => {
    onChange(tab.id);
    const button = document.getElementById(tabButtonId(idPrefix, tab.id));
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeId);
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    activateTab(tabs[nextIndex]);
  };

  return (
    <div {...stylex.props(styles.root)}>
      <div ref={setScroller} {...stylex.props(styles.scroller)}>
        <span
          ref={startSentinelRef}
          {...stylex.props(styles.sentinel)}
          aria-hidden="true"
        />
        {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- WAI-ARIA tabs composite with roving tabindex: focus lives on the tabs, not on the list. */}
        <div
          role="tablist"
          aria-label={label}
          {...stylex.props(styles.tabList)}
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                id={tabButtonId(idPrefix, tab.id)}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={tabPanelId(idPrefix, tab.id)}
                tabIndex={isActive ? 0 : -1}
                {...stylex.props(
                  styles.tab,
                  focusRing.ring,
                  isActive && styles.tabActive,
                )}
                onClick={() => onChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <span
          ref={endSentinelRef}
          {...stylex.props(styles.sentinel)}
          aria-hidden="true"
        />
      </div>
      <span
        {...stylex.props(styles.shadow, styles.shadowStart)}
        data-visible={!startVisible || undefined}
        aria-hidden="true"
      />
      <span
        {...stylex.props(styles.shadow, styles.shadowEnd)}
        data-visible={!endVisible || undefined}
        aria-hidden="true"
      />
    </div>
  );
};

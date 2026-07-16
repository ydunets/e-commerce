import { type KeyboardEvent, useState } from 'react';
import { useIntersectionObserver } from '@/shared/lib/useIntersectionObserver';
import styles from './Tabs.module.css';

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
  const startSentinel = useIntersectionObserver({
    root: scroller,
    initialIsIntersecting: true,
  });
  const endSentinel = useIntersectionObserver({
    root: scroller,
    initialIsIntersecting: true,
  });

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
    <div className={styles.root}>
      <div ref={setScroller} className={styles.scroller}>
        <span
          ref={startSentinel.ref}
          className={styles.sentinel}
          aria-hidden="true"
        />
        <div
          role="tablist"
          aria-label={label}
          className={styles.tabList}
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
                className={
                  isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
                }
                onClick={() => onChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <span
          ref={endSentinel.ref}
          className={styles.sentinel}
          aria-hidden="true"
        />
      </div>
      <span
        className={`${styles.shadow} ${styles.shadowStart}`}
        data-visible={!startSentinel.isIntersecting || undefined}
        aria-hidden="true"
      />
      <span
        className={`${styles.shadow} ${styles.shadowEnd}`}
        data-visible={!endSentinel.isIntersecting || undefined}
        aria-hidden="true"
      />
    </div>
  );
};

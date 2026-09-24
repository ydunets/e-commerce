import * as stylex from '@stylexjs/stylex';
import { useSyncExternalStore } from 'react';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Button } from '@/shared/ui/button';
import { colors } from '@/shared/ui/tokens.stylex';
import {
  acceptCookies,
  hasAcceptedCookies,
  hasAcceptedCookiesOnServer,
  subscribeToCookieChoice,
} from './cookieChoice';

const BANNER_LABEL = 'Cookie notice';

// Anchored to the bottom of the viewport and above the page, which is what
// makes it the overlay the e2e suite dismisses through a locator handler.
const styles = stylex.create({
  root: {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    zIndex: 50,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    backgroundColor: '#fff',
    paddingInline: { default: '1rem', [media.md]: '2rem' },
    paddingBlock: '1rem',
    boxShadow:
      '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  copy: { fontSize: '0.875rem', lineHeight: '1.25rem', color: colors.muted },
});

export const CookieBanner = () => {
  const accepted = useSyncExternalStore(
    subscribeToCookieChoice,
    hasAcceptedCookies,
    hasAcceptedCookiesOnServer,
  );

  if (accepted) return null;

  return (
    <section
      {...stylex.props(styles.root)}
      aria-label={BANNER_LABEL}
      data-print-hidden
    >
      <p {...stylex.props(styles.copy)}>
        We use cookies to keep your bag and to measure how the shop is used.
      </p>
      <Button onClick={acceptCookies}>Accept cookies</Button>
    </section>
  );
};

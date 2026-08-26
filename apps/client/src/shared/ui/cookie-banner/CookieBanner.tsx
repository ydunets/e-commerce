import { useSyncExternalStore } from 'react';
import { Button } from '@/shared/ui/button';
import styles from './CookieBanner.module.css';
import {
  acceptCookies,
  hasAcceptedCookies,
  hasAcceptedCookiesOnServer,
  subscribeToCookieChoice,
} from './cookieChoice';

const BANNER_LABEL = 'Cookie notice';

export const CookieBanner = () => {
  const accepted = useSyncExternalStore(
    subscribeToCookieChoice,
    hasAcceptedCookies,
    hasAcceptedCookiesOnServer,
  );

  if (accepted) return null;

  return (
    <section
      className={styles.root}
      aria-label={BANNER_LABEL}
      data-print-hidden
    >
      <p className={styles.copy}>
        We use cookies to keep your bag and to measure how the shop is used.
      </p>
      <Button onClick={acceptCookies}>Accept cookies</Button>
    </section>
  );
};

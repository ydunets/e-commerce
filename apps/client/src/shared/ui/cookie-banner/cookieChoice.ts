// Mirrors the key asserted in apps/e2e/tests/surfaces.spec.ts.
const COOKIE_CHOICE_KEY = 'stylenest.cookie-choice';
const ACCEPTED = 'accepted';

const listeners = new Set<() => void>();

export function subscribeToCookieChoice(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hasAcceptedCookies(): boolean {
  return localStorage.getItem(COOKIE_CHOICE_KEY) === ACCEPTED;
}

/** The server cannot know the visitor's choice, so it renders no banner. */
export function hasAcceptedCookiesOnServer(): boolean {
  return true;
}

export function acceptCookies(): void {
  localStorage.setItem(COOKIE_CHOICE_KEY, ACCEPTED);
  for (const listener of listeners) listener();
}

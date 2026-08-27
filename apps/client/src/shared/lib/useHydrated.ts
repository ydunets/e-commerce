import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during SSR and the hydration render, true right after. Gate markup
 * that depends on client-only state (query cache, storage) so a code-split
 * route hydrating late still matches the server-rendered shell.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

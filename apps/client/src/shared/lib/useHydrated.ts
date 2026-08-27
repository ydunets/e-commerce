import { useEffect, useState } from 'react';

/**
 * False during SSR and the hydration render, true right after. Gate markup
 * that depends on client-only state (query cache, storage) so a code-split
 * route hydrating late still matches the server-rendered shell. This is the
 * two-pass pattern from the react.dev hydrateRoot reference ("Handling
 * different client and server content").
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

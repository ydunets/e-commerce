import { useEffect, useState } from 'react';

// Hydration is a property of the document, not of a component, so the flag
// lives at module scope: the first pass still renders the server shell, while
// every later mount (a client-side navigation into a code-split route, whose
// query cache is already warm) renders its real markup at once instead of
// replaying the two-pass and flashing an empty section.
let documentHydrated = false;

/**
 * False during SSR and the hydration render, true right after. Gate markup
 * that depends on client-only state (query cache, storage) so a code-split
 * route hydrating late still matches the server-rendered shell. This is the
 * two-pass pattern from the react.dev hydrateRoot reference ("Handling
 * different client and server content").
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(documentHydrated);

  useEffect(() => {
    documentHydrated = true;
    setHydrated(true);
  }, []);

  return hydrated;
}

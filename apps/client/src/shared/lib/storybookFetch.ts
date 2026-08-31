/**
 * Answers requests whose URL contains `pathFragment` from `handler`, and
 * returns the undo the story's `beforeEach` hands back. Scoping to one
 * endpoint is load-bearing: a blanket `window.fetch` override also breaks the
 * dev server's own HMR fetches and triggers full reloads.
 */
export function stubFetch(
  pathFragment: string,
  handler: typeof fetch,
): () => void {
  const original = window.fetch;

  window.fetch = ((input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes(pathFragment)
      ? handler(input, init)
      : original(input, init);
  }) as typeof fetch;

  return () => {
    window.fetch = original;
  };
}

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

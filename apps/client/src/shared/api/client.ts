// During SSR route loaders must hit the API directly; in the browser the
// relative path goes through the express /api proxy.
export const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:4000')
    : '';

// Relative `/api/...` paths hit the SSR express server, which proxies them to
// the Fastify API. During SSR pass an absolute `baseUrl` (API_URL) instead.
export async function apiGet<T>(path: string, baseUrl = ''): Promise<T> {
  const res = await fetch(`${baseUrl}/api${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

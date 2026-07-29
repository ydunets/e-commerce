import { toApiError } from './api-error';

// During SSR route loaders must hit the API directly; in the browser the
// relative path goes through the express /api proxy.
export const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:4000')
    : '';

async function request<T>(
  path: string,
  baseUrl: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${baseUrl}/api${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.json() as Promise<T>;
}

// Relative `/api/...` paths hit the SSR express server, which proxies them to
// the Fastify API. During SSR pass an absolute `baseUrl` (API_URL) instead.
export function apiGet<T>(path: string, baseUrl = ''): Promise<T> {
  return request<T>(path, baseUrl);
}

export function apiPost<T>(
  path: string,
  body: unknown,
  baseUrl = '',
): Promise<T> {
  return request<T>(path, baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

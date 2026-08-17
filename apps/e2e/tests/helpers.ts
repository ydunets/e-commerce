import type { APIResponse } from '@playwright/test';

export const PRODUCT = {
  name: 'Voyager Hoodie',
  path: '/products/voyager-hoodie',
  /** Seeded inventory rows for the default green colour (see the products seed). */
  sku: 'vh-green-md',
  secondSku: 'vh-brown-xs',
} as const;

export const ROUTES = {
  home: '/',
  about: '/about',
  products: '/products',
} as const;

/** Versioned API routes; `/health` and `/api-docs/json` sit outside this prefix. */
export const API_PREFIX = '/api/v1';

/** The cart as every cart route answers it. */
export type CartResponse = {
  id: string;
  lines: { sku: string; quantity: number }[];
  totalUnits: number;
};

const JSON_CONTENT_TYPE = 'application/json';

/**
 * Reads a response body at the type the caller expects, refusing to parse
 * anything that does not declare itself as JSON. A proxy error page or an
 * HTML 404 would otherwise surface as a confusing parse failure deep in an
 * assertion; this names the real problem at the read. `APIResponse.json()`
 * answers `any`, so the one unavoidable cast also lives here. Deliberately
 * throws instead of catching: in a test, a swallowed error is a hidden
 * failure.
 */
export async function readJson<T>(response: APIResponse): Promise<T> {
  const contentType = response.headers()['content-type'];
  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new TypeError(
      `expected ${JSON_CONTENT_TYPE} from ${response.url()} ` +
        `but got "${contentType ?? 'no content-type'}" (status ${response.status()})`,
    );
  }
  return (await response.json()) as T;
}

/**
 * Subscribing the same address twice answers 200, so uniqueness is not what
 * this guards. A fresh address keeps each run's rows distinguishable in the
 * database that every run shares.
 */
export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

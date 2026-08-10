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

/**
 * Subscribing the same address twice answers 200, so uniqueness is not what
 * this guards. A fresh address keeps each run's rows distinguishable in the
 * database that every run shares.
 */
export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

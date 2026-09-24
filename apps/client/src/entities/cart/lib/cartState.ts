import type { CartResponseDto, StockChangeDto } from '@e-commerce/contracts';
import { type QueryClient, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { isApiError } from '@/shared/api';
import { withLineQuantity } from './cartCache';

export const CART_QUERY_KEY = ['cart'] as const;
export const CART_MUTATION_SCOPE = { id: 'cart' } as const;
const CART_STATE_KEY = ['cart-state'] as const;
const CONFLICT = 409;

const stockDetailsSchema = z.object({
  sku: z.string(),
  requested: z.int().positive(),
  available: z.int().nonnegative(),
});

export type TStockNotice = {
  changes: StockChangeDto[];
  correctedCart?: CartResponseDto;
};

type TCartState = {
  stock: TStockNotice | null;
  checking: boolean;
  error: string | null;
  checkoutCartId: string | null;
};

const INITIAL_STATE: TCartState = {
  stock: null,
  checking: false,
  error: null,
  checkoutCartId: null,
};

export function cartState(client: QueryClient): TCartState {
  return client.getQueryData<TCartState>(CART_STATE_KEY) ?? INITIAL_STATE;
}

export function setCartState(client: QueryClient, update: Partial<TCartState>) {
  client.setQueryData(CART_STATE_KEY, { ...cartState(client), ...update });
}

export function useCartState() {
  return useQuery({
    queryKey: CART_STATE_KEY,
    queryFn: () => INITIAL_STATE,
    initialData: INITIAL_STATE,
    enabled: false,
    gcTime: Infinity,
  }).data;
}

// These are transient timers and outstanding intentions, not a second cart.
// Keying them by QueryClient keeps SSR requests and isolated tests independent.
type TPendingWrites = {
  flushers: Set<() => void>;
  quantities: Map<string, { quantity: number }>;
};
const pendingWrites = new WeakMap<QueryClient, TPendingWrites>();

export function cartWrites(client: QueryClient): TPendingWrites {
  let writes = pendingWrites.get(client);
  if (!writes) {
    writes = { flushers: new Set(), quantities: new Map() };
    pendingWrites.set(client, writes);
  }
  return writes;
}

export function flushCartWrites(client: QueryClient) {
  for (const flush of cartWrites(client).flushers) flush();
}

export function publishCart(client: QueryClient, cart: CartResponseDto) {
  // A queued write must not publish corrections behind an open stock dialog.
  if (cartState(client).stock) return;
  let visibleCart = cart;
  for (const [sku, { quantity }] of cartWrites(client).quantities) {
    visibleCart = withLineQuantity(visibleCart, sku, quantity);
  }
  client.setQueryData(CART_QUERY_KEY, visibleCart);
}

export function stockConflictDetails(error: unknown) {
  if (!isApiError(error) || error.statusCode !== CONFLICT) return null;
  const result = stockDetailsSchema.safeParse(error.details);
  return result.success ? result.data : null;
}

export function isStockConflict(error: unknown): boolean {
  return stockConflictDetails(error) !== null;
}

export function recordStockConflict(
  client: QueryClient,
  error: unknown,
): boolean {
  const details = stockConflictDetails(error);
  if (!details) return false;
  const { sku, requested, available } = details;
  const cart = client.getQueryData<CartResponseDto | null>(CART_QUERY_KEY);
  const existing = cartState(client).stock?.changes ?? [];
  const change: StockChangeDto = {
    sku,
    name: cart?.lines.find((line) => line.sku === sku)?.name ?? sku,
    previous_quantity: requested,
    quantity: available,
    stock: available,
  };
  setCartState(client, {
    stock: {
      changes: [...existing.filter((item) => item.sku !== sku), change],
    },
    checkoutCartId: null,
  });
  return true;
}

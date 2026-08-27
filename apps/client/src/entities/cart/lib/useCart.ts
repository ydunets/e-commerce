import type { CartResponseDto } from '@e-commerce/contracts';
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { isApiError } from '@/shared/api';
import { type Debounced, debounce } from '@/shared/lib/debounce';
import { addCartItem } from '../api/addCartItem';
import { getCart } from '../api/getCart';
import { removeCartItem } from '../api/removeCartItem';
import { updateCartItem } from '../api/updateCartItem';
import { withLineQuantity } from './cartCache';
import { clearCartId, readCartId, storeCartId } from './cartStorage';

export const CART_QUERY_KEY = ['cart'] as const;

export const UPDATE_DEBOUNCE_MS = 300;

const NOT_FOUND = 404;

// A 404 means the stored id went stale (cart pruned, database reseeded).
// Discarding it reports "no cart yet"; the next add mints a fresh one, so the
// user never sees an error (ADR 0002).
async function fetchStoredCart(): Promise<CartResponseDto | null> {
  const cartId = readCartId();
  if (cartId === null) {
    return null;
  }

  try {
    return await getCart(cartId);
  } catch (error) {
    if (isApiError(error) && error.statusCode === NOT_FOUND) {
      clearCartId();
      return null;
    }
    throw error;
  }
}

export function useCart() {
  return useQuery({ queryKey: CART_QUERY_KEY, queryFn: fetchStoredCart });
}

export type AddToCartInput = {
  sku: string;
  quantity: number;
};

async function addWithSelfHeal(
  input: AddToCartInput,
): Promise<CartResponseDto> {
  const cartId = readCartId() ?? undefined;

  try {
    return await addCartItem({ cartId, ...input });
  } catch (error) {
    if (
      cartId !== undefined &&
      isApiError(error) &&
      error.statusCode === NOT_FOUND
    ) {
      clearCartId();
      return addCartItem(input);
    }
    throw error;
  }
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addWithSelfHeal,
    onSuccess: (cart) => {
      storeCartId(cart.id);
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export type UpdateCartLineInput = {
  cartId: string;
  sku: string;
  quantity: number;
};

// Module scope, not component state: a pending PATCH must survive its row
// unmounting (navigation away, removal re-render), or the user's last clicks
// silently never reach the server. A line's newest stamp invalidates any
// older in-flight response so it cannot overwrite fresher optimistic state.
const linePatchers = new Map<
  string,
  Debounced<[QueryClient, UpdateCartLineInput, number]>
>();
const patchStamps = new Map<string, number>();

function nextPatchStamp(sku: string): number {
  const stamp = (patchStamps.get(sku) ?? 0) + 1;
  patchStamps.set(sku, stamp);
  return stamp;
}

function sendLinePatch(
  queryClient: QueryClient,
  { cartId, sku, quantity }: UpdateCartLineInput,
  stamp: number,
): void {
  updateCartItem(cartId, sku, { quantity })
    .then((cart) => {
      if (patchStamps.get(sku) === stamp) {
        queryClient.setQueryData(CART_QUERY_KEY, cart);
      }
    })
    .catch(() => {
      if (patchStamps.get(sku) === stamp) {
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      }
    });
}

function linePatcher(sku: string) {
  const existing = linePatchers.get(sku);
  if (existing) {
    return existing;
  }
  const patcher = debounce(sendLinePatch, UPDATE_DEBOUNCE_MS);
  linePatchers.set(sku, patcher);
  return patcher;
}

function cancelPendingQuantityPatch(sku: string): void {
  linePatchers.get(sku)?.cancel();
  nextPatchStamp(sku);
}

/**
 * Debounced, optimistic quantity mutation: each call patches the cached cart
 * immediately, and one PATCH per line fires with the final absolute quantity
 * once the stepper has been idle for `UPDATE_DEBOUNCE_MS`.
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  const updateQuantity = (input: UpdateCartLineInput) => {
    const stamp = nextPatchStamp(input.sku);
    queryClient.setQueryData<CartResponseDto | null>(CART_QUERY_KEY, (cart) =>
      cart ? withLineQuantity(cart, input.sku, input.quantity) : cart,
    );
    linePatcher(input.sku)(queryClient, input, stamp);
  };

  return { updateQuantity };
}

export type RemoveCartLineInput = {
  cartId: string;
  sku: string;
};

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartId, sku }: RemoveCartLineInput) =>
      removeCartItem(cartId, sku),
    onMutate: ({ sku }) => {
      cancelPendingQuantityPatch(sku);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

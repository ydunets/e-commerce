import type { CartResponseDto } from '@e-commerce/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api';
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
const patchTimers = new Map<string, ReturnType<typeof setTimeout>>();
const patchStamps = new Map<string, number>();

function nextPatchStamp(sku: string): number {
  const stamp = (patchStamps.get(sku) ?? 0) + 1;
  patchStamps.set(sku, stamp);
  return stamp;
}

function cancelPendingQuantityPatch(sku: string): void {
  clearTimeout(patchTimers.get(sku));
  patchTimers.delete(sku);
  nextPatchStamp(sku);
}

/**
 * Debounced, optimistic quantity mutation: each call patches the cached cart
 * immediately, and one PATCH per line fires with the final absolute quantity
 * once the stepper has been idle for `UPDATE_DEBOUNCE_MS`.
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  const updateQuantity = ({ cartId, sku, quantity }: UpdateCartLineInput) => {
    const stamp = nextPatchStamp(sku);
    queryClient.setQueryData<CartResponseDto | null>(CART_QUERY_KEY, (cart) =>
      cart ? withLineQuantity(cart, sku, quantity) : cart,
    );

    clearTimeout(patchTimers.get(sku));
    patchTimers.set(
      sku,
      setTimeout(() => {
        patchTimers.delete(sku);
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
      }, UPDATE_DEBOUNCE_MS),
    );
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

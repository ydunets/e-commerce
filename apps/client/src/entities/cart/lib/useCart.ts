import type { CartResponseDto } from '@e-commerce/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { isApiError } from '@/shared/api';
import { type Debounced, debounce } from '@/shared/lib/debounce';
import { addCartItem } from '../api/addCartItem';
import { applyCoupon } from '../api/applyCoupon';
import { getCart } from '../api/getCart';
import { removeCartItem } from '../api/removeCartItem';
import { removeCoupon } from '../api/removeCoupon';
import { updateCartItem } from '../api/updateCartItem';
import { validateCart } from '../api/validateCart';
import { withLineQuantity } from './cartCache';
import {
  CART_QUERY_KEY,
  CART_MUTATION_SCOPE,
  cartState,
  cartWrites,
  flushCartWrites,
  publishCart,
  recordStockConflict,
  setCartState,
  useCartState,
} from './cartState';
import { clearCartId, readCartId, storeCartId } from './cartStorage';

export { CART_QUERY_KEY } from './cartState';

const UPDATE_DEBOUNCE_MS = 300;

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
      if (readCartId() === cartId) clearCartId();
      return null;
    }
    throw error;
  }
}

export function useCart() {
  const state = useCartState();
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: fetchStoredCart,
    enabled: !state.stock && !state.checking,
    staleTime: Infinity,
  });
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
    scope: CART_MUTATION_SCOPE,
    mutationFn: addWithSelfHeal,
    onMutate: async () => {
      setCartState(queryClient, { checkoutCartId: null });
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
    },
    onSuccess: (cart) => {
      storeCartId(cart.id);
      publishCart(queryClient, cart);
    },
    onError: (error) => {
      if (!recordStockConflict(queryClient, error)) {
        setCartState(queryClient, {
          error: "Couldn't add to cart. Please try again.",
        });
      }
    },
  });
}

type UpdateCartLineInput = {
  cartId: string;
  sku: string;
  quantity: number;
};

// One scope for every cart mutation: TanStack Query queues mutations sharing
// a scope id, so a settled response is always the newest server state and a
// remove can never race the line's own in-flight quantity patch.

/**
 * Debounced, optimistic quantity mutation: each call patches the cached cart
 * immediately, and one PATCH per line fires with the final absolute quantity
 * once the stepper has been idle for `UPDATE_DEBOUNCE_MS`. In-flight cart
 * refetches are cancelled so they cannot overwrite the optimistic value, and
 * unmounting flushes pending patches so the last clicks reach the server.
 */
export function useUpdateCartLine() {
  const queryClient = useQueryClient();

  const finishQuantity = (input: UpdateCartLineInput) => {
    const quantities = cartWrites(queryClient).quantities;
    if (quantities.get(input.sku) === input) quantities.delete(input.sku);
  };

  const mutation = useMutation({
    scope: CART_MUTATION_SCOPE,
    mutationFn: ({ cartId, sku, quantity }: UpdateCartLineInput) =>
      updateCartItem(cartId, sku, { quantity }),
    onSuccess: (cart, input) => {
      finishQuantity(input);
      publishCart(queryClient, cart);
    },
    onError: async (error, input) => {
      finishQuantity(input);
      if (!recordStockConflict(queryClient, error)) {
        setCartState(queryClient, {
          error: "Couldn't update your cart. Please try again.",
        });
        // A failed optimistic write must not survive into checkout.
        try {
          publishCart(queryClient, await getCart(input.cartId));
        } catch {
          /* Keep the visible failure until retry. */
        }
      }
    },
  });

  const patchersRef = useRef(
    new Map<string, Debounced<[UpdateCartLineInput]>>(),
  );
  const { mutate } = mutation;

  useEffect(() => {
    const patchers = patchersRef.current;
    const flush = () => {
      for (const patcher of patchers.values()) patcher.flush();
    };
    cartWrites(queryClient).flushers.add(flush);
    return () => {
      flush();
      cartWrites(queryClient).flushers.delete(flush);
    };
  }, [queryClient]);

  const linePatcher = (sku: string): Debounced<[UpdateCartLineInput]> => {
    const existing = patchersRef.current.get(sku);
    if (existing) {
      return existing;
    }
    const patcher = debounce(
      (input: UpdateCartLineInput) => mutate(input),
      UPDATE_DEBOUNCE_MS,
    );
    patchersRef.current.set(sku, patcher);
    return patcher;
  };

  const updateQuantity = (input: UpdateCartLineInput) => {
    const state = cartState(queryClient);
    if (state.checking || state.stock) return;
    setCartState(queryClient, { checkoutCartId: null, error: null });
    // Schedule synchronously: checkout in the same event turn must see this write.
    queryClient.cancelQueries({ queryKey: CART_QUERY_KEY }).catch(() => {});
    cartWrites(queryClient).quantities.set(input.sku, input);
    queryClient.setQueryData<CartResponseDto | null>(CART_QUERY_KEY, (cart) =>
      cart ? withLineQuantity(cart, input.sku, input.quantity) : cart,
    );
    linePatcher(input.sku)(input);
  };

  const cancelPending = (sku: string) => {
    patchersRef.current.get(sku)?.cancel();
    cartWrites(queryClient).quantities.delete(sku);
  };

  return { updateQuantity, cancelPending };
}

type RemoveCartLineInput = {
  cartId: string;
  sku: string;
};

export function useRemoveCartLine() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: CART_MUTATION_SCOPE,
    onMutate: async () => {
      setCartState(queryClient, { checkoutCartId: null });
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: () =>
      setCartState(queryClient, {
        error: "Couldn't remove the item. Please try again.",
      }),
    mutationFn: ({ cartId, sku }: RemoveCartLineInput) =>
      removeCartItem(cartId, sku),
    onSuccess: (cart) => {
      publishCart(queryClient, cart);
    },
  });
}

type CouponInput = {
  cartId: string;
  code: string;
};

// Coupon existence is the server's to answer, so neither mutation is
// optimistic: the applied coupons only ever come from a settled response.
export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: CART_MUTATION_SCOPE,
    onMutate: async () => {
      setCartState(queryClient, { checkoutCartId: null });
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: () =>
      setCartState(queryClient, {
        error: "Couldn't update your coupons. Please try again.",
      }),
    mutationFn: ({ cartId, code }: CouponInput) =>
      applyCoupon(cartId, { code }),
    onSuccess: (cart) => {
      publishCart(queryClient, cart);
    },
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: CART_MUTATION_SCOPE,
    onMutate: async () => {
      setCartState(queryClient, { checkoutCartId: null });
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: () =>
      setCartState(queryClient, {
        error: "Couldn't update your coupons. Please try again.",
      }),
    mutationFn: ({ cartId, code }: CouponInput) => removeCoupon(cartId, code),
    onSuccess: (cart) => {
      publishCart(queryClient, cart);
    },
  });
}

export function useCheckoutCart() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    scope: CART_MUTATION_SCOPE,
    mutationFn: async (cartId: string) => {
      // Earlier scoped writes may have failed while this validation was queued.
      const state = cartState(queryClient);
      if (state.stock || state.error) return false;
      const result = await validateCart(cartId);
      if (result.changes.length > 0) {
        setCartState(queryClient, {
          stock: { changes: result.changes, correctedCart: result.cart },
        });
        return false;
      }
      queryClient.setQueryData(CART_QUERY_KEY, result.cart);
      const canCheckout = result.cart.lines.length > 0;
      setCartState(queryClient, {
        checkoutCartId: canCheckout ? result.cart.id : null,
      });
      return canCheckout;
    },
    onError: () =>
      setCartState(queryClient, {
        error: "Couldn't validate your cart. Please try again.",
      }),
    onSettled: () => setCartState(queryClient, { checking: false }),
  });

  const checkout = async (cartId: string) => {
    const state = cartState(queryClient);
    if (state.checking || state.stock) return false;
    setCartState(queryClient, {
      checking: true,
      error: null,
      checkoutCartId: null,
    });
    await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
    flushCartWrites(queryClient);
    return mutation.mutateAsync(cartId);
  };

  return { checkout };
}

export function useAcknowledgeStock() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    scope: CART_MUTATION_SCOPE,
    mutationFn: async () => {
      const notice = cartState(queryClient).stock;
      if (!notice) return;
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const cartId = readCartId();
      // Write conflicts reject the write. Reconcile the persisted cart instead
      // of resubmitting a guessed quantity, which can race another stock change.
      const corrected =
        notice.correctedCart ??
        (cartId ? (await validateCart(cartId)).cart : null);
      queryClient.setQueryData(CART_QUERY_KEY, corrected);
      setCartState(queryClient, {
        stock: null,
        error: null,
        checkoutCartId: null,
      });
    },
    onError: () =>
      setCartState(queryClient, {
        error: "Couldn't refresh stock. Please try again.",
      }),
  });

  const acknowledge = () => {
    if (mutation.isPending) return;
    flushCartWrites(queryClient);
    mutation.mutate();
  };
  return { acknowledge, isPending: mutation.isPending };
}

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
import { withLineQuantity } from './cartCache';
import { clearCartId, readCartId, storeCartId } from './cartStorage';

export const CART_QUERY_KEY = ['cart'] as const;

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

type UpdateCartLineInput = {
  cartId: string;
  sku: string;
  quantity: number;
};

// One scope for every cart mutation: TanStack Query queues mutations sharing
// a scope id, so a settled response is always the newest server state and a
// remove can never race the line's own in-flight quantity patch.
const CART_MUTATION_SCOPE = { id: 'cart' } as const;

/**
 * Debounced, optimistic quantity mutation: each call patches the cached cart
 * immediately, and one PATCH per line fires with the final absolute quantity
 * once the stepper has been idle for `UPDATE_DEBOUNCE_MS`. In-flight cart
 * refetches are cancelled so they cannot overwrite the optimistic value, and
 * unmounting flushes pending patches so the last clicks reach the server.
 */
export function useUpdateCartLine() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    scope: CART_MUTATION_SCOPE,
    mutationFn: ({ cartId, sku, quantity }: UpdateCartLineInput) =>
      updateCartItem(cartId, sku, { quantity }),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const patchersRef = useRef(
    new Map<string, Debounced<[UpdateCartLineInput]>>(),
  );
  const { mutate } = mutation;

  useEffect(() => {
    const patchers = patchersRef.current;
    return () => {
      for (const patcher of patchers.values()) {
        patcher.flush();
      }
    };
  }, []);

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
    void queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
    queryClient.setQueryData<CartResponseDto | null>(CART_QUERY_KEY, (cart) =>
      cart ? withLineQuantity(cart, input.sku, input.quantity) : cart,
    );
    linePatcher(input.sku)(input);
  };

  const cancelPending = (sku: string) => {
    patchersRef.current.get(sku)?.cancel();
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
    mutationFn: ({ cartId, sku }: RemoveCartLineInput) =>
      removeCartItem(cartId, sku),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
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
    mutationFn: ({ cartId, code }: CouponInput) =>
      applyCoupon(cartId, { code }),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: CART_MUTATION_SCOPE,
    mutationFn: ({ cartId, code }: CouponInput) => removeCoupon(cartId, code),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

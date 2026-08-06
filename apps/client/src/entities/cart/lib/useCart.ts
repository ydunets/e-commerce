import type { CartResponseDto } from '@e-commerce/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api';
import { addCartItem } from '../api/addCartItem';
import { getCart } from '../api/getCart';
import { clearCartId, readCartId, storeCartId } from './cartStorage';

export const CART_QUERY_KEY = ['cart'] as const;

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

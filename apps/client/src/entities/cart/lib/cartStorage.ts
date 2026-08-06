// Only the identifier lives on the device; the cart contents stay on the
// server (ADR 0002). Mirrored in apps/e2e/tests/cart.spec.ts.
const CART_ID_STORAGE_KEY = 'stylenest.cart-id';

export function readCartId(): string | null {
  return localStorage.getItem(CART_ID_STORAGE_KEY);
}

export function storeCartId(cartId: string): void {
  localStorage.setItem(CART_ID_STORAGE_KEY, cartId);
}

export function clearCartId(): void {
  localStorage.removeItem(CART_ID_STORAGE_KEY);
}

import type { CartResponseDto } from '@e-commerce/contracts';
import { apiDelete } from '@/shared/api';

export function removeCartItem(
  cartId: string,
  sku: string,
): Promise<CartResponseDto> {
  return apiDelete<CartResponseDto>(`/v1/carts/${cartId}/items/${sku}`);
}

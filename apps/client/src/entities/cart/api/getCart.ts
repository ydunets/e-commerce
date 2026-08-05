import type { CartResponseDto } from '@e-commerce/contracts';
import { apiGet } from '@/shared/api';

export function getCart(cartId: string): Promise<CartResponseDto> {
  return apiGet<CartResponseDto>(`/v1/carts/${cartId}`);
}

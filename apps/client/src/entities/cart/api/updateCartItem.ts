import type {
  CartResponseDto,
  UpdateCartItemBodyDto,
} from '@e-commerce/contracts';
import { apiPatch } from '@/shared/api';

export function updateCartItem(
  cartId: string,
  sku: string,
  body: UpdateCartItemBodyDto,
): Promise<CartResponseDto> {
  return apiPatch<CartResponseDto>(`/v1/carts/${cartId}/items/${sku}`, body);
}

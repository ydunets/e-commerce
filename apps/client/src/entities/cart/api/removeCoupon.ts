import type { CartResponseDto } from '@e-commerce/contracts';
import { apiDelete } from '@/shared/api';

export function removeCoupon(
  cartId: string,
  code: string,
): Promise<CartResponseDto> {
  return apiDelete<CartResponseDto>(
    `/v1/carts/${cartId}/coupons/${encodeURIComponent(code)}`,
  );
}

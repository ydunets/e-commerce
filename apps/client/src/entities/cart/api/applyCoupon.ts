import type {
  ApplyCouponBodyDto,
  CartResponseDto,
} from '@e-commerce/contracts';
import { apiPost } from '@/shared/api';

export function applyCoupon(
  cartId: string,
  body: ApplyCouponBodyDto,
): Promise<CartResponseDto> {
  return apiPost<CartResponseDto>(`/v1/carts/${cartId}/coupons`, body);
}

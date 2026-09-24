import type { ValidateCartResponseDto } from '@e-commerce/contracts';
import { apiPost } from '@/shared/api';

export function validateCart(cartId: string): Promise<ValidateCartResponseDto> {
  return apiPost<ValidateCartResponseDto>(`/v1/carts/${cartId}/validate`, {});
}

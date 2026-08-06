import type {
  AddCartItemBodyDto,
  CartResponseDto,
} from '@e-commerce/contracts';
import { apiPost } from '@/shared/api';

export function addCartItem(
  body: AddCartItemBodyDto,
): Promise<CartResponseDto> {
  return apiPost<CartResponseDto>('/v1/carts/items', body);
}

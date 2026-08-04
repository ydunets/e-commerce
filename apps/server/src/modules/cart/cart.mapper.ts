import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import type { CartResponseDto } from '#src/modules/cart/dtos/cart.response.dto.ts';

export interface CartMapper {
  toResponse(cart: CartEntity): CartResponseDto;
}

export default function cartMapper(): CartMapper {
  return {
    toResponse(cart: CartEntity): CartResponseDto {
      return {
        id: cart.id,
        lines: cart.lines.map(({ sku, quantity }) => ({ sku, quantity })),
        totalUnits: cart.lines.reduce((units, line) => units + line.quantity, 0),
      };
    },
  };
}

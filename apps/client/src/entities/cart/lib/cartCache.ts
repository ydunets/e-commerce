import type { CartResponseDto } from '@e-commerce/contracts';

export function withLineQuantity(
  cart: CartResponseDto,
  sku: string,
  quantity: number,
): CartResponseDto {
  const lines = cart.lines.map((line) =>
    line.sku === sku ? { ...line, quantity } : line,
  );
  return {
    ...cart,
    lines,
    totalUnits: lines.reduce((units, line) => units + line.quantity, 0),
  };
}

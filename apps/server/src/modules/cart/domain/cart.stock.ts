import type { EnrichedCartLine, StockChange } from '#src/modules/cart/domain/cart.types.ts';
import { ConflictException } from '#src/shared/exceptions/index.ts';

export function assertWithinStock(sku: string, quantity: number, stock: number): void {
  if (quantity > stock) {
    // The metadata reaches the client as the 409 envelope's `details`, so the
    // insufficient-stock modal can render without a follow-up request.
    throw new ConflictException(
      `Requested quantity ${quantity} of ${sku} exceeds the available stock of ${stock}`,
      undefined,
      { sku, requested: quantity, available: stock },
    );
  }
}

/** Lines whose quantity now exceeds stock, clamped to it (0 removes the line). */
export function reconcileCartStock(lines: EnrichedCartLine[]): StockChange[] {
  return lines
    .filter((line) => line.quantity > line.stock)
    .map((line) => ({
      sku: line.sku,
      name: line.name,
      previousQuantity: line.quantity,
      quantity: line.stock,
      stock: line.stock,
    }));
}

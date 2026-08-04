import { ConflictException } from '#src/shared/exceptions/index.ts';

export function assertWithinStock(sku: string, quantity: number, stock: number): void {
  if (quantity > stock) {
    throw new ConflictException(
      `Requested quantity ${quantity} of ${sku} exceeds the available stock of ${stock}`,
    );
  }
}

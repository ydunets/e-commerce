import { randomUUID } from 'node:crypto';
import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';

export function createCart(): CartEntity {
  return {
    id: randomUUID(),
    createdAt: new Date(),
    lines: [],
  };
}

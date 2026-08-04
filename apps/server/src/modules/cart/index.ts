import type { CartMapper } from '#src/modules/cart/cart.mapper.ts';
import type { CartRepository } from '#src/modules/cart/database/cart.repository.port.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

declare global {
  export interface Dependencies {
    cartMapper: CartMapper;
    cartRepository: CartRepository;
  }
}

export const cartActionCreator = actionCreatorFactory('cart');

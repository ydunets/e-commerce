import type { CartMapper } from '#src/modules/cart/cart.mapper';
import type { CartRepository } from '#src/modules/cart/database/cart.repository.port';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator';

declare global {
  export interface Dependencies {
    cartMapper: CartMapper;
    cartRepository: CartRepository;
  }
}

export const cartActionCreator = actionCreatorFactory('cart');

import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { cartActionCreator } from '#src/modules/cart/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type GetCartResult = CartEntity;

export const getCartQuery = cartActionCreator<{ cartId: string }, GetCartResult>('get-cart');

export default function makeGetCartQuery({ queryBus, cartRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof getCartQuery>): Promise<GetCartResult> {
      const cart = await cartRepository.findOneById(payload.cartId);
      if (!cart) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }
      return cart;
    },
    init() {
      queryBus.register(getCartQuery.type, this.handler);
    },
  };
}

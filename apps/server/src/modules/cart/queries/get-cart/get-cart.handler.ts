import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '#src/modules/cart/database/cart.repository.port';
import { NotFoundException } from '#src/shared/exceptions/index';
import { GetCartQuery, type GetCartResult } from './get-cart.query.js';

@QueryHandler(GetCartQuery)
export class GetCartHandler implements IQueryHandler<GetCartQuery> {
  constructor(@Inject(CART_REPOSITORY) private readonly repository: CartRepository) {}
  async execute({ payload }: GetCartQuery): Promise<GetCartResult> {
    const cart = await this.repository.findOneById(payload.cartId);
    if (!cart) {
      throw new NotFoundException(`Cart ${payload.cartId} not found`);
    }
    return cart;
  }
}

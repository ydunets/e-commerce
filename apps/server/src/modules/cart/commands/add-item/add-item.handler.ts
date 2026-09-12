import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '#src/modules/cart/database/cart.repository.port';
import { createCart } from '#src/modules/cart/domain/cart.factory';
import { assertWithinStock } from '#src/modules/cart/domain/cart.stock';
import type { CartEntity } from '#src/modules/cart/domain/cart.types';
import {
  GetInventoryStockQuery,
  type GetInventoryStockResult,
} from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.query';
import { NotFoundException } from '#src/shared/exceptions/index';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { AddItemCommand, type AddItemResult } from './add-item.command.js';

@CommandHandler(AddItemCommand)
export class AddItemHandler implements ICommandHandler<AddItemCommand> {
  constructor(
    @Inject(CART_REPOSITORY) private readonly repository: CartRepository,
    @Inject(ApplicationDispatcher)
    private readonly queries: {
      query(query: GetInventoryStockQuery): Promise<GetInventoryStockResult>;
    },
  ) {}
  async execute({ payload, meta }: AddItemCommand): Promise<AddItemResult> {
    const stockLevel = await this.queries.query(
      new GetInventoryStockQuery({ sku: payload.sku }, meta),
    );
    if (!stockLevel) {
      throw new NotFoundException(`Inventory item ${payload.sku} not found`);
    }

    let existingCart: CartEntity | undefined;
    if (payload.cartId !== undefined) {
      existingCart = await this.repository.findOneById(payload.cartId);
      if (!existingCart) {
        throw new NotFoundException(`Cart ${payload.cartId} not found`);
      }
    }

    const existingLine = existingCart?.lines.find((line) => line.sku === payload.sku);
    const quantity = (existingLine?.quantity ?? 0) + payload.quantity;
    // ponytail: read-then-write stock check; lock the inventory row if
    // concurrent adds to one cart ever matter.
    assertWithinStock(payload.sku, quantity, stockLevel.stock);

    // The implicit mint happens only after all checks pass, so a rejected
    // first add never leaves an orphan empty cart behind (ADR 0002).
    const cart = existingCart ?? createCart();
    if (!existingCart) {
      await this.repository.insert(cart);
    }

    await this.repository.upsertLine(cart.id, payload.sku, quantity);

    // Re-read instead of patching in memory: a freshly added line needs the
    // read model's joined product data, which only the repository has.
    const persisted = await this.repository.findOneById(cart.id);
    if (!persisted) {
      throw new NotFoundException(`Cart ${cart.id} not found`);
    }
    return persisted;
  }
}

import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '#src/modules/cart/database/cart.repository.port';
import { assertWithinStock } from '#src/modules/cart/domain/cart.stock';
import {
  GetInventoryStockQuery,
  type GetInventoryStockResult,
} from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.query';
import { NotFoundException } from '#src/shared/exceptions/index';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { UpdateItemCommand, type UpdateItemResult } from './update-item.command.js';

@CommandHandler(UpdateItemCommand)
export class UpdateItemHandler implements ICommandHandler<UpdateItemCommand> {
  constructor(
    @Inject(CART_REPOSITORY) private readonly repository: CartRepository,
    @Inject(ApplicationDispatcher)
    private readonly queries: {
      query(query: GetInventoryStockQuery): Promise<GetInventoryStockResult>;
    },
  ) {}
  async execute({ payload, meta }: UpdateItemCommand): Promise<UpdateItemResult> {
    const cart = await this.repository.findOneById(payload.cartId);
    if (!cart) {
      throw new NotFoundException(`Cart ${payload.cartId} not found`);
    }
    if (!cart.lines.some((line) => line.sku === payload.sku)) {
      throw new NotFoundException(`Cart line ${payload.sku} not found`);
    }

    const stockLevel = await this.queries.query(
      new GetInventoryStockQuery({ sku: payload.sku }, meta),
    );
    if (!stockLevel) {
      throw new NotFoundException(`Inventory item ${payload.sku} not found`);
    }
    assertWithinStock(payload.sku, payload.quantity, stockLevel.stock);

    await this.repository.upsertLine(payload.cartId, payload.sku, payload.quantity);
    return {
      ...cart,
      lines: cart.lines.map((line) =>
        line.sku === payload.sku
          ? { ...line, quantity: payload.quantity, stock: stockLevel.stock }
          : line,
      ),
    };
  }
}

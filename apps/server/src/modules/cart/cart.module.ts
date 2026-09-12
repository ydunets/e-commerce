import { Module } from '@nestjs/common';
import { SharedModule } from '#src/shared/nest/shared.module';
import { CartController } from './cart.controller.js';
import { AddItemHandler } from './commands/add-item/add-item.handler.js';
import { ApplyCouponHandler } from './commands/apply-coupon/apply-coupon.handler.js';
import { RemoveCouponHandler } from './commands/remove-coupon/remove-coupon.handler.js';
import { RemoveItemHandler } from './commands/remove-item/remove-item.handler.js';
import { UpdateItemHandler } from './commands/update-item/update-item.handler.js';
import { ValidateStockHandler } from './commands/validate-stock/validate-stock.handler.js';
import { PostgresCartRepository } from './database/cart.repository.js';
import { CART_REPOSITORY } from './database/cart.repository.port.js';
import { GetCartHandler } from './queries/get-cart/get-cart.handler.js';
@Module({
  imports: [SharedModule],
  controllers: [CartController],
  providers: [
    AddItemHandler,
    UpdateItemHandler,
    RemoveItemHandler,
    ApplyCouponHandler,
    RemoveCouponHandler,
    ValidateStockHandler,
    GetCartHandler,
    { provide: CART_REPOSITORY, useClass: PostgresCartRepository },
  ],
})
export class CartModule {}

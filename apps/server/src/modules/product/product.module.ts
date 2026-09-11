import { Module } from '@nestjs/common';
import { SharedModule } from '#src/shared/nest/shared.module';
import { PostgresProductRepository } from './database/product.repository.js';
import { PRODUCT_REPOSITORY } from './database/product.repository.port.js';
import { ProductController } from './product.controller.js';
import { FindProductHandler } from './queries/find-product/find-product.handler.js';
import { GetInventoryStockHandler } from './queries/get-inventory-stock/get-inventory-stock.handler.js';
import { ListProductsHandler } from './queries/list-products/list-products.handler.js';

@Module({
  imports: [SharedModule],
  controllers: [ProductController],
  providers: [
    FindProductHandler,
    ListProductsHandler,
    GetInventoryStockHandler,
    { provide: PRODUCT_REPOSITORY, useClass: PostgresProductRepository },
  ],
})
export class ProductModule {}

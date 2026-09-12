import { Controller, Get, Param, Query } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { toProductListItemResponse, toProductResponse } from './product.mapper.js';
import { FindProductQuery } from './queries/find-product/find-product.query.js';
import {
  type FindProductParams,
  findProductParamsSchema,
} from './queries/find-product/find-product.schema.js';
import { ListProductsQuery } from './queries/list-products/list-products.query.js';
import {
  type ListProductsQuerystring,
  listProductsQuerystringSchema,
} from './queries/list-products/list-products.schema.js';

@Controller('api/v1/products')
export class ProductController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Get()
  @RouteSchema({
    description: 'List products newest-first with per-colour card data',
    tags: ['products'],
  })
  async list(@Query({ schema: listProductsQuerystringSchema }) query: ListProductsQuerystring) {
    const products = await this.dispatcher.query(new ListProductsQuery(query));
    return products.map(toProductListItemResponse);
  }

  @Get(':id')
  @RouteSchema({ description: 'Get a product by id', tags: ['products'] })
  async find(@Param({ schema: findProductParamsSchema }) params: FindProductParams) {
    return toProductResponse(await this.dispatcher.query(new FindProductQuery(params)));
  }
}

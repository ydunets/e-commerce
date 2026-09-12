import { productListItemDtoSchema, productResponseDtoSchema } from '@e-commerce/contracts';
import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiContract } from '#src/shared/nest/api-contract';
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
  @ApiOperation({
    description: 'List products newest-first with per-colour card data',
    tags: ['products'],
  })
  @ApiContract({
    response: productListItemDtoSchema.array(),
    errors: [HttpStatus.BAD_REQUEST],
  })
  async list(@Query({ schema: listProductsQuerystringSchema }) query: ListProductsQuerystring) {
    const products = await this.dispatcher.query(new ListProductsQuery(query));
    return products.map(toProductListItemResponse);
  }

  @Get(':id')
  @ApiOperation({ description: 'Get a product by id', tags: ['products'] })
  @ApiContract({
    response: productResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  async find(@Param({ schema: findProductParamsSchema }) params: FindProductParams) {
    return toProductResponse(await this.dispatcher.query(new FindProductQuery(params)));
  }
}

import {
  type AddCartItemBodyDto,
  type ApplyCouponBodyDto,
  cartResponseDtoSchema,
  type UpdateCartItemBodyDto,
  validateCartResponseDtoSchema,
} from '@e-commerce/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { z } from 'zod';
import { ApiContract } from '#src/shared/nest/api-contract';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { toCartResponse, toValidateCartResponse } from './cart.mapper.js';
import {
  addCartItemBodySchema,
  applyCouponBodySchema,
  cartCouponParamsSchema,
  cartLineParamsSchema,
  cartParamsSchema,
  updateCartItemBodySchema,
} from './cart.schema.js';
import { AddItemCommand } from './commands/add-item/add-item.command.js';
import { ApplyCouponCommand } from './commands/apply-coupon/apply-coupon.command.js';
import { RemoveCouponCommand } from './commands/remove-coupon/remove-coupon.command.js';
import { RemoveItemCommand } from './commands/remove-item/remove-item.command.js';
import { UpdateItemCommand } from './commands/update-item/update-item.command.js';
import { ValidateStockCommand } from './commands/validate-stock/validate-stock.command.js';
import { GetCartQuery } from './queries/get-cart/get-cart.query.js';

@Controller('api/v1/carts')
export class CartController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Add an inventory item to a cart; omitting cartId creates the cart implicitly',
    tags: ['cart'],
  })
  @ApiContract({
    response: cartResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.CONFLICT],
  })
  async addItem(@Body({ schema: addCartItemBodySchema }) body: AddCartItemBodyDto) {
    const result = await this.dispatcher.execute(new AddItemCommand(body));
    return toCartResponse(result);
  }

  @Get(':cartId')
  @ApiOperation({ description: "Get a cart's lines and computed total units", tags: ['cart'] })
  @ApiContract({
    response: cartResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  async getCart(@Param({ schema: cartParamsSchema }) params: z.infer<typeof cartParamsSchema>) {
    const result = await this.dispatcher.query(new GetCartQuery(params));
    return toCartResponse(result);
  }

  @Patch(':cartId/items/:sku')
  @ApiOperation({ description: "Set a cart line's quantity", tags: ['cart'] })
  @ApiContract({
    response: cartResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.CONFLICT],
  })
  async updateItem(
    @Param({ schema: cartLineParamsSchema }) params: z.infer<typeof cartLineParamsSchema>,
    @Body({ schema: updateCartItemBodySchema }) body: UpdateCartItemBodyDto,
  ) {
    const result = await this.dispatcher.execute(new UpdateItemCommand({ ...params, ...body }));
    return toCartResponse(result);
  }

  @Delete(':cartId/items/:sku')
  @ApiOperation({
    description: 'Remove a line from the cart; the cart itself survives empty',
    tags: ['cart'],
  })
  @ApiContract({
    response: cartResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  async removeItem(
    @Param({ schema: cartLineParamsSchema }) params: z.infer<typeof cartLineParamsSchema>,
  ) {
    const result = await this.dispatcher.execute(new RemoveItemCommand(params));
    return toCartResponse(result);
  }

  @Post(':cartId/coupons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Apply a coupon code to the cart; re-applying an applied code is a no-op',
    tags: ['cart'],
  })
  @ApiContract({
    response: cartResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  async applyCoupon(
    @Param({ schema: cartParamsSchema }) params: z.infer<typeof cartParamsSchema>,
    @Body({ schema: applyCouponBodySchema }) body: ApplyCouponBodyDto,
  ) {
    const result = await this.dispatcher.execute(new ApplyCouponCommand({ ...params, ...body }));
    return toCartResponse(result);
  }

  @Delete(':cartId/coupons/:code')
  @ApiOperation({ description: 'Remove an applied coupon from the cart', tags: ['cart'] })
  @ApiContract({
    response: cartResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  async removeCoupon(
    @Param({ schema: cartCouponParamsSchema }) params: z.infer<typeof cartCouponParamsSchema>,
  ) {
    const result = await this.dispatcher.execute(new RemoveCouponCommand(params));
    return toCartResponse(result);
  }

  @Post(':cartId/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description:
      'Reconcile every cart line against current stock, clamping or removing oversold lines; answers the corrected cart plus the applied changes',
    tags: ['cart'],
  })
  @ApiContract({
    response: validateCartResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND],
  })
  async validateStock(
    @Param({ schema: cartParamsSchema }) params: z.infer<typeof cartParamsSchema>,
  ) {
    const result = await this.dispatcher.execute(new ValidateStockCommand(params));
    return toValidateCartResponse(result.cart, result.changes);
  }
}

import { subscribeResponseDtoSchema } from '@e-commerce/contracts';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { toSubscribeResponse } from '#src/modules/newsletter/newsletter.mapper';
import { ApiContract } from '#src/shared/nest/api-contract';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { SubscribeCommand } from './subscribe.handler.js';
import { type SubscribeBody, subscribeBodySchema } from './subscribe.schema.js';

@Controller('api/v1/newsletter/subscriptions')
export class SubscribeController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Subscribe an email address to the newsletter',
    tags: ['newsletter'],
  })
  @ApiContract({
    response: subscribeResponseDtoSchema,
    errors: [HttpStatus.BAD_REQUEST],
  })
  async subscribe(@Body({ schema: subscribeBodySchema }) body: SubscribeBody) {
    await this.dispatcher.execute(new SubscribeCommand({ email: body.email }));
    return toSubscribeResponse();
  }
}

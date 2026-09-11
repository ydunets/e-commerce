import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { toSubscribeResponse } from '#src/modules/newsletter/newsletter.mapper';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { SubscribeCommand } from './subscribe.handler.js';
import { type SubscribeBody, subscribeBodySchema } from './subscribe.schema.js';

@Controller('api/v1/newsletter/subscriptions')
export class SubscribeController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RouteSchema({
    description: 'Subscribe an email address to the newsletter',
    tags: ['newsletter'],
  })
  async subscribe(@Body({ schema: subscribeBodySchema }) body: SubscribeBody) {
    await this.dispatcher.execute(new SubscribeCommand({ email: body.email }));
    return toSubscribeResponse();
  }
}

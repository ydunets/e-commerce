import { Module } from '@nestjs/common';
import { SharedModule } from '#src/shared/nest/shared.module';
import { SubscribeController } from './commands/subscribe/subscribe.controller.js';
import { SubscribeHandler } from './commands/subscribe/subscribe.handler.js';
import { PostgresSubscriberRepository } from './database/subscriber.repository.js';
import { SUBSCRIBER_REPOSITORY } from './database/subscriber.repository.port.js';

@Module({
  imports: [SharedModule],
  controllers: [SubscribeController],
  providers: [
    SubscribeHandler,
    { provide: SUBSCRIBER_REPOSITORY, useClass: PostgresSubscriberRepository },
  ],
})
export class NewsletterModule {}

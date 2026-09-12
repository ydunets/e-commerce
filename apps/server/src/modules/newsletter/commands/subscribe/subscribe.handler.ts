import { Inject } from '@nestjs/common';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  SUBSCRIBER_REPOSITORY,
  type SubscriberRepository,
} from '#src/modules/newsletter/database/subscriber.repository.port';
import { SubscriberAlreadyExistsException } from '#src/modules/newsletter/domain/subscriber.errors';
import { createSubscriber } from '#src/modules/newsletter/domain/subscriber.factory';
import type { Meta } from '#src/shared/cqrs/action.types';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';

export class SubscribeCommand extends Command<undefined> {
  static readonly type = 'newsletter/subscribe';
  readonly type = SubscribeCommand.type;
  constructor(
    readonly payload: { email: string },
    readonly meta?: Meta,
  ) {
    super();
  }
}

export class SubscribedEvent {
  static readonly type = 'newsletter/subscribed';
  readonly type = SubscribedEvent.type;
  constructor(
    readonly payload: { subscriberId: string; email: string },
    readonly meta?: Meta,
  ) {}
}

@CommandHandler(SubscribeCommand)
export class SubscribeHandler implements ICommandHandler<SubscribeCommand> {
  constructor(
    @Inject(SUBSCRIBER_REPOSITORY) private readonly repository: SubscriberRepository,
    @Inject(ApplicationDispatcher) private readonly events: Pick<ApplicationDispatcher, 'publish'>,
  ) {}

  async execute(command: SubscribeCommand): Promise<undefined> {
    const subscriber = createSubscriber(command.payload.email);
    try {
      await this.repository.insert(subscriber);
    } catch (error) {
      if (error instanceof SubscriberAlreadyExistsException) return;
      throw error;
    }
    this.events.publish(
      new SubscribedEvent({ subscriberId: subscriber.id, email: subscriber.email }),
    );
  }
}

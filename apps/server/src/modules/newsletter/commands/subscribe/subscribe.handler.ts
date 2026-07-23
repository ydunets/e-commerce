import { SubscriberAlreadyExistsException } from '#src/modules/newsletter/domain/subscriber.errors.ts';
import { createSubscriber } from '#src/modules/newsletter/domain/subscriber.factory.ts';
import { newsletterActionCreator } from '#src/modules/newsletter/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export type SubscribeResult = undefined;

export const subscribeCommand = newsletterActionCreator<{ email: string }, SubscribeResult>(
  'subscribe',
);

export const subscribedEvent = newsletterActionCreator<{ subscriberId: string; email: string }>(
  'subscribed',
);

export default function makeSubscribe({
  commandBus,
  eventBus,
  subscriberRepository,
}: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof subscribeCommand>): Promise<SubscribeResult> {
      const subscriber = createSubscriber(payload.email);

      try {
        await subscriberRepository.insert(subscriber);
      } catch (error) {
        if (error instanceof SubscriberAlreadyExistsException) {
          return;
        }
        throw error;
      }

      eventBus.emit(subscribedEvent({ subscriberId: subscriber.id, email: subscriber.email }));
    },
    init() {
      commandBus.register(subscribeCommand.type, this.handler);
    },
  };
}

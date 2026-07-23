import type { SubscriberEntity } from '#src/modules/newsletter/domain/subscriber.types.ts';

export interface SubscriberRepository {
  /**
   * Inserts a subscriber. Throws `SubscriberAlreadyExistsException` when the
   * email is already subscribed instead of returning a sentinel value, so
   * the idempotency policy (swallow vs propagate) stays a handler decision.
   */
  insert(subscriber: SubscriberEntity): Promise<void>;
}

import { randomUUID } from 'node:crypto';
import type { SubscriberEntity } from '#src/modules/newsletter/domain/subscriber.types.ts';

export function createSubscriber(email: string): SubscriberEntity {
  const now = new Date();
  return {
    id: randomUUID(),
    email: email.trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };
}

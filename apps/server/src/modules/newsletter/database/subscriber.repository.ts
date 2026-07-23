import postgres from 'postgres';
import type { SubscriberRepository } from '#src/modules/newsletter/database/subscriber.repository.port.ts';
import { SubscriberAlreadyExistsException } from '#src/modules/newsletter/domain/subscriber.errors.ts';
import type { SubscriberEntity } from '#src/modules/newsletter/domain/subscriber.types.ts';

const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return error instanceof postgres.PostgresError && error.code === POSTGRES_UNIQUE_VIOLATION;
}

export default function subscriberRepository({ db }: Dependencies): SubscriberRepository {
  return {
    async insert(subscriber: SubscriberEntity): Promise<void> {
      try {
        await db`
          INSERT INTO subscribers (id, "createdAt", "updatedAt", email)
          VALUES (${subscriber.id}, ${subscriber.createdAt}, ${subscriber.updatedAt}, ${subscriber.email})
        `;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new SubscriberAlreadyExistsException(subscriber.email);
        }
        throw error;
      }
    },
  };
}

import { Inject, Injectable } from '@nestjs/common';
import postgres from 'postgres';
import type { SubscriberRepository } from '#src/modules/newsletter/database/subscriber.repository.port';
import { SubscriberAlreadyExistsException } from '#src/modules/newsletter/domain/subscriber.errors';
import type { SubscriberEntity } from '#src/modules/newsletter/domain/subscriber.types';
import { DATABASE, type Database } from '#src/shared/db/tokens';

const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return error instanceof postgres.PostgresError && error.code === POSTGRES_UNIQUE_VIOLATION;
}

@Injectable()
export class PostgresSubscriberRepository implements SubscriberRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async insert(subscriber: SubscriberEntity): Promise<void> {
    try {
      await this.db`
          INSERT INTO subscribers (id, "createdAt", "updatedAt", email)
          VALUES (${subscriber.id}, ${subscriber.createdAt}, ${subscriber.updatedAt}, ${subscriber.email})
        `;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new SubscriberAlreadyExistsException(subscriber.email);
      }
      throw error;
    }
  }
}

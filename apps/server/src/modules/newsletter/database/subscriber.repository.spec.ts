import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import postgres from 'postgres';
import { SubscriberAlreadyExistsException } from '#src/modules/newsletter/domain/subscriber.errors.ts';
import subscriberRepository from './subscriber.repository.ts';

const subscriber = {
  id: 'sub-1',
  email: 'jane@example.com',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function fakeDb(behavior: () => Promise<unknown[]>): Dependencies['db'] {
  return (() => behavior()) as unknown as Dependencies['db'];
}

// The published .d.ts models `PostgresError` after the built-in `Error(message)`
// constructor, but the driver actually constructs it from a parsed protocol
// object (`Object.assign(this, x)` in postgres/src/errors.js) whose fields
// include `code`. The cast bridges that typing gap for the fake error below.
function fakePostgresError(code: string, message: string): postgres.PostgresError {
  return new postgres.PostgresError({ code, message } as never);
}

describe('subscriberRepository().insert()', () => {
  it('inserts the subscriber row', async () => {
    let queried = '';
    const db = ((strings: TemplateStringsArray) => {
      queried = strings.join('?');
      return Promise.resolve([]);
    }) as unknown as Dependencies['db'];

    await subscriberRepository({ db } as never).insert(subscriber);

    assert.match(queried, /INSERT INTO subscribers/);
  });

  it('translates a unique-violation into SubscriberAlreadyExistsException', async () => {
    const uniqueViolation = fakePostgresError(
      '23505',
      'duplicate key value violates unique constraint',
    );
    const db = fakeDb(() => Promise.reject(uniqueViolation));

    await assert.rejects(
      () => subscriberRepository({ db } as never).insert(subscriber),
      SubscriberAlreadyExistsException,
    );
  });

  it('propagates other database errors unchanged', async () => {
    const connectionError = fakePostgresError('08000', 'connection exception');
    const db = fakeDb(() => Promise.reject(connectionError));

    await assert.rejects(
      () => subscriberRepository({ db } as never).insert(subscriber),
      (error: unknown) => error === connectionError,
    );
  });
});

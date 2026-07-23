import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SubscriberAlreadyExistsException } from '#src/modules/newsletter/domain/subscriber.errors.ts';
import makeSubscribe, { subscribeCommand, subscribedEvent } from './subscribe.handler.ts';

describe('subscribeCommand handler', () => {
  it('inserts a new Subscriber and emits the subscribed event', async () => {
    const inserted: unknown[] = [];
    const subscriberRepository = {
      insert: async (subscriber: unknown) => {
        inserted.push(subscriber);
      },
    };
    const emitted: unknown[] = [];
    const eventBus = { emit: (event: unknown) => void emitted.push(event) };

    const { handler } = makeSubscribe({ eventBus, subscriberRepository } as never);

    await handler({ payload: { email: 'Jane@Example.com' } } as never);

    assert.equal(inserted.length, 1);
    assert.equal((inserted[0] as { email: string }).email, 'jane@example.com');
    assert.equal(emitted.length, 1);
    assert.equal((emitted[0] as { type: string }).type, subscribedEvent.type);
    assert.equal((emitted[0] as { payload: { email: string } }).payload.email, 'jane@example.com');
  });

  it('resolves successfully and does not emit again when the email is already subscribed', async () => {
    let insertAttempts = 0;
    const subscriberRepository = {
      insert: async () => {
        insertAttempts += 1;
        throw new SubscriberAlreadyExistsException('jane@example.com');
      },
    };
    const emitted: unknown[] = [];
    const eventBus = { emit: (event: unknown) => void emitted.push(event) };

    const { handler } = makeSubscribe({ eventBus, subscriberRepository } as never);

    await assert.doesNotReject(() => handler({ payload: { email: 'jane@example.com' } } as never));

    assert.equal(insertAttempts, 1);
    assert.equal(emitted.length, 0);
  });

  it('propagates unexpected repository failures', async () => {
    const subscriberRepository = {
      insert: async () => {
        throw new Error('connection lost');
      },
    };
    const eventBus = { emit: () => undefined };

    const { handler } = makeSubscribe({ eventBus, subscriberRepository } as never);

    await assert.rejects(() => handler({ payload: { email: 'jane@example.com' } } as never), {
      message: 'connection lost',
    });
  });

  it('registers itself on the command bus under its action type', () => {
    const registered: string[] = [];
    const commandBus = { register: (type: string) => void registered.push(type) };
    const subscriberRepository = { insert: async () => undefined };
    const eventBus = { emit: () => undefined };

    makeSubscribe({ commandBus, eventBus, subscriberRepository } as never).init();

    assert.deepEqual(registered, [subscribeCommand.type]);
  });
});

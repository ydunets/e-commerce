import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SubscriberRepository } from '#src/modules/newsletter/database/subscriber.repository.port';
import { SubscriberAlreadyExistsException } from '#src/modules/newsletter/domain/subscriber.errors';
import type { SubscriberEntity } from '#src/modules/newsletter/domain/subscriber.types';
import type { ApplicationAction } from '#src/shared/nest/dispatcher';
import { SubscribeCommand, SubscribedEvent, SubscribeHandler } from './subscribe.handler.js';

describe('SubscribeHandler', () => {
  it('publishes the normalized subscriber only after persistence succeeds', async () => {
    const inserted: SubscriberEntity[] = [];
    const emitted: ApplicationAction[] = [];
    const repository: SubscriberRepository = {
      insert: async (subscriber) => {
        inserted.push(subscriber);
      },
    };
    const events = {
      publish: (event: ApplicationAction) => {
        assert.equal(inserted.length, 1);
        emitted.push(event);
      },
    };
    await new SubscribeHandler(repository, events).execute(
      new SubscribeCommand({ email: ' Jane@Example.com ' }),
    );
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].email, 'jane@example.com');
    assert.equal(emitted.length, 1);
    assert.ok(emitted[0] instanceof SubscribedEvent);
    assert.equal(emitted[0].payload.email, 'jane@example.com');
    assert.equal(emitted[0].payload.subscriberId, inserted[0].id);
    assert.equal(emitted[0].type, 'newsletter/subscribed');
  });

  it('resolves duplicate subscriptions without publishing another event', async () => {
    const repository: SubscriberRepository = {
      insert: async () => {
        throw new SubscriberAlreadyExistsException('jane@example.com');
      },
    };
    const emitted: ApplicationAction[] = [];
    const events = {
      publish: (event: ApplicationAction) => {
        emitted.push(event);
      },
    };
    await assert.doesNotReject(() =>
      new SubscribeHandler(repository, events).execute(
        new SubscribeCommand({ email: 'jane@example.com' }),
      ),
    );
    assert.deepEqual(emitted, []);
  });

  it('propagates repository failure without publishing an event', async () => {
    const failure = new Error('connection lost');
    const repository: SubscriberRepository = {
      insert: async () => {
        throw failure;
      },
    };
    const emitted: ApplicationAction[] = [];
    const events = {
      publish: (event: ApplicationAction) => {
        emitted.push(event);
      },
    };
    await assert.rejects(
      () =>
        new SubscribeHandler(repository, events).execute(
          new SubscribeCommand({ email: 'jane@example.com' }),
        ),
      (error) => error === failure,
    );
    assert.deepEqual(emitted, []);
  });
});

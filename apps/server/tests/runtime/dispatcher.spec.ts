import assert from 'node:assert/strict';
import { it } from 'node:test';
import { HttpAdapterHost } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import {
  SubscribeCommand,
  SubscribedEvent,
} from '#src/modules/newsletter/commands/subscribe/subscribe.handler';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';

it('preserves action prototypes and caller metadata without mutating the original', async () => {
  const stop = new Error('bus reached');
  let dispatched: unknown;
  let published: unknown;
  const host = new HttpAdapterHost();
  host.httpAdapter = new FastifyAdapter();
  const dispatcher = new ApplicationDispatcher(
    {
      async execute(command: unknown) {
        dispatched = command;
        throw stop;
      },
    },
    {
      publish(event: unknown) {
        published = event;
      },
    },
    host,
  );
  const metadata = { correlationId: 'dispatcher-correlation', timestamp: 123 };
  const command = new SubscribeCommand({ email: 'jane@example.com' }, metadata);
  await assert.rejects(dispatcher.execute(command), (error) => error === stop);
  assert.ok(dispatched instanceof SubscribeCommand);
  assert.notEqual(dispatched, command);
  assert.deepEqual(dispatched.meta, metadata);
  assert.equal(command.meta, metadata);
  const event = new SubscribedEvent({ subscriberId: 'subscriber', email: 'jane@example.com' });
  dispatcher.publish(event);
  assert.ok(published instanceof SubscribedEvent);
  assert.notEqual(published, event);
  assert.equal(published.type, SubscribedEvent.type);
  assert.equal(typeof published.meta?.timestamp, 'number');
  assert.equal(event.meta, undefined);
  await host.httpAdapter.close();
});

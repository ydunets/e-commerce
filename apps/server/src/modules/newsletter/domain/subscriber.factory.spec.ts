import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSubscriber } from './subscriber.factory.ts';

describe('createSubscriber()', () => {
  it('trims and lowercases the email so re-subscribing with different casing hits the same row', () => {
    const subscriber = createSubscriber('  Jane@Example.com  ');

    assert.equal(subscriber.email, 'jane@example.com');
  });

  it('assigns a unique id and equal created/updated timestamps to a fresh subscriber', () => {
    const first = createSubscriber('jane@example.com');
    const second = createSubscriber('john@example.com');

    assert.notEqual(first.id, second.id);
    assert.equal(first.createdAt.getTime(), first.updatedAt.getTime());
  });
});

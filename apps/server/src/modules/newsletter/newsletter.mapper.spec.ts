import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toSubscribeResponse } from './newsletter.mapper.js';

describe('newsletterMapper().toSubscribeResponse()', () => {
  it('returns the verbatim success copy the client surfaces as a toast', () => {
    assert.deepEqual(toSubscribeResponse(), {
      message: 'Subscription successful! Please check your email to confirm.',
    });
  });
});

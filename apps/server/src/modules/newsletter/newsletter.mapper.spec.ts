import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import newsletterMapper from './newsletter.mapper.ts';

describe('newsletterMapper().toSubscribeResponse()', () => {
  it('returns the verbatim success copy the client surfaces as a toast', () => {
    assert.deepEqual(newsletterMapper().toSubscribeResponse(), {
      message: 'Subscription successful! Please check your email to confirm.',
    });
  });
});

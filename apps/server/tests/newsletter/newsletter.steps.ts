import assert from 'node:assert/strict';
import { After, Given, Then, When } from '@cucumber/cucumber';
import {
  SUBSCRIBER_REPOSITORY,
  type SubscriberRepository,
} from '#src/modules/newsletter/database/subscriber.repository.port';
import { STATUS_OK } from '../shared/http.js';
import type { ICustomWorld } from '../support/custom-world.js';

const SUBSCRIPTIONS_URL = '/api/v1/newsletter/subscriptions';
const SUBSCRIBER_PREFIX = 'char-newsletter-';

When(
  'I subscribe with the email array containing {string}',
  async function (this: ICustomWorld, email: string) {
    this.context.latestResponse = await this.server.inject({
      method: 'POST',
      url: SUBSCRIPTIONS_URL,
      payload: { email: [email] },
    });
  },
);

Given('newsletter persistence fails unexpectedly', function (this: ICustomWorld) {
  this.server.get<SubscriberRepository>(SUBSCRIBER_REPOSITORY).insert = async () => {
    throw new Error('private-database-diagnostics');
  };
});

Then('the subscription failure hides internal diagnostics', function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.equal(body.message, 'Internal Server Error');
  assert.equal(body.details, undefined);
  assert.equal(body.subErrors, undefined);
  assert.ok(!JSON.stringify(body).includes('private-database-diagnostics'));
});

When('I subscribe {string}', async function (this: ICustomWorld, email: string) {
  this.context.latestResponse = await this.server.inject({
    method: 'POST',
    url: SUBSCRIPTIONS_URL,
    payload: { email },
  });
});

Then('the subscription succeeds', function (this: ICustomWorld) {
  assert.equal(this.context.latestResponse!.statusCode, STATUS_OK);
  assert.deepEqual(this.context.latestResponse!.json(), {
    message: 'Subscription successful! Please check your email to confirm.',
  });
});

Then(
  'exactly one subscriber exists for {string}',
  async function (this: ICustomWorld, email: string) {
    // There is no subscriber read endpoint; issue #83 explicitly requires this storage assertion.
    const rows = await this.db`SELECT email FROM subscribers WHERE lower(email) = ${email}`;
    assert.deepEqual(
      rows.map((row) => row.email),
      [email],
    );
  },
);

After({ tags: '@newsletter' }, async function (this: ICustomWorld) {
  await this.db`DELETE FROM subscribers WHERE lower(email) LIKE ${`${SUBSCRIBER_PREFIX}%`}`;
});

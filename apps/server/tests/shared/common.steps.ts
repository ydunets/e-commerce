import assert from 'node:assert';
import { Then, When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';
import { assertText } from './http.ts';

When('I request {string}', async function (this: ICustomWorld, url: string) {
  this.context.latestResponse = await this.server.inject({ method: 'GET', url });
});

Then('the response carries the error envelope', function (this: ICustomWorld) {
  const response = this.context.latestResponse!;
  const body = response.json();
  assert.strictEqual(body.statusCode, response.statusCode);
  assert.strictEqual(body.error, response.statusMessage);
  assertText(body.message);
  assertText(body.correlationId);
});

Then(
  /^I receive an error "(.*)" with status code (\d+)$/,
  async function (this: ICustomWorld, errorMessage: string, statusCode: string) {
    assert.strictEqual(this.context.latestResponse!.statusCode, +statusCode);
    assert.strictEqual(this.context.latestResponse!.statusMessage, errorMessage);
  },
);

import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.js';

Then(
  /^(?:product|review) validation identifies "([^"]+)"$/,
  function (this: ICustomWorld, path: string) {
    const error = this.context.latestResponse!.json();
    assert.equal(error.message, 'Validation error');
    assert.equal(error.details, undefined);
    assert.ok(
      error.subErrors.some(
        (issue: { path: string; message: string }) =>
          issue.path === path && issue.message.length > 0,
      ),
    );
  },
);

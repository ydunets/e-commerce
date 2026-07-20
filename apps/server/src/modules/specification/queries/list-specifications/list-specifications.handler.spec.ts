import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import makeListSpecificationsQuery, {
  listSpecificationsQuery,
} from './list-specifications.handler.ts';

describe('listSpecificationsQuery handler', () => {
  it('passes the repository result through unchanged', async () => {
    const specifications = [{ id: 'sustainability' }];
    const specificationRepository = { findAll: async () => specifications };

    const { handler } = makeListSpecificationsQuery({ specificationRepository } as never);
    const result = await handler({ payload: undefined } as never);

    assert.equal(result, specifications);
  });

  it('returns an empty list when no specifications exist', async () => {
    const specificationRepository = { findAll: async () => [] };

    const { handler } = makeListSpecificationsQuery({ specificationRepository } as never);

    assert.deepEqual(await handler({ payload: undefined } as never), []);
  });

  it('registers itself on the query bus under its action type', () => {
    const registered: string[] = [];
    const queryBus = { register: (type: string) => void registered.push(type) };
    const specificationRepository = { findAll: async () => [] };

    makeListSpecificationsQuery({ queryBus, specificationRepository } as never).init();

    assert.deepEqual(registered, [listSpecificationsQuery.type]);
  });
});

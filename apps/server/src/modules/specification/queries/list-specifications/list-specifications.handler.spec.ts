import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SpecificationRepository } from '#src/modules/specification/database/specification.repository.port';
import type { SpecificationEntity } from '#src/modules/specification/domain/specification.types';
import { ListSpecificationsHandler } from './list-specifications.handler.js';
import { ListSpecificationsQuery } from './list-specifications.query.js';

describe('ListSpecificationsHandler', () => {
  it('passes the repository result through unchanged', async () => {
    const specifications: SpecificationEntity[] = [
      {
        id: 'sustainability',
        label: 'Sustainability',
        title: 'Eco-Friendly Choice',
        description: 'Care for the planet.',
        imageUrl: '/images/specifications/sustainability.jpg',
        imageAlt: 'Yellow cashmere sweater',
        features: [{ icon: 'recycle-line', label: 'Recycled Materials' }],
      },
    ];
    const repository: SpecificationRepository = { findAll: async () => specifications };
    const handler = new ListSpecificationsHandler(repository);

    const result = await handler.execute(new ListSpecificationsQuery());
    assert.equal(result, specifications);
  });

  it('returns an empty list when no specifications exist', async () => {
    const repository: SpecificationRepository = { findAll: async () => [] };
    const handler = new ListSpecificationsHandler(repository);

    assert.deepEqual(await handler.execute(new ListSpecificationsQuery()), []);
  });
});

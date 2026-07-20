import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import specificationRepository from './specification.repository.ts';

const TABLES = ['specifications', 'specification_features'] as const;

type Table = (typeof TABLES)[number];
type Rows = Record<Table, unknown[]>;

// The repository only issues tagged-template queries, so a fake tag that
// serves canned rows per table pins its behaviour without a database.
function fakeDb(rows: Partial<Rows>): Dependencies['db'] {
  return ((strings: TemplateStringsArray) => {
    const sql = strings.join('?');
    const table = TABLES.find((name) => sql.includes(`FROM ${name}`));
    if (!table) throw new Error(`Unexpected query: ${sql}`);
    return Promise.resolve(rows[table] ?? []);
  }) as unknown as Dependencies['db'];
}

// Rows arrive deliberately shuffled so the sort_order-based ordering is pinned.
const rows: Partial<Rows> = {
  specifications: [
    {
      specification_id: 'comfort',
      label: 'Comfort',
      title: 'Uncompromised Comfort',
      description: 'A sanctuary of softness.',
      image_url: '/images/specifications/comfort.jpg',
      image_alt: 'Draped charcoal fabric',
      sort_order: 2,
    },
    {
      specification_id: 'sustainability',
      label: 'Sustainability',
      title: 'Eco-Friendly Choice',
      description: 'Care for the planet.',
      image_url: '/images/specifications/sustainability.jpg',
      image_alt: 'Yellow cashmere sweater',
      sort_order: 1,
    },
  ],
  specification_features: [
    { specification_id: 'comfort', icon: 't-shirt-line', label: 'Ergonomic Fits', sort_order: 1 },
    {
      specification_id: 'sustainability',
      icon: 'paint-line',
      label: 'Low Impact Dye',
      sort_order: 2,
    },
    {
      specification_id: 'sustainability',
      icon: 'recycle-line',
      label: 'Recycled Materials',
      sort_order: 1,
    },
  ],
};

const findAllSpecifications = () =>
  specificationRepository({ db: fakeDb(rows) } as unknown as Dependencies).findAll();

describe('specificationRepository().findAll()', () => {
  it('returns an empty list when no specifications exist', async () => {
    const repository = specificationRepository({
      db: fakeDb({ specifications: [] }),
    } as unknown as Dependencies);
    assert.deepEqual(await repository.findAll(), []);
  });

  it('orders specifications by sort_order', async () => {
    const specifications = await findAllSpecifications();
    assert.deepEqual(
      specifications.map((specification) => specification.id),
      ['sustainability', 'comfort'],
    );
  });

  it('groups features per specification, ordered by sort_order', async () => {
    const specifications = await findAllSpecifications();
    assert.deepEqual(
      specifications[0].features.map((feature) => feature.label),
      ['Recycled Materials', 'Low Impact Dye'],
    );
    assert.deepEqual(
      specifications[1].features.map((feature) => feature.label),
      ['Ergonomic Fits'],
    );
  });

  it('maps snake_case rows to camelCase entities', async () => {
    const [sustainability] = await findAllSpecifications();
    assert.deepEqual(sustainability, {
      id: 'sustainability',
      label: 'Sustainability',
      title: 'Eco-Friendly Choice',
      description: 'Care for the planet.',
      imageUrl: '/images/specifications/sustainability.jpg',
      imageAlt: 'Yellow cashmere sweater',
      features: [
        { icon: 'recycle-line', label: 'Recycled Materials' },
        { icon: 'paint-line', label: 'Low Impact Dye' },
      ],
    });
  });
});

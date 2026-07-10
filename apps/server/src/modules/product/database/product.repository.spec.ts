import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import productRepository from './product.repository.ts';

const TABLES = [
  'products',
  'product_inventory',
  'product_images',
  'product_info',
  'product_reviews',
] as const;

type Table = (typeof TABLES)[number];
type Rows = Record<Table, unknown[]>;

// The repository only issues tagged-template queries, so a fake tag that
// serves canned rows per table pins its behaviour without a database.
function fakeDb(rows: Partial<Rows>): Dependencies['db'] {
  return ((strings: TemplateStringsArray) => {
    const sql = strings.join('?');
    const table = TABLES.find((name) => sql.includes(`FROM ${name} `));
    if (!table) throw new Error(`Unexpected query: ${sql}`);
    return Promise.resolve(rows[table] ?? []);
  }) as unknown as Dependencies['db'];
}

const productRow = { product_id: 'test-cap', name: 'Test Cap', description: 'A cap.' };

const inventoryRow = (overrides: Record<string, unknown>) => ({
  sku: 'sku',
  color: 'green',
  size: 'sm',
  list_price: '95.00',
  discount_percentage: null,
  sale_price: '95.00',
  stock: 1,
  sold: 0,
  ...overrides,
});

// Rows arrive deliberately shuffled; images list brown first so the
// image-derived colour order differs from the row order.
const rows: Partial<Rows> = {
  products: [productRow],
  product_inventory: [
    inventoryRow({
      sku: 'green-md',
      color: 'green',
      size: 'md',
      discount_percentage: 20,
      sale_price: '76.00',
      stock: 5,
    }),
    inventoryRow({ sku: 'navy-os', color: 'navy', size: null, stock: 2 }),
    inventoryRow({ sku: 'brown-md', color: 'brown', size: 'md', stock: 7 }),
    inventoryRow({
      sku: 'green-sm',
      color: 'green',
      size: 'sm',
      discount_percentage: 20,
      sale_price: '76.00',
      stock: 0,
    }),
    inventoryRow({ sku: 'brown-sm', color: 'brown', size: 'sm', stock: 4 }),
  ],
  product_images: [
    { color: 'brown', image_url: 'https://img/brown-1' },
    { color: 'green', image_url: 'https://img/green-1' },
  ],
  product_info: [{ title: 'Features', description: ['Warm', 'Light'] }],
  product_reviews: [{ count: 3, average: 4.5 }],
};

const findTestProduct = () =>
  productRepository({ db: fakeDb(rows) } as unknown as Dependencies).findOneById('test-cap');

describe('productRepository().findOneById()', () => {
  it('returns undefined when the product does not exist', async () => {
    const repository = productRepository({
      db: fakeDb({ products: [] }),
    } as unknown as Dependencies);
    assert.equal(await repository.findOneById('missing'), undefined);
  });

  it('orders colours by first image appearance, unimaged colours last', async () => {
    const product = await findTestProduct();
    assert.deepEqual(product?.colors, ['brown', 'green', 'navy']);
  });

  it('sorts variants by colour order, then by size', async () => {
    const product = await findTestProduct();
    assert.deepEqual(
      product?.variants.map((variant) => variant.sku),
      ['brown-sm', 'brown-md', 'green-sm', 'green-md', 'navy-os'],
    );
  });

  it('derives deduplicated sizes in canonical order, skipping one-size', async () => {
    const product = await findTestProduct();
    assert.deepEqual(product?.sizes, ['sm', 'md']);
  });

  it('converts numeric database strings into numbers', async () => {
    const product = await findTestProduct();
    const greenMd = product?.variants.find((variant) => variant.sku === 'green-md');
    assert.deepEqual(
      { list: greenMd?.listPrice, sale: greenMd?.salePrice, pct: greenMd?.discountPercentage },
      { list: 95, sale: 76, pct: 20 },
    );
    const brownMd = product?.variants.find((variant) => variant.sku === 'brown-md');
    assert.equal(brownMd?.discountPercentage, null);
  });

  it('maps images, info, and the review summary', async () => {
    const product = await findTestProduct();
    assert.deepEqual(product?.images[0], { color: 'brown', url: 'https://img/brown-1' });
    assert.deepEqual(product?.info, [{ title: 'Features', description: ['Warm', 'Light'] }]);
    assert.deepEqual(product?.reviews, { count: 3, average: 4.5 });
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import productRepository from './product.repository.ts';

const TABLES = ['products', 'product_inventory', 'product_images', 'product_info'] as const;

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

  it('maps images and info', async () => {
    const product = await findTestProduct();
    assert.deepEqual(product?.images[0], { color: 'brown', url: 'https://img/brown-1' });
    assert.deepEqual(product?.info, [{ title: 'Features', description: ['Warm', 'Light'] }]);
  });
});

const listProductRow = (product_id: string, name: string, created_at: string) => ({
  product_id,
  name,
  created_at,
});

// Products arrive shuffled with a created_at tie between alpha-tee and
// beta-tee, so ordering must come from the repository, not the rows.
// Images list cream before navy while inventory lists navy first: the list
// colour order must follow inventory, unlike findOneById's image order.
const listRows: Partial<Rows> = {
  products: [
    listProductRow('beta-tee', 'Beta Tee', '2024-03-01T00:00:00Z'),
    listProductRow('delta-cap', 'Delta Cap', '2024-04-01T00:00:00Z'),
    listProductRow('alpha-tee', 'Alpha Tee', '2024-03-01T00:00:00Z'),
    listProductRow('gamma-cap', 'Gamma Cap', '2024-02-01T00:00:00Z'),
  ],
  product_inventory: [
    inventoryRow({ sku: 'dc-navy-sm', product_id: 'delta-cap', color: 'navy', size: 'sm' }),
    inventoryRow({ sku: 'dc-cream-sm', product_id: 'delta-cap', color: 'cream', size: 'sm' }),
    inventoryRow({ sku: 'dc-navy-md', product_id: 'delta-cap', color: 'navy', size: 'md' }),
    inventoryRow({ sku: 'dc-lime-sm', product_id: 'delta-cap', color: 'lime', size: 'sm' }),
    inventoryRow({
      sku: 'at-olive-sm',
      product_id: 'alpha-tee',
      color: 'olive',
      size: 'sm',
      list_price: '100.00',
      sale_price: '80.00',
    }),
    inventoryRow({
      sku: 'at-olive-md',
      product_id: 'alpha-tee',
      color: 'olive',
      size: 'md',
      list_price: '95.00',
      discount_percentage: 20,
      sale_price: '76.00',
    }),
    inventoryRow({
      sku: 'at-olive-lg',
      product_id: 'alpha-tee',
      color: 'olive',
      size: 'lg',
      list_price: '90.00',
      sale_price: '90.00',
    }),
    inventoryRow({
      sku: 'bt-rust-sm',
      product_id: 'beta-tee',
      color: 'rust',
      size: 'sm',
      stock: 0,
    }),
    inventoryRow({
      sku: 'bt-rust-md',
      product_id: 'beta-tee',
      color: 'rust',
      size: 'md',
      stock: 0,
    }),
    inventoryRow({
      sku: 'bt-sand-sm',
      product_id: 'beta-tee',
      color: 'sand',
      size: 'sm',
      stock: 0,
    }),
    inventoryRow({
      sku: 'bt-sand-md',
      product_id: 'beta-tee',
      color: 'sand',
      size: 'md',
      stock: 3,
    }),
  ],
  product_images: [
    { product_id: 'delta-cap', color: 'cream', image_url: 'https://img/cream-1' },
    { product_id: 'delta-cap', color: 'navy', image_url: 'https://img/navy-1' },
    { product_id: 'delta-cap', color: 'navy', image_url: 'https://img/navy-2' },
  ],
};

const listProducts = (options: { limit?: number; offset?: number } = {}) =>
  productRepository({ db: fakeDb(listRows) } as unknown as Dependencies).findMany(options);

describe('productRepository().findMany()', () => {
  it('orders products newest-first, ties broken by product id', async () => {
    const products = await listProducts();
    assert.deepEqual(
      products.map((product) => product.id),
      ['delta-cap', 'alpha-tee', 'beta-tee', 'gamma-cap'],
    );
  });

  it('applies limit and offset to the ordered list', async () => {
    const products = await listProducts({ limit: 2, offset: 1 });
    assert.deepEqual(
      products.map((product) => product.id),
      ['alpha-tee', 'beta-tee'],
    );
  });

  it("orders colours by first inventory appearance with that colour's first image", async () => {
    const products = await listProducts();
    const deltaCap = products.find((product) => product.id === 'delta-cap');
    assert.deepEqual(
      deltaCap?.colors.map(({ color, imageUrl }) => ({ color, imageUrl })),
      [
        { color: 'navy', imageUrl: 'https://img/navy-1' },
        { color: 'cream', imageUrl: 'https://img/cream-1' },
        { color: 'lime', imageUrl: null },
      ],
    );
  });

  it("picks the colour's lowest sale price with that size's list price as the card price", async () => {
    const products = await listProducts();
    const alphaTee = products.find((product) => product.id === 'alpha-tee');
    assert.deepEqual(
      alphaTee?.colors.map(({ color, salePrice, listPrice }) => ({ color, salePrice, listPrice })),
      [{ color: 'olive', salePrice: 76, listPrice: 95 }],
    );
  });

  it('marks a colour out of stock only when every size has zero stock', async () => {
    const products = await listProducts();
    const betaTee = products.find((product) => product.id === 'beta-tee');
    assert.deepEqual(
      betaTee?.colors.map(({ color, outOfStock }) => ({ color, outOfStock })),
      [
        { color: 'rust', outOfStock: true },
        { color: 'sand', outOfStock: false },
      ],
    );
  });
});

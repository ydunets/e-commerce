import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

// Shapes of the challenge's source JSON files.
interface ProductRecord {
  product_id: string;
  name: string;
  description: string;
  category: string;
  collection: string;
  created_at: string;
}

interface InventoryRecord {
  sku: string;
  product_id: string;
  color: string;
  // Clothing sizes are strings ('xs'), shoe sizes are numbers (4, 4.5),
  // one-size products (hats, socks, sunglasses) are null.
  size: string | number | null;
  list_price: number;
  discount_percentage: number | null;
  sale_price: number;
  stock: number;
  sold: number;
}

interface ImageRecord {
  product_id: string;
  color: string;
  image_url: string;
}

interface InfoRecord {
  product_id: string;
  title: string;
  description: string[];
}

interface ReviewRecord {
  product_id: string;
  user_id: string;
  rating: number;
  content: string | null; // some reviews are a rating with no written text
  created_at: string;
}

// Resolved relative to this script (repo-root/assets/...), so it's machine-independent.
// Override with SEED_DATA_DIR=/path/to/data when the source lives elsewhere.
const DATA_DIR =
  process.env.SEED_DATA_DIR ??
  fileURLToPath(new URL('../../assets/product-details-section/data', import.meta.url));

const OUTPUT_PATH = fileURLToPath(
  new URL('../db/seeds/20240601000000_products.seed.sql', import.meta.url),
);

// --- SQL literal helpers ---------------------------------------------------

const sqlString = (value: string): string => `'${value.replaceAll("'", "''")}'`;

const sqlArray = (items: readonly string[]): string => `ARRAY[${items.map(sqlString).join(', ')}]`;

// Coerces to a text literal; numbers (e.g. shoe sizes) become quoted strings.
const sqlNullableString = (value: string | number | null): string =>
  value === null ? 'NULL' : sqlString(String(value));

const sqlNullableNumber = (value: number | null): string =>
  value === null ? 'NULL' : String(value);

// --- IO --------------------------------------------------------------------

async function readJson<Row>(fileName: string): Promise<Row[]> {
  const filePath = join(DATA_DIR, fileName);
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as Row[];
  } catch (cause) {
    throw new Error(`Failed to read or parse ${filePath}`, { cause });
  }
}

// --- SQL generation --------------------------------------------------------

/**
 * Emits a single multi-row INSERT, yielding one row at a time so the writable
 * side can apply backpressure instead of buffering the whole statement.
 */
function* insertStatement<Row>(
  table: string,
  columns: readonly string[],
  records: readonly Row[],
  toValues: (record: Row) => string,
): Generator<string> {
  if (records.length === 0) return;

  yield `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n`;

  const lastIndex = records.length - 1;
  for (const [index, record] of records.entries()) {
    yield `  (${toValues(record)})${index === lastIndex ? ';\n\n' : ',\n'}`;
  }
}

/** The ETL transform: reads the source JSON, streams out the dbmate seed file. */
async function* generateSeed(): AsyncGenerator<string> {
  const [products, inventory, images, info, reviews] = await Promise.all([
    readJson<ProductRecord>('products.json'),
    readJson<InventoryRecord>('inventory.json'),
    readJson<ImageRecord>('product-images.json'),
    readJson<InfoRecord>('product-info.json'),
    readJson<ReviewRecord>('product-reviews.json'),
  ]);

  yield '-- migrate:up\n';

  yield* insertStatement(
    'products',
    ['product_id', 'name', 'description', 'category', 'collection', 'created_at'],
    products,
    (product) =>
      [
        product.product_id,
        product.name,
        product.description,
        product.category,
        product.collection,
        product.created_at,
      ]
        .map(sqlString)
        .join(', '),
  );

  yield* insertStatement(
    'product_inventory',
    [
      'sku',
      'product_id',
      'color',
      'size',
      'list_price',
      'discount_percentage',
      'sale_price',
      'stock',
      'sold',
    ],
    inventory,
    (variant) =>
      [
        sqlString(variant.sku),
        sqlString(variant.product_id),
        sqlString(variant.color),
        sqlNullableString(variant.size),
        String(variant.list_price),
        sqlNullableNumber(variant.discount_percentage),
        String(variant.sale_price),
        String(variant.stock),
        String(variant.sold),
      ].join(', '),
  );

  yield* insertStatement('product_images', ['product_id', 'color', 'image_url'], images, (image) =>
    [image.product_id, image.color, image.image_url].map(sqlString).join(', '),
  );

  yield* insertStatement('product_info', ['product_id', 'title', 'description'], info, (section) =>
    [sqlString(section.product_id), sqlString(section.title), sqlArray(section.description)].join(
      ', ',
    ),
  );

  yield* insertStatement(
    'product_reviews',
    ['product_id', 'user_id', 'rating', 'content', 'created_at'],
    reviews,
    (review) =>
      [
        sqlString(review.product_id),
        sqlString(review.user_id),
        String(review.rating),
        sqlNullableString(review.content),
        sqlString(review.created_at),
      ].join(', '),
  );

  yield '-- migrate:down\n';
  yield [
    'DELETE FROM product_reviews;',
    'DELETE FROM product_info;',
    'DELETE FROM product_images;',
    'DELETE FROM product_inventory;',
    'DELETE FROM products;\n',
  ].join('\n');
}

// --- Entry point -----------------------------------------------------------

async function main(): Promise<void> {
  await pipeline(generateSeed(), createWriteStream(OUTPUT_PATH));
  process.stdout.write(`Wrote seed file: ${OUTPUT_PATH}\n`);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Seed generation failed: ${message}\n`);
  process.exitCode = 1;
}

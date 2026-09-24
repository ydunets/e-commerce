import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Shapes of the challenge's source JSON files.
const productRecordSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  collection: z.string(),
  created_at: z.string(),
});

const inventoryRecordSchema = z.object({
  sku: z.string(),
  product_id: z.string(),
  color: z.string(),
  // Clothing sizes are strings, shoe sizes are numbers, and one-size products are null.
  size: z.union([z.string(), z.number(), z.null()]),
  list_price: z.number(),
  discount_percentage: z.union([z.number(), z.null()]),
  sale_price: z.number(),
  stock: z.number(),
  sold: z.number(),
});

const imageRecordSchema = z.object({
  product_id: z.string(),
  color: z.string(),
  image_url: z.string(),
});

const infoRecordSchema = z.object({
  product_id: z.string(),
  title: z.string(),
  description: z.array(z.string()),
});

const reviewRecordSchema = z.object({
  product_id: z.string(),
  user_id: z.string(),
  rating: z.number(),
  // Some reviews contain a rating without written text.
  content: z.union([z.string(), z.null()]),
  created_at: z.string(),
});

// Resolved relative to this script (repo-root/examples/...), so it's machine-independent.
// Override with SEED_DATA_DIR=/path/to/data when the source lives elsewhere.
const DATA_DIR =
  process.env.SEED_DATA_DIR ??
  fileURLToPath(
    new URL('../../../examples/product-details/product-details-page/data', import.meta.url),
  );

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

async function readJson<Row>(fileName: string, schema: z.ZodType<Row>): Promise<Row[]> {
  const filePath = join(DATA_DIR, fileName);
  try {
    return z.array(schema).parse(JSON.parse(await readFile(filePath, 'utf8')));
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
    readJson('products.json', productRecordSchema),
    readJson('inventory.json', inventoryRecordSchema),
    readJson('product-images.json', imageRecordSchema),
    readJson('product-info.json', infoRecordSchema),
    readJson('product-reviews.json', reviewRecordSchema),
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

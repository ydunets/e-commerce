import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { isType, type ProductListItemDto, type ProductResponseDto } from '@e-commerce/contracts';
import type { ReviewSummaryResponseDto } from '#src/modules/review/dtos/review-summary.response.dto';
import { assertKeys, assertText, getJson, PRODUCTS_URL, STATUS_OK } from '../shared/http.js';
import type { ICustomWorld } from '../support/custom-world.js';

interface CatalogueContext {
  catalogue: ProductListItemDto[];
  details: ProductResponseDto[];
  expectedIds: string[];
}

function catalogueContext(world: ICustomWorld): CatalogueContext {
  return world.context as unknown as CatalogueContext;
}

async function getCatalogueDetails(world: ICustomWorld): Promise<ProductResponseDto[]> {
  return Promise.all(
    catalogueContext(world).catalogue.map((product) =>
      getJson<ProductResponseDto>(world, `${PRODUCTS_URL}/${product.product_id}`),
    ),
  );
}

function catalogueResponse(world: ICustomWorld): ProductListItemDto[] {
  assert.equal(world.context.latestResponse!.statusCode, STATUS_OK);
  const products = world.context.latestResponse!.json<ProductListItemDto[]>();
  assert.ok(Array.isArray(products));
  return products;
}

Given('the seeded catalogue ordering is recorded', async function (this: ICustomWorld) {
  // created_at is not exposed by HTTP; record seed metadata as the ordering precondition.
  const rows = await this.db`
    SELECT product_id FROM products ORDER BY created_at DESC, product_id ASC
  `;
  assert.ok(rows.length > 2, 'expected a seeded catalogue, not an empty database');
  catalogueContext(this).expectedIds = rows.map((row) => row.product_id);
});

Given('the full catalogue is recorded', async function (this: ICustomWorld) {
  const catalogue = await getJson<ProductListItemDto[]>(this, PRODUCTS_URL);
  assert.ok(catalogue.length > 2, 'pagination requires at least three seeded products');
  catalogueContext(this).catalogue = catalogue;
});

Then('the catalogue matches the recorded newest-first ordering', function (this: ICustomWorld) {
  assert.deepEqual(
    catalogueResponse(this).map((product) => product.product_id),
    catalogueContext(this).expectedIds,
  );
});

Then(
  'each product card describes its inventory colour variants',
  async function (this: ICustomWorld) {
    for (const card of catalogueResponse(this)) {
      assertKeys(card, ['product_id', 'name', 'colors']);
      assertText(card.product_id);
      assertText(card.name);
      const detail = await getJson<ProductResponseDto>(this, `${PRODUCTS_URL}/${card.product_id}`);
      assert.equal(card.name, detail.name);
      assert.ok(card.colors.length > 0);
      assert.deepEqual(
        card.colors.map((variant) => variant.color).toSorted(),
        [...new Set(detail.inventory.map((item) => item.color))].sort(),
      );
      for (const variant of card.colors) {
        assertKeys(variant, ['color', 'image_url', 'sale_price', 'list_price', 'out_of_stock']);
        const inventory = detail.inventory.filter((item) => item.color === variant.color);
        assert.ok(
          inventory.some(
            (item) =>
              item.sale_price === variant.sale_price && item.list_price === variant.list_price,
          ),
          'card prices must belong to the same inventory item',
        );
        assert.ok(inventory.every((item) => item.sale_price >= variant.sale_price));
        assert.equal(variant.out_of_stock, !inventory.some((item) => item.stock > 0));
        assert.equal(
          variant.image_url,
          detail.images.find((image) => image.color === variant.color)?.image_url ?? null,
        );
      }
    }
  },
);

Then(
  'the catalogue contains {int} products starting at offset {int}',
  function (this: ICustomWorld, limit: number, offset: number) {
    assert.deepEqual(
      catalogueResponse(this),
      catalogueContext(this).catalogue.slice(offset, offset + limit),
    );
  },
);

When(
  'I request other products in a seeded collection with limit {int} and offset {int}',
  async function (this: ICustomWorld, limit: number, offset: number) {
    const context = catalogueContext(this);
    const details = await getCatalogueDetails(this);
    const collection = details.find(
      (candidate) =>
        details.filter((product) => product.collection === candidate.collection).length >
        limit + offset,
    )?.collection;
    assert.ok(
      collection,
      'a seeded collection must contain enough products for exclusion and paging',
    );
    assert.ok(
      details.some((product) => product.collection !== collection),
      'filter requires another collection',
    );
    const matching = details.filter((product) => product.collection === collection);
    const excludedId = matching[0].product_id;
    context.expectedIds = matching
      .slice(1 + offset, 1 + offset + limit)
      .map((product) => product.product_id);
    const query = new URLSearchParams({
      collection,
      exclude: excludedId,
      limit: String(limit),
      offset: String(offset),
    });
    this.context.latestResponse = await this.server.inject({
      method: 'GET',
      url: `${PRODUCTS_URL}?${query}`,
    });
  },
);

Then(
  'only the requested collection page is returned without the excluded product',
  function (this: ICustomWorld) {
    assert.deepEqual(
      catalogueResponse(this).map((product) => product.product_id),
      catalogueContext(this).expectedIds,
    );
  },
);

When('I request every seeded product detail', async function (this: ICustomWorld) {
  catalogueContext(this).details = await getCatalogueDetails(this);
});

function assertInventory(detail: ProductResponseDto): void {
  for (const item of detail.inventory) {
    assertKeys(item, [
      'sku',
      'color',
      'size',
      'list_price',
      'discount_percentage',
      'sale_price',
      'sold',
      'stock',
    ]);
    assertText(item.sku);
    assert.ok(detail.colors.includes(item.color));
    if (item.size !== null) assert.ok(detail.sizes.includes(item.size));
    for (const price of [item.list_price, item.sale_price]) {
      assert.equal(typeof price, 'number');
      assert.ok(price >= 0);
    }
    assert.ok(item.discount_percentage === null || isType(item.discount_percentage, 'number'));
    assert.ok(Number.isInteger(item.stock) && item.stock >= 0);
    assert.ok(Number.isInteger(item.sold) && item.sold >= 0);
  }
}

Then(
  'the product detail contracts and review aggregates are preserved',
  async function (this: ICustomWorld) {
    const { catalogue, details } = catalogueContext(this);
    assert.ok(
      details.some((detail) => detail.reviews > 0),
      'review composition needs a reviewed product',
    );
    for (const [index, detail] of details.entries()) {
      assertKeys(detail, [
        'product_id',
        'name',
        'description',
        'collection',
        'colors',
        'sizes',
        'images',
        'info',
        'inventory',
        'priceRange',
        'rating',
        'reviews',
      ]);
      assert.equal(detail.product_id, catalogue[index].product_id);
      assert.equal(detail.name, catalogue[index].name);
      assertText(detail.description);
      assertText(detail.collection);
      assert.ok(detail.colors.length > 0);
      detail.colors.forEach(assertText);
      detail.sizes.forEach(assertText);
      assert.ok(detail.images.length > 0);
      for (const image of detail.images) {
        assertKeys(image, ['color', 'image_url']);
        assertText(image.color);
        assertText(image.image_url);
      }
      assert.ok(detail.info.length > 0);
      for (const section of detail.info) {
        assertKeys(section, ['title', 'description']);
        assertText(section.title);
        assert.ok(section.description.length > 0);
        section.description.forEach(assertText);
      }
      assert.ok(detail.inventory.length > 0);
      assertInventory(detail);
      assertKeys(detail.priceRange, ['highest', 'lowest']);
      const prices = detail.inventory
        .map((item) => item.sale_price)
        .sort((first, second) => first - second);
      assert.equal(detail.priceRange.lowest, prices[0]);
      assert.equal(detail.priceRange.highest, prices.at(-1));
      const summary = await getJson<ReviewSummaryResponseDto>(
        this,
        `${PRODUCTS_URL}/${detail.product_id}/reviews/summary`,
      );
      assert.equal(detail.reviews, summary.total);
      assert.equal(detail.rating, summary.average);
    }
  },
);

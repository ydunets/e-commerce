import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import type { ProductListItemDto, ProductResponseDto } from '@e-commerce/contracts';
import { HttpStatus } from '@nestjs/common';
import { SpanStatusCode } from '@opentelemetry/api';
import { getDb } from '#src/shared/db/postgres';

export interface ExportedSpan {
  name: string;
  spanId: string;
  parentSpanId?: string;
  traceId: string;
  status?: { code: number };
  attributes: { key: string; value: { stringValue?: string } }[];
}

const PRODUCTS_PATH = '/api/v1/products';
const CARTS_PATH = '/api/v1/carts';
const DEADLINE_MS = 15_000;
const POLL_MS = 25;
const CONTROLLERS: Record<string, string> = {
  product: 'ProductController',
  review: 'ReviewController',
};

function assertForwardedQuery(
  actions: ExportedSpan[],
  parent: ExportedSpan,
  name: string,
  logs: string,
): void {
  const forwarded = actions.filter((span) => span.name === name);
  assert.equal(forwarded.length, 1, 'each forwarded query must have exactly one span');
  assert.equal(forwarded[0].parentSpanId, parent.spanId);
  assert.equal(forwarded[0].traceId, parent.traceId);
  const timings = logs
    .split('\n')
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line));
  // The retained legacy timer reports successful completion only.
  const expectedTimings = forwarded[0].status?.code === SpanStatusCode.ERROR ? 0 : 1;
  assert.equal(
    timings.filter((record) => record.msg?.startsWith(`Action ${name} took `)).length,
    expectedTimings,
  );
}

export async function verifyQueryAdapters(
  origin: string,
  spans: ExportedSpan[],
  logs: () => string,
): Promise<void> {
  const cartIds: string[] = [];
  async function request(
    path: string,
    options: RequestInit,
    parentAction: string,
    bridgedAction?: string,
  ) {
    const correlationId = randomUUID();
    const logOffset = logs().length;
    const response = await fetch(`${origin}${path}`, {
      ...options,
      headers: { 'content-type': 'application/json', 'request-id': correlationId },
      signal: AbortSignal.timeout(DEADLINE_MS),
    });
    const body = await response.json();
    if (options.method === 'POST' && response.status === HttpStatus.OK) {
      assert.equal(typeof body.id, 'string');
      cartIds.push(body.id);
    }
    const deadline = Date.now() + DEADLINE_MS;
    const matching = () =>
      spans.filter((span) =>
        span.attributes.some(
          (attribute) =>
            attribute.key === 'cqrs.correlation_id' &&
            attribute.value.stringValue === correlationId,
        ),
      );
    while (Date.now() < deadline) {
      const parent = matching().find((span) => span.name === parentAction);
      if (parent && spans.some((span) => span.traceId === parent.traceId && !span.parentSpanId))
        break;
      await setTimeout(POLL_MS);
    }
    const actions = matching();
    assert.equal(
      actions.filter((span) => span.name === parentAction).length,
      1,
      `${parentAction}: ${JSON.stringify(actions)}`,
    );
    const parent = actions.find((span) => span.name === parentAction)!;
    if (bridgedAction) {
      assertForwardedQuery(actions, parent, bridgedAction, logs().slice(logOffset));
    }
    // Migrated product and review requests retain their Nest controller ancestor.
    const controller = CONTROLLERS[parentAction.split('/')[0]];
    if (controller) {
      assert.ok(
        spans.some(
          (span) => span.traceId === parent.traceId && span.name.startsWith(`${controller}.`),
        ),
      );
    }
    return { status: response.status, body };
  }

  try {
    const listing = await request(`${PRODUCTS_PATH}?limit=1`, {}, 'product/list');
    assert.equal(listing.status, HttpStatus.OK);
    const [listed] = listing.body as ProductListItemDto[];
    assert.ok(listed);
    const details = await request(
      `${PRODUCTS_PATH}/${listed.product_id}`,
      {},
      'product/find-one-by-id',
      'review/get-summary',
    );
    assert.equal(details.status, HttpStatus.OK);
    const product = details.body as ProductResponseDto;
    const summary = await request(
      `${PRODUCTS_PATH}/${listed.product_id}/reviews/summary`,
      {},
      'review/get-summary',
    );
    assert.equal(summary.status, HttpStatus.OK);
    const review = summary.body;
    assert.equal(product.reviews, review.total);
    assert.equal(product.rating, review.average);
    const reviews = await request(
      `${PRODUCTS_PATH}/${listed.product_id}/reviews?limit=2`,
      {},
      'review/find-all-paginated-by-product',
    );
    assert.equal(reviews.status, HttpStatus.OK);
    assert.equal(reviews.body.count, review.total);
    const missing = await request(
      `${PRODUCTS_PATH}/char-runtime-missing`,
      {},
      'product/find-one-by-id',
      'review/get-summary',
    );
    assert.equal(missing.status, HttpStatus.NOT_FOUND);
    const inventory = product.inventory.find((item) => item.stock > 0);
    assert.ok(inventory, 'seeded catalogue must include stocked inventory');
    const added = await request(
      `${CARTS_PATH}/items`,
      { method: 'POST', body: JSON.stringify({ sku: inventory.sku, quantity: 1 }) },
      'cart/add-item',
      'product/get-inventory-stock',
    );
    assert.equal(added.status, HttpStatus.OK);
    const conflict = await request(
      `${CARTS_PATH}/${added.body.id}/items/${inventory.sku}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ quantity: inventory.stock + 1 }),
      },
      'cart/update-item',
      'product/get-inventory-stock',
    );
    assert.equal(conflict.status, HttpStatus.CONFLICT);
    assert.deepEqual(conflict.body.details, {
      sku: inventory.sku,
      requested: inventory.stock + 1,
      available: inventory.stock,
    });
    const unavailable = await request(
      `${CARTS_PATH}/items`,
      { method: 'POST', body: JSON.stringify({ sku: 'char-runtime-missing', quantity: 1 }) },
      'cart/add-item',
      'product/get-inventory-stock',
    );
    assert.equal(unavailable.status, HttpStatus.NOT_FOUND);
  } finally {
    if (cartIds.length > 0) await getDb()`DELETE FROM carts WHERE cart_id = ANY(${cartIds})`;
  }
}

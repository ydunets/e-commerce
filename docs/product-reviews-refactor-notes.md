# Product Reviews — follow-up refactor: decouple `productExists` from `product`'s schema

> Status: proposed, not yet implemented. Captured while reviewing
> `feat(server): add product reviews read API` (commit `ed668a0`) on the `reviews` branch.

## Where

- [apps/server/src/modules/review/database/review.repository.ts](../apps/server/src/modules/review/database/review.repository.ts) — `productExists()`
- [apps/server/src/modules/review/database/review.repository.port.ts](../apps/server/src/modules/review/database/review.repository.port.ts) — port declaration

## Current implementation

```ts
async productExists(productId: string): Promise<boolean> {
  const [row] = await db`SELECT EXISTS(SELECT 1 FROM products WHERE product_id = ${productId}) AS exists`;
  return row?.exists ?? false;
}
```

`review.repository.ts` queries the `products` table directly to 404 unknown products in both
`find-product-reviews` and `get-review-summary` handlers.

## The tradeoff

**Pro (keep as-is):** cheap. A single `SELECT EXISTS` is far lighter than routing through
`product`'s full `findProductQuery` (which joins `product_inventory`, `product_images`,
`product_info`, and a reviews-summary aggregate just to build a whole `ProductEntity`) —
wasteful when all we need is a boolean.

**Con (should change):** `review` now has an implicit dependency on `product`'s table name
(`products`) and column name (`product_id`) via raw SQL text. This is the same kind of
cross-module coupling the architecture forbids for *code* imports
(`AGENTS.md` — "Never directly importing from one module into another"; enforced by
`pnpm deps:validate`), except here it's invisible to that tooling because it's SQL, not a
TypeScript import. If `product` ever renames that table/column, `review` breaks silently at
runtime with no compile-time signal.

## Recommended follow-up

Add a lightweight query to the **`product`** module, e.g. `product/exists`, that internally
does the same cheap `SELECT EXISTS` but is owned by `product` (so only `product`'s own files
need updating if its schema changes). `review`'s handlers call it via `queryBus`, exactly like
any other cross-module read, instead of `review.repository` querying `products` directly.

```ts
// modules/product/queries/product-exists/product-exists.handler.ts (new)
export const productExistsQuery = productActionCreator<{ id: string }, boolean>('exists');

export default function makeProductExistsQuery({ queryBus, productRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof productExistsQuery>): Promise<boolean> {
      return productRepository.exists(payload.id); // new cheap repo method, not findOneById
    },
    init() {
      queryBus.register(productExistsQuery.type, this.handler);
    },
  };
}
```

Then in `review`'s two query handlers, replace `reviewRepository.productExists(...)` with
`queryBus.execute(productExistsQuery({ id: payload.productId }))`, and drop `productExists`
from `ReviewRepository`/`review.repository.ts` entirely.

This keeps the existence check just as cheap, while scoping the coupling to `product`'s public
query contract (types, enforced by `pnpm deps:validate`) instead of its raw schema.

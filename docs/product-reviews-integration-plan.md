# Product Reviews — Backend & Frontend Integration Plan

> Design document for integrating the **Product Reviews** feature (rating summary,
> filter-by-rating, paginated list) into the existing `server` (Fastify / Clean
> Architecture / CQRS / DDD) and `client` (React 19 / TanStack Router / SSR /
> Feature-Sliced Design) apps.
>
> Source material: `examples/product-reviews/{guide.md, data, figma-nodes.md, designs}`.
> This is a **design/architecture plan only** — no implementation code. Implement per
> phase once the recommendations below are approved.

---

## 1. Goal & scope

Build a responsive **Product Reviews** experience surfaced from the product detail page:

- **Rating summary** — overall average, total count, and a 5-band distribution
  (Excellent → Poor) with proportional bars.
- **Filter by rating** — the summary bands double as filter toggles; a *Clear filter*
  link resets to all reviews.
- **Paginated list** — reviews load in pages via a *Show N more reviews* button
  (page size is device-dependent: 12 desktop / 10 mobile).
- **Per-review row** — author avatar (image or initials fallback), name, formatted
  date, star rating, content.
- **Fallback states** — loading, error, and empty ("No reviews yet! Be the first…"),
  including empty-under-active-filter.
- Presented as a **modal/dialog** (dark backdrop + close ✕) opened from the product
  page's rating line.

**In scope (this plan):** read side — list, summary, filter, pagination, and the UI.
**Deferred to Phase 2 (recommended):** *Write a review* submission (POST/command).

---

## 2. Current state (what already exists)

| Area | Finding | Consequence |
|---|---|---|
| DB `product_reviews` table | Already created + seeded: `id, product_id, user_id (slug), rating, content, created_at`. | No table migration needed; **no author identity** (name/avatar) in the DB. |
| DB `users` table | Auth/address users (`id, email, country, postalCode, street, role`). **Unrelated** to review authors. | Do **not** reuse for review authors — different bounded context. |
| `product` module | REST-only vertical slice; already computes `reviews: { count, average }` summary in its repo and returns `rating` + `reviews` in its DTO. | Precedent to follow; product endpoint already gives count+average to the product page loader. |
| `user` module | Full slice with pagination (`findAllPaginatedFiltered`) + GraphQL resolver. | Reference for the paginated reviews query. |
| Shared pagination | `paginatedQueryRequestDtoSchema` (`limit`, `page` 0-indexed), `paginatedQueryBase` (→ `offset`), `paginatedResponseBaseSchema` (`count/limit/page/data`). | **Use these** — the challenge guide's `per_page` example does not match the repo. |
| Client `StarRating` | Read-only variant already renders avg + `reviewCount` + `reviewsHref`/`writeReviewHref`. | Reused for the summary header and each row; its "See all reviews" affordance opens the modal. |
| Client `useQuery` | Resets to `loading` and **replaces** data on every deps change. | **Cannot** implement "Show N more" (append). The list needs a dedicated accumulation hook. |
| Client shared UI | Has `star-rating`, `accordion`, `button`, `badge`, etc. **No** `avatar`, **no** `dialog/modal`. | Two net-new shared components. |
| Design tokens (`app.css`) | `--color-success` (green), `--color-star` (yellow), `--color-warning` (amber), `--color-brand` (indigo, active state). | Map directly onto the rating-band bar colors + active-filter accent. |

**Two structural gaps drive the design (see §3):** (1) review-author identity has no
source in the DB, and (2) the distribution must be computed server-side because the
client never holds all reviews (it paginates and filters).

---

## 3. Key decisions (recommendations — override any before build)

### D1 — Review-author identity → new `review_authors` table  *(recommended)*
Review rows reference a `user_id` slug (`dante-lancaster`) but need a display `name`
and optional `avatar_url` (from `examples/.../data/users.json`), which are **not** in
the DB. Options:

- **(A) New `review_authors` table** seeded from `users.json`, joined by the reviews
  repo. Keeps reviews self-contained; no coupling to the auth `users` module. ✅ **Recommended.**
- (B) Add `name`/`avatar_url` columns to the existing `users` table — conflates two
  bounded contexts (auth users vs. review authors); rejected.
- (C) Ship author data as a static client asset — diverges from the DB-backed API pattern; rejected.

### D2 — Distribution is a **separate** concern from the list  *(recommended: dedicated summary endpoint)*
The 5-band distribution + average + total are **filter- and page-independent**
(filtering the list to 3★ must not change the bands). So do **not** embed them in the
paginated list response. Two viable homes:

- **(i) Dedicated `GET /v1/products/:id/reviews/summary`** in the new review module. ✅
  **Recommended** — keeps the module independent and cohesive.
- (ii) Extend the existing product endpoint's `reviews` object with the distribution,
  so the product-page loader already has it (saves one round-trip). Reasonable
  alternative if you prefer the modal to open with zero summary latency.

### D3 — Presentation: **modal/dialog**, client-fetched on open  *(recommended)*
The designs are a centered dialog over a dark backdrop, opened from the product page.
Given SSR + page accumulation + filtering, **client-fetch-on-open** is simplest and
matches the design. A dedicated `/products/:id/reviews` route (SSR + deep-linkable) is
a clean **Phase 2** enhancement, not required for v1.

### D4 — *Write a review* → **Phase 2**  *(recommended)*
The design has a *Write a review* button and `StarRating.writeReviewHref`, but the
guide is entirely read-side. Recommend shipping read first; wire the button to a
disabled/"coming soon" affordance (or a POST command) in Phase 2.

### D5 — Filter UX confirmed from Figma
The summary **rating bands are the filter control** (Figma node `Filter active`
`105:1922`): the active band label switches to the brand/indigo accent and a
**Clear filter** link appears next to *Write a review*. No separate chip row.

---

## 4. Backend design

New vertical slice: `apps/server/src/modules/review/` (REST-only, mirrors `product`).
GraphQL is skipped for parity with the product module (add later only if desired).

### 4.1 Data model / migrations

**Migration 1 — `review_authors`** (`pnpm db:create-migration create_review_authors`):

```sql
CREATE TABLE "review_authors" (
  "user_id"    character varying NOT NULL,
  "name"       character varying NOT NULL,
  "avatar_url" text,
  CONSTRAINT "PK_review_authors" PRIMARY KEY ("user_id")
);
-- Optional but recommended once author coverage is verified:
ALTER TABLE "product_reviews"
  ADD CONSTRAINT "FK_reviews_author"
  FOREIGN KEY ("user_id") REFERENCES "review_authors"("user_id");
```

**Seed — authors** (`db:create-seed`, from `users.json`): insert
`(user_id, name, avatar_url)` for every author. **Coverage check:** seed authors
*before* adding the FK; verify every distinct `product_reviews.user_id` exists in
`review_authors` (else the FK fails). If any orphan slugs exist, either backfill or
render them via an initials fallback and skip the FK.

> The `product_reviews` table + seed already exist — no changes needed there beyond the
> optional FK.

### 4.2 Slice structure

```
modules/review/
├── index.ts                      # actionCreatorFactory('review') + declare-global Dependencies
├── review.mapper.ts              # ReviewEntity → ReviewResponseDto (snake_case out)
├── domain/
│   └── review.types.ts           # ReviewEntity, ReviewAuthor, ReviewSummary, RatingDistribution
├── database/
│   ├── review.repository.port.ts # findAllPaginatedByProduct(...), getSummary(productId)
│   └── review.repository.ts       # SQL: reviews⨝review_authors; COUNT(*)…GROUP BY rating
├── dtos/
│   ├── review.response.dto.ts
│   ├── review.paginated.response.dto.ts
│   └── review-summary.response.dto.ts
└── queries/
    ├── find-product-reviews/     # .route.ts .handler.ts .schema.ts
    └── get-review-summary/       # .route.ts .handler.ts .schema.ts
```

### 4.3 Domain types (`domain/review.types.ts`)

```ts
export interface ReviewAuthor { userId: string; name: string; avatarUrl: string | null; }

export interface ReviewEntity {
  id: number;
  productId: string;
  author: ReviewAuthor;
  rating: number;          // 1..5
  content: string | null;
  createdAt: Date;
}

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>; // count per star
export interface ReviewSummary { total: number; average: number; distribution: RatingDistribution; }
```

### 4.4 Repository (`database/review.repository.ts`)

Two methods (SQL lives here only, per architecture rules):

- **`findAllPaginatedByProduct(productId, { limit, offset, page }, filters: { rating? })`**
  → `Paginated<ReviewEntity>`. Single query joining `product_reviews` ⨝
  `review_authors`, `WHERE product_id = $1 [AND rating = $rating]`, ordered
  `created_at DESC`, with a windowed `count` (filtered total) mirroring the user repo's
  `json_agg` + `COUNT(*)` pattern. **`count` reflects the filtered total** so the
  *Show N more* math is correct under an active filter.
- **`getSummary(productId)`** → `ReviewSummary`. `SELECT rating, COUNT(*) … GROUP BY
  rating` + `COUNT(*)` + `AVG(rating)`; normalize into all five bands (0 for missing).
  **Filter-independent** (always across all reviews for the product).

### 4.5 CQRS handlers (queries)

Follow the `find-users` pattern exactly (phantom `Result` type, `HandlerAction`, `init()`):

```ts
// find-product-reviews.handler.ts
export type FindProductReviewsResult = Paginated<ReviewEntity>;
export const findProductReviewsQuery = reviewActionCreator<
  { productId: string } & Partial<PaginatedQueryParams> & { rating?: number },
  FindProductReviewsResult
>('find-all-paginated-by-product');

// get-review-summary.handler.ts
export type GetReviewSummaryResult = ReviewSummary;
export const getReviewSummaryQuery =
  reviewActionCreator<{ productId: string }, GetReviewSummaryResult>('get-summary');
```

### 4.6 REST routes & contracts (prefix `/api`)

**List** — `GET /api/v1/products/:productId/reviews?limit=&page=&rating=`
- Query: `limit?` (1–99999), `page?` (0-indexed), `rating?` (1–5). Reuse
  `paginatedQueryRequestDtoSchema` intersected with the optional `rating`.
- 200 (`review.paginated.response.dto.ts`, reusing `paginatedResponseBaseSchema`):

```jsonc
{
  "count": 62,          // filtered total (drives "Show N more")
  "limit": 12,
  "page": 0,
  "data": [
    {
      "id": 1024,
      "user_id": "natali-craig",
      "name": "Natali Craig",
      "avatar_url": null,
      "rating": 4,
      "content": "I love the comfortable fit…",
      "created_at": "2024-03-11"
    }
  ]
}
```

**Summary** — `GET /api/v1/products/:productId/reviews/summary`
- 200 (`review-summary.response.dto.ts`), filter-independent:

```jsonc
{
  "total": 62,
  "average": 4.1,
  "distribution": { "5": 24, "4": 22, "3": 12, "2": 4, "1": 0 }
}
```

Route order note: register the literal `/summary` route so it is not shadowed by a
`:reviewId`-style param route (none planned, but keep specific-before-param).

### 4.7 DTO / mapper notes
- Response DTOs are **snake_case** to match the product module + GreatFrontend shape.
- `review.mapper.ts` flattens `entity.author` into `user_id/name/avatar_url` and
  formats `created_at` as an ISO date string.
- 404 if the product does not exist (throw `NotFoundException`), consistent with
  `find-product`. Decide whether the list/summary should 404 vs. return empty for an
  unknown product — recommend **404** to match `find-product`.

### 4.8 Backend testing
- Repo/handler unit tests (`*.spec.ts`, `node:test`) — distribution normalization,
  filtered `count`, avatar-null handling, empty product.
- Cucumber e2e (`tests/`) — list pagination, `rating` filter, summary shape, 404.
- `pnpm check` (Biome + `tsc`) and `pnpm deps:validate` must pass.

---

## 5. Frontend design (Feature-Sliced Design)

### 5.1 New units

```
entities/review/
├── model/types.ts        # Review, ReviewSummary, RatingDistribution, RatingBand
├── api/getProductReviews.ts   # GET …/reviews  → { count, page, limit, data }
├── api/getReviewSummary.ts    # GET …/reviews/summary
└── index.ts

shared/ui/avatar/          # NEW — <Avatar name src size /> image w/ initials fallback
shared/ui/dialog/          # NEW — <Dialog> backdrop + focus-trap + Esc + ✕ (a11y)

widgets/product-reviews/
├── ui/
│   ├── ProductReviewsDialog.tsx   # dialog shell; two-column layout (summary | list)
│   ├── ReviewSummary.tsx          # avg + 5 filter-bands + Clear filter + Write a review
│   ├── RatingBands.tsx            # the 5 proportional bars (band → color + %)
│   ├── ReviewList.tsx             # rows + "Show N more" + empty/loading/error states
│   └── ReviewItem.tsx             # avatar · name · date · StarRating · content
├── lib/
│   ├── useReviews.ts              # accumulation hook (append pages; reset on filter)
│   ├── useReviewSummary.ts        # one-shot summary fetch (reuse shared useQuery)
│   ├── rating-bands.ts            # band defs: 5=Excellent(green)…1=Poor; star↔band map
│   └── format-date.ts            # Intl.DateTimeFormat → "March 11, 2024"
└── index.ts
```

### 5.2 The accumulation hook (`lib/useReviews.ts`) — why `useQuery` isn't enough
`shared/lib/use-query` **replaces** data on each fetch, so it cannot append pages.
`useReviews` owns:

```
state: { items: Review[]; page: number; total: number; status: 'loading'|'error'|'success' }
perPage = useMediaQuery('(min-width: 768px)') ? 12 : 10   // per guide
actions:
  loadMore()        → fetch page+1, APPEND to items
  setFilter(rating) → reset page=0 & items=[], fetch, then smooth-scroll list to top
  hasMore = items.length < total
```

Guard stale responses (an `active`/request-id flag, as `useQuery` already does).
`total` comes from the response `count` (filtered), so *Show N more* shows the right
remaining number and hides at the end.

### 5.3 Rating bands & filter (`RatingBands` + `ReviewSummary`)
- Band map: **5 Excellent · 4 Good** → `--color-success`; **3 Average** → `--color-star`;
  **2 Below Average** → `--color-warning`; **1 Poor** → neutral/`--color-line`
  (confirm exact hues against Figma; tokens above are the closest existing ones).
- Bar = pure CSS: outer track + inner fill `width: {pct}%` (`pct = count/total*100`).
- Each band is a `role="button"`/checkbox-like toggle. Active band label uses
  `--color-brand`; **Clear filter** link shows only when a filter is active (mirrors
  Figma `Filter active`). Clicking a band calls `setFilter(star)`.

### 5.4 Review row (`ReviewItem`)
`Avatar` (image → initials fallback like "NC"), name, right-aligned formatted date,
read-only `StarRating`, content. Reuse the existing `StarRating` in its non-interactive
mode for the fractional/rounded stars.

### 5.5 States
- **Loading:** skeleton rows (summary can render as soon as its own fetch resolves).
- **Error:** inline retry message inside the dialog.
- **Empty (no reviews):** the "No reviews yet! / Be the first to review this product"
  panel with the chat icon (Figma Empty state). Bands render at 0%.
- **Empty under filter:** "No {band} reviews" with a *Clear filter* affordance.

### 5.6 Integration into the product page
- `ProductDetailsSection` / `ProductDetails` owns an `open` state for the dialog.
- The existing `StarRating` "See all N reviews" link becomes the dialog trigger
  (`onClick` → open), passing `productId`. `writeReviewHref` → opens dialog focused on
  *Write a review* (Phase 2) or the same dialog for now.
- The product page loader already provides `reviews.average` + `reviews.count` for the
  trigger label; the dialog fetches list + full distribution on open (D2/D3).
- **Phase 2 (optional):** add file route `routes/products/$productId/reviews.tsx` with a
  TanStack loader for SSR/deep-linking, rendering the same widget full-page.

### 5.7 Frontend testing
- `rstest` + Testing Library: `useReviews` append/reset/hasMore; `RatingBands` percent
  math + active/clear filter; `Avatar` fallback; empty/error rendering; date format.
- Storybook stories for `Avatar`, `Dialog`, `RatingBands`, `ReviewItem`, and the widget
  in default/empty/filtered/loading states (matches the 3 design states × breakpoints).

---

## 6. End-to-end data flow

```
Product page (SSR loader) ──▶ GET /api/v1/products/:id      (already: rating, reviews count)
        │  user clicks "See all N reviews"
        ▼
ProductReviewsDialog (client) opens
   ├─▶ GET /api/v1/products/:id/reviews/summary            → overall + distribution (bands)
   └─▶ GET /api/v1/products/:id/reviews?page=0&limit=12    → first page (data + filtered count)
        │  click a rating band → setFilter(r): reset, GET …?page=0&rating=r ; scroll top
        │  click "Show N more" → loadMore(): GET …?page=n+1 ; append
        ▼
   Renders summary (left) + accumulated list (right) + Show-more / empty states
```

Client `apiGet` already routes relative `/api/...` through the SSR express proxy (browser)
or an absolute `API_URL` (SSR) — reused unchanged.

---

## 7. Phased implementation plan

**Phase 0 — Data (backend):**
1. Migration `review_authors`; seed authors from `users.json`; verify author coverage;
   add optional FK.

**Phase 1 — Backend read API:**
2. `modules/review/` slice: domain types, repo port + adapter (list + summary), mapper.
3. DTOs (list paginated, summary) + query handlers (`find-product-reviews`, `get-review-summary`).
4. Routes `GET …/reviews` and `GET …/reviews/summary`; wire DI; unit + e2e tests; `pnpm check`.

**Phase 2 — Frontend read UI:**
5. `shared/ui/avatar` + `shared/ui/dialog` (+ Storybook).
6. `entities/review` (types + 2 api fns).
7. `widgets/product-reviews`: `useReviews` accumulation hook, `RatingBands`, `ReviewSummary`,
   `ReviewItem`, `ReviewList`, `ProductReviewsDialog`.
8. Wire the dialog into `ProductDetailsSection` via the `StarRating` trigger; states +
   responsive page sizes; tests.

**Phase 3 — Enhancements (optional):**
9. `Write a review` POST/command (server) + form (client).
10. Deep-linkable SSR `/products/:id/reviews` route.
11. List virtualization if review volume grows (guide §"Further considerations").

---

## 8. Open decisions to confirm before build

| # | Decision | Recommendation |
|---|---|---|
| D1 | Author identity source | New `review_authors` table seeded from `users.json` |
| D2 | Where the distribution lives | Dedicated `…/reviews/summary` endpoint |
| D3 | Modal vs. dedicated route | Modal (client-fetch on open); route is Phase 2 |
| D4 | *Write a review* scope | Defer to Phase 2 (read-only v1) |
| — | Unknown-product behavior | 404 (matches `find-product`) |
| — | Exact band bar colors | Confirm hues vs. Figma; map to existing tokens |

---

*Next step:* on approval of §3/§8, use `/sc:implement` starting at Phase 0.

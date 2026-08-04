# Storefront page (product details page integration)

Source: GreatFrontend "E-Commerce Website" storefront challenge.
Local guide: `examples/product-details/guide.md`.

## Figma nodes (for MCP design check)

File: `NjE3TsenQbpPeAcEwKGY9W` (product-details-page-figma)

- https://www.figma.com/design/NjE3TsenQbpPeAcEwKGY9W/product-details-page-figma?node-id=1-2386&m=dev
- https://www.figma.com/design/NjE3TsenQbpPeAcEwKGY9W/product-details-page-figma?node-id=5-6578&m=dev
- https://www.figma.com/design/NjE3TsenQbpPeAcEwKGY9W/product-details-page-figma?node-id=5-6592&m=dev
- https://www.figma.com/design/NjE3TsenQbpPeAcEwKGY9W/product-details-page-figma?node-id=5-6606&m=dev

## Implementation requirements

The requirements of each composed component remain as stated in their
individual briefs; their functionality must stay intact after integration:

- Navbar (E-Commerce)
- Product Details Section
- Product Specifications Section
- Product Grid Section
- Footer (Multi-column)

### Page level

- Page layout rules: standard page margin and padding per the design
  specifications, including spacing between sections.
- Static copy and asset alignment: assets, icons, or copy may differ from the
  original component briefs; align them with this design.
- Placeholders: redirection links may stay empty for unspecified buttons or
  links.
- Cross-browser and device compatibility: Chrome, Firefox, Safari, and all
  stated device breakpoints.

### Dynamic content integration

- Navbar: display the current number of items in the cart, updating in real
  time as items are added or removed.
- Product Details: display the details of the current product: name, images,
  prices, reviews, variants, and features (accordion).
- Shopping Cart: adding an item increases the number on the cart icon
  accordingly.
- Product Specifications Section: all products show the same specifications
  section as per the design.
- "In this collection" section: latest created items from the current
  product's collection, excluding the current product.

## Decisions (grilling session, 2026-08-04)

- Cart is a server-side CRUD module (`apps/server/src/modules/cart`) following
  the existing CQRS vertical-slice pattern, overriding the guide's
  localStorage-only recommendation. The cart is anonymous: the server issues a
  `cart_id` persisted on the client.
- The `cart_id` lives in localStorage, not a cookie. The navbar badge is
  therefore absent from server-rendered HTML and appears after hydration via a
  client-side React Query fetch. In-memory cache is the source of truth;
  localStorage stores only the identifier (per the techniques in
  master.dev "TODO app step 5": storage as a sync target, not as state).
- Cart client state is managed with TanStack Query (already installed): the
  cart is server state under one query key; add/update/remove mutations update
  that key; the navbar badge subscribes to the same cache. No separate cart
  context or SWR.
- The navbar badge shows total units (the sum of all line quantities), not the
  number of distinct SKUs. A cart line is one inventory item (SKU: a specific
  color and size) plus a quantity.
- Cart creation is implicit: an add-item request without a known `cart_id`
  creates the cart and returns its id; the client stores it. On a 404 for a
  stale `cart_id`, the client discards the id and retries, minting a fresh
  cart. No explicit create-cart endpoint.
- Figma nodes verified: 1-2386 is the style guide; 5-6578/5-6592/5-6606 are
  Desktop/Tablet/Mobile pages composed of Header Navigation, Section product
  details, Section product specification, Section category grid, Footer. The
  file contains no cart page or drawer, so this ticket ships no cart
  management UI beyond the details-section quantity stepper ("Cart Control"
  in the style guide), the Add to cart action, and the navbar badge. Remove
  and update-quantity stay API-level, covered by tests; a cart page is a
  future ticket.
- "In this collection" is served by extending `GET /api/products` with
  optional `collection` and `exclude` query parameters, reusing the
  newest-first ordering and `ProductListItemDto` cards; `collection` is added
  to the product response DTO so the details page knows which collection to
  request. No dedicated related-products endpoint. The section's item count
  is read from the Figma design context during implementation.
- Stock is enforced on add and update: pushing a line's quantity above the
  SKU's current stock, or adding an out-of-stock SKU, is rejected with a 409
  Conflict (`ConflictException`). The client disables the stepper increment at
  the cap. A cart line stores only `sku` and `quantity`; prices are never
  snapshotted. The get-cart response includes the computed total units for
  the navbar badge.
- Product listings live only on `/products`. The home route drops the Latest
  Arrivals grid and its product fetch, keeping the hero section with the
  "Shop now" link to `/products`.
- The products seed already carries the storefront starter dataset (19
  products: urban 7, fresh 8, cozy 4); regenerating from
  `examples/product-details/product-details-page/data` reproduces it byte for
  byte (verified 2026-08-04 during #37). The generator's default input is
  repointed there because the old `assets/product-details-section/data` no
  longer exists. The stale 11-product state existed only in local databases
  seeded before the dataset update; rolling seeds back and re-applying
  refreshes them.
- All starter JSON entities receive tables (amended 2026-08-04): `collections`
  and `categories` are created with FKs from `products.collection` and
  `products.category`. Their reference rows are embedded in the migration
  itself rather than a seed (decided during #37): dbmate runs all migrations
  before any seeds, so seed-provided rows would leave the FKs invalid on any
  already-seeded database, including the deployed one. The starter's
  `users.json` maps to the existing `review_authors` table; no new table is
  needed there. This ticket adds no API surface for
  collections or categories: the section header remains the static copy "In
  this collection", and the name/image columns wait for a future feature.
- Spec published as GitHub issue #36 (`ready-for-agent`).
- Tickets (all `ready-for-agent`, native blocked-by links): #37 catalog
  groundwork, #38 cart CRUD API, #39 add-to-cart UI + badge (blocked by #38),
  #40 "In this collection" (blocked by #37), #41 consolidation + breakpoint
  fidelity (blocked by #39 and #40).

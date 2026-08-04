# 2. Server-side anonymous cart

Date: 2026-08-04

## Status

Accepted

## Context

The storefront ticket requires a shopping cart whose count appears in the
navbar and updates as items are added or removed. The GreatFrontend guide for
this challenge (`examples/product-details/guide.md`) recommends storing the
cart entirely in localStorage and states that a database-backed cart "is not
applicable for this challenge". The repository, however, has consistently
exceeded the challenge's frontend-only minimum: newsletter subscription,
reviews, and specifications all became Fastify CQRS modules backed by
Postgres, because the mission of this repo is practicing full-stack patterns,
not merely passing the challenge. The repo has no authentication; the `users`
table is an unused placeholder.

## Decision

The cart is a server-side CRUD module (`apps/server/src/modules/cart`)
following the existing CQRS vertical-slice pattern, with an anonymous
identity: the server issues a `cart_id` on the first add-item request
(implicit creation), and the client persists that identifier in localStorage.
localStorage therefore stores only the id, never the cart contents. Cart
lines store `sku` and `quantity` only; prices are joined from inventory, not
snapshotted. Stock is enforced on add and update with a 409 Conflict.

## Consequences

- The cart survives across browsers only per device (the id is local), and is
  lost if localStorage is cleared; acceptable while no auth exists. When auth
  arrives, carts can be attached to users by adding an owner column, without
  changing the API shape.
- The navbar badge cannot be server-rendered on first paint, because the id
  lives in localStorage; it appears after hydration via a TanStack Query
  fetch. Choosing a cookie instead would have required forwarding the Cookie
  header through the express proxy and every SSR loader; that plumbing was
  judged not worth the first-paint badge.
- Empty carts never accumulate, since creation is implicit on first add.
- A stale or deleted `cart_id` is self-healing: the client discards the id on
  a cart 404 and retries, minting a fresh cart.

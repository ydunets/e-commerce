# 3. Mutating stock validation on the cart

Date: 2026-08-26

## Status

Accepted

## Context

The shopping cart brief requires stock validation at two moments: when a
cart line's quantity changes, and when the shopper clicks Checkout. In both
cases the user sees an "Insufficient stock" modal and, after confirming it,
the cart must hold the corrected values. The write path already rejects
oversold quantities with a 409 Conflict, but that guard only covers the SKU
being written; a stock change elsewhere in the cart surfaces nowhere. A
client that re-submits clamped quantities itself can race a second stock
change and be rejected again, indefinitely in the worst case.

## Decision

`POST /api/v1/carts/:cartId/validate` performs the stock reconciliation
server-side and is deliberately a mutation despite its name, which follows
the brief's vocabulary. In one transaction it clamps every oversold cart
line to the current stock and removes lines whose stock reached zero, then
answers the corrected cart together with a change report (sku, name,
previous quantity, new quantity, stock) that the modal renders. Write-path
409 responses additionally carry a structured `details` payload with the
requested and available amounts, so the per-line modal needs no follow-up
request.

## Consequences

- The server is the single authority for corrections: the client never
  re-submits clamped quantities, so the race between correction and a
  concurrent stock change disappears at the API boundary.
- A validate call on a cart whose lines all fit is a no-op that writes
  nothing, so the endpoint is safe to call on every checkout attempt.
- The reconciliation reads stock and then writes without row locks, the
  same read-then-write trade the add-item path already takes; if
  concurrent oversells ever matter, the fix is locking the inventory rows
  or the deferred stock-reservation stretch goal, not a client change.
- The name "validate" understates the behavior; this record and the route
  description are the compensation for keeping the brief's terminology.

# Newsletter subscription is its own module, REST-only

## Status

accepted

## Context

The footer needs a newsletter signup. An email-only signup overlaps the existing `user` module, whose `create-user` command already accepts an email. We had to decide whether a newsletter signup is a User or a separate concept, and how much of the server's hexagonal/CQRS ceremony it inherits.

## Decision

A newsletter signup is a **Subscriber**, a distinct domain concept from **User** (see [CONTEXT.md](../../CONTEXT.md)). It lives in a new `newsletter` server module built to the same hexagonal shape as the others: Subscriber domain entity + domain service + domain errors, a repository port with a Postgres implementation, a mapper, a TypeBox schema, and a `subscribe` command routed through the commandBus/eventBus. Subscribers persist to a new `subscribers` table (dbmate migration, `UNIQUE(email)`), mirroring the users table. The API surface is **REST only** (`POST /v1/newsletter/subscriptions`); unlike `create-user`, it ships no GraphQL mutation.

## Consequences

- A User (customer with a shipping address) and a Subscriber (marketing opt-in, email only) never get conflated; marketing consent stays out of the account aggregate.
- The module reads like every other module, so a reviewer sees a familiar shape.
- GraphQL is deliberately omitted because nothing consumes a newsletter mutation; add it later if a GraphQL client needs it, rather than carrying an unused surface now.
- Re-subscribing an already-subscribed email returns success (200), not 409: the handler swallows the unique-constraint conflict. This diverges from `create-user`'s 409-on-duplicate on purpose, because re-subscribing is harmless and a 409 would let a caller enumerate which emails are subscribed.

-- migrate:up
-- Display identity for product review authors. `product_reviews.user_id` stores a
-- slug (e.g. 'natali-craig'); this table supplies the name + optional avatar shown in
-- the reviews UI. Kept separate from the auth `users` table on purpose: review authors
-- are a distinct bounded context (display-only) from account/address users.
CREATE TABLE "review_authors" (
  "user_id"    character varying NOT NULL,
  "name"       character varying NOT NULL,
  "avatar_url" text,
  CONSTRAINT "PK_review_authors" PRIMARY KEY ("user_id")
);

-- FK product_reviews.user_id -> review_authors.user_id is intentionally deferred.
-- dbmate applies all migrations before any seeds, so adding it here would fail on an
-- already-seeded database (product_reviews is populated by the products seed, while
-- review_authors is populated by a later seed step). Author coverage is verified
-- (every review user_id exists in review_authors, 0 orphans), so the reviews repo can
-- safely INNER JOIN without the constraint. Add the FK in a follow-up migration only
-- after review_authors is guaranteed populated on every target environment.

-- migrate:down
DROP TABLE "review_authors";

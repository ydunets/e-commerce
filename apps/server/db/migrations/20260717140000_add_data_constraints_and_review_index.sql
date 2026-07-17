-- migrate:up
-- Guards row invariants the API layer cannot enforce: fast-json-stringify
-- serializes responses without validating enum/range keywords, so a bad row
-- would otherwise flow straight to the client.
ALTER TABLE "product_reviews"
  ADD CONSTRAINT "CHK_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5);

-- Keep this list in sync with SPECIFICATION_ICONS in packages/contracts/src/specification.ts.
ALTER TABLE "specification_features"
  ADD CONSTRAINT "CHK_features_icon" CHECK ("icon" IN (
    'recycle-line', 'paint-line', 'plant-line', 'water-flash-line',
    't-shirt-line', 'hand-heart-line', 'windy-line', 'color-filter-line',
    'stack-line', 'scales-2-line', 'shield-star-line', 'price-tag-2-line',
    'rainbow-line', 'shirt-line', 'infinity-fill', 'shapes-line'
  ));

-- Covers the paginated reviews query (WHERE product_id ... ORDER BY created_at
-- DESC, id DESC) and supersedes the single-column IDX_reviews_product prefix.
CREATE INDEX "IDX_reviews_product_created"
  ON "product_reviews" ("product_id", "created_at" DESC, "id" DESC);
DROP INDEX "IDX_reviews_product";

-- migrate:down
CREATE INDEX "IDX_reviews_product" ON "product_reviews" ("product_id");
DROP INDEX "IDX_reviews_product_created";
ALTER TABLE "specification_features" DROP CONSTRAINT "CHK_features_icon";
ALTER TABLE "product_reviews" DROP CONSTRAINT "CHK_reviews_rating";

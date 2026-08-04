-- migrate:up

-- Collections and categories are reference data: their rows are embedded here
-- rather than in a seed because dbmate applies all migrations before any
-- seeds, so the FKs below would fail on an already-seeded database whose
-- products reference rows a later seed has not inserted yet.
CREATE TABLE "collections" (
  "collection_id" character varying NOT NULL,
  "name" character varying NOT NULL,
  "description" text NOT NULL,
  "image_url" text NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_collections" PRIMARY KEY ("collection_id")
);

CREATE TABLE "categories" (
  "category_id" character varying NOT NULL,
  "name" character varying NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_categories" PRIMARY KEY ("category_id")
);

INSERT INTO "collections" ("collection_id", "name", "description", "image_url", "created_at") VALUES
  ('cozy', 'Cozy Comfort', 'Plush fabrics and soothing designs', 'https://vaqybtnqyonvlwtskzmv.supabase.co/storage/v1/object/public/e-commerce-track-images/collections/cozy-comfort.jpg', '2024-01-01'),
  ('urban', 'Urban Oasis', 'For the city dwellers', 'https://vaqybtnqyonvlwtskzmv.supabase.co/storage/v1/object/public/e-commerce-track-images/collections/urban-oasis.jpg', '2024-01-01'),
  ('fresh', 'Fresh Fusion', 'Contemporary styles and patterns', 'https://vaqybtnqyonvlwtskzmv.supabase.co/storage/v1/object/public/e-commerce-track-images/collections/fresh-fusion.jpg', '2024-01-01');

INSERT INTO "categories" ("category_id", "name", "created_at") VALUES
  ('men', 'Men', '2024-01-01'),
  ('women', 'Women', '2024-01-01'),
  ('unisex', 'Unisex', '2024-01-01');

ALTER TABLE "products"
  ADD CONSTRAINT "FK_products_collection" FOREIGN KEY ("collection")
    REFERENCES "collections"("collection_id"),
  ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category")
    REFERENCES "categories"("category_id");

-- migrate:down
ALTER TABLE "products"
  DROP CONSTRAINT "FK_products_collection",
  DROP CONSTRAINT "FK_products_category";
DROP TABLE "collections";
DROP TABLE "categories";

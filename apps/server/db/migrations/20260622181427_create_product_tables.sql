-- migrate:up
CREATE TABLE "products" (
  "product_id" character varying NOT NULL,
  "name" character varying NOT NULL,
  "description" text NOT NULL,
  "category" character varying NOT NULL,
  "collection" character varying NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_products" PRIMARY KEY ("product_id")
);

CREATE TABLE "product_inventory" (
  "sku" character varying NOT NULL,
  "product_id" character varying NOT NULL,
  "color" character varying NOT NULL,
  "size" character varying,
  "list_price" numeric NOT NULL,
  "discount_percentage" integer,
  "sale_price" numeric NOT NULL,
  "stock" integer NOT NULL DEFAULT 0,
  "sold" integer NOT NULL DEFAULT 0,
  CONSTRAINT "PK_product_inventory" PRIMARY KEY ("sku"),
  CONSTRAINT "FK_inventory_product" FOREIGN KEY ("product_id")
    REFERENCES "products"("product_id") ON DELETE CASCADE
);

CREATE TABLE "product_images" (
  "id" SERIAL PRIMARY KEY,
  "product_id" character varying NOT NULL,
  "color" character varying NOT NULL,
  "image_url" text NOT NULL,
  CONSTRAINT "FK_images_product" FOREIGN KEY ("product_id")
    REFERENCES "products"("product_id") ON DELETE CASCADE
);

CREATE TABLE "product_info" (
  "id" SERIAL PRIMARY KEY,
  "product_id" character varying NOT NULL,
  "title" character varying NOT NULL,
  "description" text[] NOT NULL,
  CONSTRAINT "FK_info_product" FOREIGN KEY ("product_id")
    REFERENCES "products"("product_id") ON DELETE CASCADE
);

CREATE TABLE "product_reviews" (
  "id" SERIAL PRIMARY KEY,
  "product_id" character varying NOT NULL,
  "user_id" character varying NOT NULL,
  "rating" integer NOT NULL,
  "content" text,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "FK_reviews_product" FOREIGN KEY ("product_id")
    REFERENCES "products"("product_id") ON DELETE CASCADE
);

CREATE INDEX "IDX_inventory_product" ON "product_inventory" ("product_id");
CREATE INDEX "IDX_images_product" ON "product_images" ("product_id");
CREATE INDEX "IDX_info_product" ON "product_info" ("product_id");
CREATE INDEX "IDX_reviews_product" ON "product_reviews" ("product_id");

-- migrate:down
DROP TABLE "product_reviews";
DROP TABLE "product_info";
DROP TABLE "product_images";
DROP TABLE "product_inventory";
DROP TABLE "products";


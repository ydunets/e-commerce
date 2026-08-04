-- migrate:up

-- Anonymous server-side cart (ADR 0002): created implicitly on first add-item,
-- identified by a server-issued uuid the client stores in localStorage.
-- Lines store sku + quantity only; prices are joined from inventory at read
-- time, never snapshotted.
CREATE TABLE "carts" (
  "cart_id" uuid NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_carts" PRIMARY KEY ("cart_id")
);

CREATE TABLE "cart_lines" (
  "cart_id" uuid NOT NULL,
  "sku" character varying NOT NULL,
  "quantity" integer NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_cart_lines" PRIMARY KEY ("cart_id", "sku"),
  CONSTRAINT "FK_cart_lines_cart" FOREIGN KEY ("cart_id")
    REFERENCES "carts"("cart_id") ON DELETE CASCADE,
  -- CASCADE rather than RESTRICT so the documented seed rollback/reapply
  -- workflow (which deletes product_inventory rows) is not blocked by live
  -- carts; a vanished SKU silently drops its cart lines.
  CONSTRAINT "FK_cart_lines_inventory" FOREIGN KEY ("sku")
    REFERENCES "product_inventory"("sku") ON DELETE CASCADE,
  CONSTRAINT "CHK_cart_lines_quantity" CHECK ("quantity" > 0)
);

-- migrate:down
DROP TABLE "cart_lines";
DROP TABLE "carts";

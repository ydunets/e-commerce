-- migrate:up

-- Coupon catalog: a closed set with existence-only validation. The rows are
-- embedded in the migration rather than a seed so the cart_coupons FK stays
-- safe under the migrations-before-seeds ordering, on fresh and already
-- seeded databases alike.
CREATE TABLE "coupons" (
  "code" character varying NOT NULL,
  "discount_type" character varying NOT NULL,
  "value" numeric NOT NULL,
  CONSTRAINT "PK_coupons" PRIMARY KEY ("code"),
  CONSTRAINT "CHK_coupons_discount_type" CHECK ("discount_type" IN ('percentage', 'fixed')),
  CONSTRAINT "CHK_coupons_value" CHECK ("value" > 0)
);

INSERT INTO "coupons" ("code", "discount_type", "value") VALUES
  ('WELCOME15', 'percentage', 15),
  ('SAVE20', 'fixed', 20);

CREATE TABLE "cart_coupons" (
  "cart_id" uuid NOT NULL,
  "code" character varying NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_cart_coupons" PRIMARY KEY ("cart_id", "code"),
  CONSTRAINT "FK_cart_coupons_cart" FOREIGN KEY ("cart_id")
    REFERENCES "carts"("cart_id") ON DELETE CASCADE,
  CONSTRAINT "FK_cart_coupons_coupon" FOREIGN KEY ("code")
    REFERENCES "coupons"("code") ON DELETE CASCADE
);

-- migrate:down
DROP TABLE "cart_coupons";
DROP TABLE "coupons";

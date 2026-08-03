-- migrate:up
-- product_inventory had no ordinal column, unlike product_images/product_info,
-- so a multi-id ANY() lookup has no ORDER BY to fall back on and the planner
-- is free to return rows in any order once it stops favouring a sequential scan.
ALTER TABLE "product_inventory" ADD COLUMN "id" SERIAL;

-- migrate:down
ALTER TABLE "product_inventory" DROP COLUMN "id";

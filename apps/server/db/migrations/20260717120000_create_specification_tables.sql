-- migrate:up
CREATE TABLE "specifications" (
  "specification_id" character varying NOT NULL,
  "label" character varying NOT NULL,
  "title" character varying NOT NULL,
  "description" text NOT NULL,
  "image_url" text NOT NULL,
  "image_alt" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_specifications" PRIMARY KEY ("specification_id")
);

CREATE TABLE "specification_features" (
  "id" SERIAL PRIMARY KEY,
  "specification_id" character varying NOT NULL,
  "icon" character varying NOT NULL,
  "label" character varying NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  CONSTRAINT "FK_features_specification" FOREIGN KEY ("specification_id")
    REFERENCES "specifications"("specification_id") ON DELETE CASCADE
);

CREATE INDEX "IDX_features_specification" ON "specification_features" ("specification_id");

-- migrate:down
DROP TABLE "specification_features";
DROP TABLE "specifications";

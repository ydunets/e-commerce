-- migrate:up
CREATE TABLE "subscribers" (
  "id" character varying NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "email" character varying NOT NULL,
  CONSTRAINT "UQ_subscribers_email" UNIQUE ("email"),
  CONSTRAINT "PK_subscribers" PRIMARY KEY ("id")
)

-- migrate:down
DROP TABLE "subscribers"

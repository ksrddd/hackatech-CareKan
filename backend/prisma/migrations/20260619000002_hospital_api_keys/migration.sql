-- Drop old API key request tables (replaced by hospital_api_keys).
-- Cascade removes FK constraints between them automatically.
DROP TABLE IF EXISTS "api_key_usage_logs" CASCADE;
DROP TABLE IF EXISTS "api_keys" CASCADE;
DROP TABLE IF EXISTS "api_key_requests" CASCADE;

-- Drop enums that belonged to the old tables
DROP TYPE IF EXISTS "ApiKeyRequestStatus";
DROP TYPE IF EXISTS "ApiKeyScope";

-- CreateTable: hospital_api_keys
-- Simple pre-issued keys scoped to a single hospital, issued by admins.
CREATE TABLE "hospital_api_keys" (
    "id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'hospital_write',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "hospital_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_api_keys_hash_key" ON "hospital_api_keys"("hash");

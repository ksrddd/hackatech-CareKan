-- CreateEnum
CREATE TYPE "ApiKeyRequestStatus" AS ENUM ('pending_email', 'email_verified', 'approved', 'rejected', 'revoked');

-- CreateEnum
CREATE TYPE "ApiKeyScope" AS ENUM ('read_queue');

-- CreateTable
CREATE TABLE "api_key_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "staff_full_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "organization_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "reference_number" TEXT,
    "purpose" TEXT NOT NULL,
    "drive_links" TEXT[],
    "status" "ApiKeyRequestStatus" NOT NULL DEFAULT 'pending_email',
    "verification_token_hash" TEXT,
    "verification_expires_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "scope" "ApiKeyScope" NOT NULL DEFAULT 'read_queue',
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_usage_logs" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status_code" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_key_requests_user_id_status_idx" ON "api_key_requests"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_hash_key" ON "api_keys"("hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_request_id_idx" ON "api_keys"("request_id");

-- CreateIndex
CREATE INDEX "api_key_usage_logs_api_key_id_created_at_idx" ON "api_key_usage_logs"("api_key_id", "created_at");

-- AddForeignKey
ALTER TABLE "api_key_requests" ADD CONSTRAINT "api_key_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "api_key_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_usage_logs" ADD CONSTRAINT "api_key_usage_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

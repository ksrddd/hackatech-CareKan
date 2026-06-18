/*
  Warnings:

  - You are about to drop the column `checked_in_at` on the `reserves` table. All the data in the column will be lost.
  - You are about to drop the column `current_station_id` on the `reserves` table. All the data in the column will be lost.
  - You are about to drop the column `queue_updated_at` on the `reserves` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `hospital_patient_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `insurance_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `insurance_right` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `primary_hospital_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profile_image` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reserves" DROP COLUMN "checked_in_at",
DROP COLUMN "current_station_id",
DROP COLUMN "queue_updated_at";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
DROP COLUMN "hospital_patient_id",
DROP COLUMN "insurance_id",
DROP COLUMN "insurance_right",
DROP COLUMN "primary_hospital_id",
DROP COLUMN "profile_image",
DROP COLUMN "role",
DROP COLUMN "username";

-- DropEnum
DROP TYPE "Role";

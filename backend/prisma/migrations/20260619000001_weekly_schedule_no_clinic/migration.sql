-- Truncate existing data; CASCADE also empties reserves (FK reference to schedules)
-- This clears old per-hospital/clinic/date rows before the schema change.
TRUNCATE TABLE "schedules" CASCADE;

-- Drop FK from schedules to hospitals (schedules are no longer per-hospital)
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_hospital_id_fkey";

-- Drop old indexes on schedules
DROP INDEX "schedules_hospital_id_clinic_date_idx";
DROP INDEX "schedules_hospital_id_clinic_date_start_time_key";

-- Drop old index on reserves
DROP INDEX "reserves_hospital_id_schedule_id_idx";

-- Transform schedules: drop old columns, add day_of_week
ALTER TABLE "schedules"
  DROP COLUMN "hospital_id",
  DROP COLUMN "clinic",
  DROP COLUMN "date",
  DROP COLUMN "current_booked",
  DROP COLUMN "is_full",
  ADD COLUMN "day_of_week" INTEGER NOT NULL;

-- Unique constraint and index for the shared weekly template
CREATE UNIQUE INDEX "slot_identity" ON "schedules"("day_of_week", "start_time");
CREATE INDEX "schedules_day_of_week_idx" ON "schedules"("day_of_week");

-- Add date to reserves (stores the actual booking date chosen by the user)
ALTER TABLE "reserves" ADD COLUMN "date" TEXT NOT NULL;

-- New composite index for capacity queries
CREATE INDEX "reserves_hospital_id_schedule_id_date_idx" ON "reserves"("hospital_id", "schedule_id", "date");

-- Drop ClinicCode enum (no longer used)
DROP TYPE "ClinicCode";

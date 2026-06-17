-- CreateEnum
CREATE TYPE "Role" AS ENUM ('citizen', 'admin');

-- CreateEnum
CREATE TYPE "InsuranceRight" AS ENUM ('uc', 'sso', 'csmbs', 'self_pay');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female', 'unspecified');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('opd', 'new_patient', 'checkup', 'follow_up', 'lab', 'medication', 'elderly');

-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('inner', 'north', 'south', 'east', 'thon_north', 'thon_south');

-- CreateEnum
CREATE TYPE "ClinicCode" AS ENUM ('med', 'surg', 'ped', 'ob', 'ortho', 'eye', 'ent', 'dent', 'skin', 'ncd', 'psych');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "national_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profile_image" TEXT,
    "password" TEXT NOT NULL,
    "address" TEXT,
    "insurance_id" TEXT,
    "insurance_right" "InsuranceRight" NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'citizen',
    "birth_date" TEXT NOT NULL,
    "sex" "Sex" NOT NULL DEFAULT 'unspecified',
    "primary_hospital_id" TEXT,
    "hospital_patient_id" TEXT,
    "consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hospital_name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "zone" "Zone" NOT NULL,
    "phone" TEXT NOT NULL,
    "opening_hours" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "services" "ServiceType"[],
    "rights_accepted" "InsuranceRight"[],
    "mock_distance_km" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "clinic" "ClinicCode" NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "max_capacity" INTEGER NOT NULL,
    "current_booked" INTEGER NOT NULL DEFAULT 0,
    "is_full" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserves" (
    "id" TEXT NOT NULL,
    "booking_code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "purpose" "ServiceType" NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'confirmed',
    "queue_number" TEXT NOT NULL,
    "current_station_id" INTEGER,
    "queue_updated_at" TIMESTAMP(3),
    "checked_in_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_national_id_key" ON "users"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_code_key" ON "hospitals"("code");

-- CreateIndex
CREATE INDEX "schedules_hospital_id_clinic_date_idx" ON "schedules"("hospital_id", "clinic", "date");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_hospital_id_clinic_date_start_time_key" ON "schedules"("hospital_id", "clinic", "date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "reserves_booking_code_key" ON "reserves"("booking_code");

-- CreateIndex
CREATE INDEX "reserves_hospital_id_schedule_id_idx" ON "reserves"("hospital_id", "schedule_id");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

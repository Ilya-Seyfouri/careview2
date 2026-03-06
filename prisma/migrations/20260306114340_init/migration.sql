-- CreateEnum
CREATE TYPE "Role" AS ENUM ('carer', 'manager', 'family');

-- CreateEnum
CREATE TYPE "EmarStatus" AS ENUM ('due', 'missed', 'given');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('falls', 'medication', 'nutrition', 'other');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('AM_PM', 'PM_AM');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID,
    "related_to" UUID,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_analysis_sessions" (
    "id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "priority_list" JSONB NOT NULL,

    CONSTRAINT "care_analysis_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completed_care_actions" (
    "id" UUID NOT NULL,
    "patient_id" UUID,
    "action_type" TEXT NOT NULL,
    "completed_by" UUID,
    "completed_at" TIMESTAMPTZ,
    "notes" TEXT,

    CONSTRAINT "completed_care_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emar" (
    "id" UUID NOT NULL,
    "patient_id" UUID,
    "medication_name" TEXT,
    "medication_mg" INTEGER,
    "time_to_take" TEXT,
    "status" "EmarStatus",
    "recorded_at" TIMESTAMPTZ,

    CONSTRAINT "emar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "sender_id" UUID NOT NULL,
    "carer_id" UUID,
    "family_id" UUID,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_carers" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "carer_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_carers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_family" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "relationship" TEXT,
    "linked_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "dob" DATE,
    "room" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "wing" TEXT,
    "language" TEXT,
    "blood" TEXT,
    "health_summary" TEXT,
    "pulse" INTEGER,
    "bp" INTEGER,
    "key_health_indicator" TEXT,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "type" "ReportType",
    "date" TIMESTAMPTZ,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "created_by" UUID,
    "start_at" TIMESTAMPTZ NOT NULL,
    "status" "ScheduleStatus",
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "required_tasks" TEXT,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_handovers" (
    "id" UUID NOT NULL,
    "shift_type" "ShiftType" NOT NULL,
    "notes" TEXT,
    "patient_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "patient_notes" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_logs" (
    "id" UUID NOT NULL,
    "schedule_id" UUID,
    "patient_id" UUID NOT NULL,
    "carer_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "appetite" TEXT,
    "mood" TEXT,

    CONSTRAINT "visit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_analysis_sessions" ADD CONSTRAINT "care_analysis_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_care_actions" ADD CONSTRAINT "completed_care_actions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_care_actions" ADD CONSTRAINT "completed_care_actions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emar" ADD CONSTRAINT "emar_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_carer_id_fkey" FOREIGN KEY ("carer_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_carers" ADD CONSTRAINT "patient_carers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_carers" ADD CONSTRAINT "patient_carers_carer_id_fkey" FOREIGN KEY ("carer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_family" ADD CONSTRAINT "patient_family_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_family" ADD CONSTRAINT "patient_family_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_logs" ADD CONSTRAINT "visit_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_logs" ADD CONSTRAINT "visit_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_logs" ADD CONSTRAINT "visit_logs_carer_id_fkey" FOREIGN KEY ("carer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

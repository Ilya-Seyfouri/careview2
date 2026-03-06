-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "carer_id" UUID,
ADD COLUMN     "end_at" TIMESTAMPTZ;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_carer_id_fkey" FOREIGN KEY ("carer_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

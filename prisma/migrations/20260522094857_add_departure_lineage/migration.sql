-- AlterTable
ALTER TABLE "trek_departures" ADD COLUMN     "rescheduledFromId" UUID;

-- AddForeignKey
ALTER TABLE "trek_departures" ADD CONSTRAINT "trek_departures_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "trek_departures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

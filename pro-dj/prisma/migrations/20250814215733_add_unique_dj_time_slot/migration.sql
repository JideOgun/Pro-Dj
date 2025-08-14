/*
  Warnings:

  - A unique constraint covering the columns `[djId,startTime,endTime,status]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_djId_startTime_endTime_status_key" ON "public"."Booking"("djId", "startTime", "endTime", "status");

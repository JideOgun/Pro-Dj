-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "checkoutSessionId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "public"."Booking"("status");

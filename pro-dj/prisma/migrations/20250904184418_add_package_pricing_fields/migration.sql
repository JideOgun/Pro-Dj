/*
  Warnings:

  - A unique constraint covering the columns `[eventType,packageType]` on the table `ProDjServicePricing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ProDjServicePricing_eventType_key";

-- AlterTable
ALTER TABLE "public"."ProDjServicePricing" ADD COLUMN     "basePriceCents" INTEGER,
ADD COLUMN     "durationHours" INTEGER,
ADD COLUMN     "includes" TEXT[],
ADD COLUMN     "packageName" TEXT,
ADD COLUMN     "packageType" TEXT NOT NULL DEFAULT 'BASIC',
ALTER COLUMN "basePricePerHour" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."_BookingToProDjAddon" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookingToProDjAddon_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BookingToProDjAddon_B_index" ON "public"."_BookingToProDjAddon"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ProDjServicePricing_eventType_packageType_key" ON "public"."ProDjServicePricing"("eventType", "packageType");

-- AddForeignKey
ALTER TABLE "public"."_BookingToProDjAddon" ADD CONSTRAINT "_BookingToProDjAddon_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BookingToProDjAddon" ADD CONSTRAINT "_BookingToProDjAddon_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ProDjAddon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

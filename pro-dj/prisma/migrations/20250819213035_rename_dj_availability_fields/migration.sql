/*
  Warnings:

  - You are about to drop the column `isActive` on the `DjProfile` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `DjProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."DjProfile" DROP COLUMN "isActive",
DROP COLUMN "isVerified",
ADD COLUMN     "isAcceptingBookings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isApprovedByAdmin" BOOLEAN NOT NULL DEFAULT false;
